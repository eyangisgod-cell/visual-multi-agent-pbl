/**
 * 游戏页面调试测试 - 包含登录和 localStorage
 */
import { test, expect } from '@playwright/test';

test.describe('游戏页面调试', () => {
  test('登录后访问游戏页面', async ({ page }) => {
    // 1. 先访问登录页
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForTimeout(1000);

    // 2. 直接登录
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'test123456');
    await page.click('button[type="submit"]');

    // 等待登录响应
    await page.waitForTimeout(3000);

    // 截取登录后页面
    await page.screenshot({ path: 'test-results/02-after-login.png' });
    console.log('After login screenshot saved');

    // 检查当前 URL
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // 如果没有自动跳转，手动导航
    await page.goto('http://localhost:3000/game');
    await page.waitForTimeout(5000);

    // 3. 截取游戏页面
    await page.screenshot({ path: 'test-results/03-game-page.png' });
    console.log('Game page screenshot saved');

    // 4. 检查 localStorage 是否有 token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log('Token in localStorage:', token ? 'exists' : 'none');

    // 5. 检查是否有 canvas
    const canvas = await page.locator('canvas').first();
    const canvasVisible = await canvas.isVisible().catch(() => false);
    console.log('Canvas visible:', canvasVisible);

    // 6. 检查 E2E agent layer
    const agentLayer = await page.locator('#e2e-agent-layer');
    const agentLayerVisible = await agentLayer.isVisible().catch(() => false);
    console.log('Agent layer visible:', agentLayerVisible);

    // 7. 查找所有 agent markers
    const markers = await page.locator('[data-testid^="agent-"]');
    const count = await markers.count();
    console.log(`Found ${count} agent markers`);

    for (let i = 0; i < count; i++) {
      const testId = await markers.nth(i).getAttribute('data-testid');
      console.log(`Marker ${i}: ${testId}`);
    }

    // 8. 如果找不到，尝试直接访问
    if (!agentLayerVisible) {
      console.log('Agent layer not found, checking page content...');
      const html = await page.content();
      console.log('Page has #e2e-agent-layer:', html.includes('e2e-agent-layer'));
      console.log('Page has canvas:', html.includes('canvas'));
    }
  });
});
