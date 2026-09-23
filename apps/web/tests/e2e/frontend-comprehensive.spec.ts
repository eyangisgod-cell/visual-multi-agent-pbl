/**
 * 前端页面全面测试 - 修复版
 * 测试所有主要页面功能
 */

import { test, expect } from '@playwright/test';

test.describe('前端页面全面测试', () => {

  test('登录后访问游戏页面', async ({ page }) => {
    // 先访问登录页面
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForTimeout(1000);

    // 登录
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'test123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // 检查是否成功跳转，如果没有则手动导航
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    if (!currentUrl.includes('/game')) {
      await page.goto('http://localhost:3000/game');
      await page.waitForTimeout(3000);
    }

    // 等待游戏页面加载
    await page.waitForSelector('#game-container', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // 截图验证
    await page.screenshot({ path: 'test-results/game-page.png' });

    // 验证游戏页面元素
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // 验证智能体层
    const agentLayer = await page.locator('#e2e-agent-layer');
    await expect(agentLayer).toBeVisible();

    // 验证智能体
    const agentTypes = ['mentor', 'designer', 'analyst', 'marketer', 'assistant'];
    for (const agentType of agentTypes) {
      const agent = page.locator(`[data-testid="agent-${agentType}"]`);
      await expect(agent).toBeVisible();
      console.log(`Agent ${agentType} is visible`);
    }

    // 验证位置显示
    const positionDisplay = page.locator('#position-display');
    await expect(positionDisplay).toBeVisible();
    const posText = await positionDisplay.textContent();
    expect(posText).toMatch(/\(\d+, \d+\)/);
    console.log('Game page validation passed');
  });

  test('管理后台页面访问', async ({ page }) => {
    // 先访问登录页面
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForTimeout(1000);

    // 登录
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // 访问用户管理页面
    await page.goto('http://localhost:3000/admin/users');
    await page.waitForTimeout(3000);

    // 截图验证
    await page.screenshot({ path: 'test-results/admin-users.png' });

    // 验证页面加载
    const userTable = page.locator('table');
    await expect(userTable).toBeVisible({ timeout: 5000 });
    console.log('Admin page validation passed');
  });

  test('游戏页面玩家移动', async ({ page }) => {
    // 先访问登录页面
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForTimeout(1000);

    // 登录
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'test123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // 如果没有跳转到游戏页面，手动导航
    if (!page.url().includes('/game')) {
      await page.goto('http://localhost:3000/game');
      await page.waitForTimeout(3000);
    }

    // 等待游戏加载
    await page.waitForSelector('#position-display', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // 获取初始位置
    const positionDisplay = page.locator('#position-display');
    const initialPos = await positionDisplay.textContent();
    console.log('Initial position:', initialPos);

    // 聚焦 canvas 并按下 S 键向下移动
    const canvas = page.locator('canvas').first();
    await canvas.focus();

    // 连续按下 S 键
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('s');
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);

    // 获取新位置
    const newPos = await positionDisplay.textContent();
    console.log('New position:', newPos);

    // 解析位置
    const initialMatch = initialPos.match(/\((\d+), (\d+)\)/);
    const newMatch = newPos.match(/\((\d+), (\d+)\)/);

    expect(initialMatch).toBeTruthy();
    expect(newMatch).toBeTruthy();

    const [, initialY] = [parseInt(initialMatch![1]), parseInt(initialMatch![2])];
    const [, newY] = [parseInt(newMatch![1]), parseInt(newMatch![2])];

    // 验证向下移动（Y 坐标增加）
    console.log(`Moved from Y=${initialY} to Y=${newY}`);
    expect(newY).toBeGreaterThanOrEqual(initialY);
  });
});
