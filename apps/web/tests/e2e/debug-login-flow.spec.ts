/**
 * 登录流程调试测试
 */

import { test, expect } from '@playwright/test';

test('调试登录流程', async ({ page, request }) => {
  // 开启控制台日志
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // 访问登录页面
  await page.goto('http://localhost:3000/auth/login');
  await page.waitForTimeout(2000);

  // 检查 CSRF token
  const csrfToken = await page.evaluate(async () => {
    const response = await fetch('/api/csrf-token');
    const data = await response.json();
    return data.token;
  });
  console.log('CSRF Token:', csrfToken ? 'exists' : 'null');

  // 直接调用登录 API
  const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
    data: {
      username: 'testuser',
      password: 'test123456'
    }
  });

  console.log('Login status:', loginResponse.status());
  const loginData = await loginResponse.json();
  console.log('Login response:', JSON.stringify(loginData, null, 2));

  if (loginResponse.status() === 200 && loginData.token) {
    console.log('Token received:', loginData.token.substring(0, 20) + '...');

    // 设置 localStorage 并导航
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, loginData.token);

    // 导航到游戏页面
    await page.goto('http://localhost:3000/game');
    await page.waitForTimeout(5000);

    // 截图
    await page.screenshot({ path: 'test-results/game-after-login.png' });

    // 检查游戏容器
    const gameContainer = await page.$('#game-container');
    console.log('Game container found after login:', !!gameContainer);

    // 检查智能体层
    const agentLayer = await page.$('#e2e-agent-layer');
    console.log('Agent layer found:', !!agentLayer);

    // 验证智能体
    const agents = await page.$$('[data-testid^="agent-"]');
    console.log('Number of agents found:', agents.length);

    expect(agents.length).toBeGreaterThan(0);
  } else {
    console.log('Login failed:', loginData);
  }
});
