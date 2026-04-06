/**
 * 游戏页面视觉验证测试
 *
 * 目的：实际截图展示游戏页面的真实运行状态
 */

import { test, expect } from '@playwright/test';

test.describe('游戏页面视觉验证', () => {
  test('截图展示游戏页面实际样貌', async ({ page }) => {
    // 先登录
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 等待登录成功
    await page.waitForFunction(() => {
      return localStorage.getItem('token') !== null;
    }, { timeout: 10000 });

    // 导航到游戏页面
    await page.goto('/game', { waitUntil: 'domcontentloaded' });

    // 等待游戏容器出现
    const gameContainer = page.locator('#game-container');
    await gameContainer.waitFor({ state: 'visible', timeout: 10000 });

    // 等待 Canvas 出现
    const canvas = page.locator('#game-container canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 10000 });

    // 等待位置显示更新为有效坐标
    await page.waitForFunction(() => {
      const el = document.getElementById('position-display');
      if (!el) return false;
      const text = el.textContent;
      if (text === 'Loading...' || text.includes('NaN')) return false;
      return /\(\d+, \d+\)/.test(text);
    }, { timeout: 15000 });

    // 截图
    await page.screenshot({
      path: 'tests/e2e/screenshots/game-page-full.png',
      fullPage: true
    });

    // 验证页面元素
    expect(await gameContainer.isVisible()).toBe(true);

    // 获取位置文本
    const positionText = await page.locator('#position-display').textContent();
    console.log('玩家位置:', positionText);

    // 验证位置有效
    expect(positionText).toMatch(/\(\d+, \d+\)/);
  });

  test('截图展示管理后台首页', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // 等待侧边栏出现
    const sidebar = page.locator('aside');
    await sidebar.waitFor({ state: 'visible', timeout: 5000 });

    // 截图
    await page.screenshot({
      path: 'tests/e2e/screenshots/admin-dashboard.png',
      fullPage: true
    });

    // 验证侧边栏菜单项
    const menuItems = sidebar.locator('nav a');
    const count = await menuItems.count();
    console.log('侧边栏菜单项数量:', count);

    // 获取所有菜单项文本
    const menuTexts = await menuItems.allTextContents();
    console.log('菜单项:', menuTexts);
  });
});
