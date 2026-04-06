/**
 * Debug test - Check what elements exist in game page
 */

import { test, expect } from '@playwright/test';

test.describe('Debug - Game Page Elements', () => {
  test('List all elements in game container', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 等待登录成功
    await page.waitForFunction(() => {
      return localStorage.getItem('token') !== null;
    }, { timeout: 10000 });

    // 导航到游戏页面
    await page.goto('/game');

    // 等待游戏 Canvas 出现
    const canvas = page.locator('#game-container canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 10000 });

    // 等待位置显示更新（表示游戏已就绪）
    const positionDisplay = page.locator('#position-display');
    await page.waitForFunction(() => {
      const el = document.getElementById('position-display');
      if (!el) return false;
      const text = el.textContent;
      if (text === 'Loading...' || text.includes('NaN')) return false;
      return /\(\d+, \d+\)/.test(text);
    }, { timeout: 10000 });

    // 等待 2 秒让 PixiApp 完全加载
    await page.waitForTimeout(2000);

    // 检查 game-container 内的所有元素
    const gameContainerInfo = await page.evaluate(() => {
      const container = document.getElementById('game-container');
      if (!container) return null;

      const children = Array.from(container.children).map(child => ({
        tagName: child.tagName,
        id: child.id,
        className: child.className,
        dataTestId: child.getAttribute('data-testid'),
        style: child.getAttribute('style')?.substring(0, 100),
      }));

      // 检查所有后代元素
      const allDescendants = Array.from(container.querySelectorAll('*')).map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        dataTestId: el.getAttribute('data-testid'),
      }));

      return {
        childCount: container.childElementCount,
        children,
        allDescendants,
      };
    });

    console.log('Game Container Info:', JSON.stringify(gameContainerInfo, null, 2));

    // 验证容器存在
    expect(gameContainerInfo).not.toBeNull();
  });
});
