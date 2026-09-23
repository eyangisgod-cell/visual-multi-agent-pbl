/**
 * 游戏页面调试测试
 */

import { test, expect } from '@playwright/test';

test('调试游戏页面', async ({ page }) => {
  // 开启控制台日志
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // 访问登录页面
  await page.goto('http://localhost:3000/auth/login');
  await page.waitForTimeout(1000);

  // 登录
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'test123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  console.log('After login URL:', page.url());

  // 导航到游戏页面
  await page.goto('http://localhost:3000/game');

  // 等待并截图
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'test-results/debug-game.png' });

  // 检查页面内容
  const html = await page.content();
  console.log('Page HTML length:', html.length);

  // 检查是否有 game-container
  const gameContainer = await page.$('#game-container');
  console.log('Game container found:', !!gameContainer);

  // 检查认证状态
  const token = await page.evaluate(() => localStorage.getItem('token'));
  console.log('Token in localStorage:', token ? 'exists' : 'null');

  // 检查 AuthContext 状态
  const authState = await page.evaluate(() => {
    return {
      hasToken: !!localStorage.getItem('token'),
      tokenLength: localStorage.getItem('token')?.length
    };
  });
  console.log('Auth state:', authState);
});
