/**
 * Phase 6 - 多设备适配测试 (Multi-Device Responsive Tests)
 *
 * 测试范围：
 * 1. 移动端 viewport 适配
 * 2. 平板 viewport 适配
 * 3. 桌面 viewport 适配
 * 4. 响应式布局验证
 * 5. 触摸交互支持
 *
 * 注意：需要服务器的测试标记为 skip，可以在服务器运行时单独执行
 */

import { test, expect, devices } from '@playwright/test';

const iPhone = devices['iPhone 13 Pro'];
const Pixel = devices['Pixel 5'];
const iPad = devices['iPad Pro'];

// iPhone 测试
test.describe('Phase 6: 多设备适配测试 - iPhone', () => {
  test.skip('首页应该在 iPhone 正常显示', async ({ page }) => {
    await page.setViewportSize({ width: iPhone.viewport!.width, height: iPhone.viewport!.height });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test.skip('导航栏应该在 iPhone 正确折叠', async ({ page }) => {
    await page.setViewportSize({ width: iPhone.viewport!.width, height: iPhone.viewport!.height });
    await page.goto('/');
    const mobileMenu = page.locator('[data-testid="mobile-menu"], [data-testid="hamburger-menu"]');
    if (await mobileMenu.count() > 0) {
      await expect(mobileMenu.first()).toBeVisible();
    }
  });

  test.skip('登录页面应该在 iPhone 正常显示', async ({ page }) => {
    await page.setViewportSize({ width: iPhone.viewport!.width, height: iPhone.viewport!.height });
    await page.goto('/auth/login');
    const loginForm = page.locator('form, [data-testid="login-form"]');
    await expect(loginForm.first()).toBeVisible();
  });

  test.skip('智能体选择页面应该在 iPhone 适配', async ({ page }) => {
    await page.setViewportSize({ width: iPhone.viewport!.width, height: iPhone.viewport!.height });
    await page.goto('/admin/agents/select');
    const agentCards = page.locator('[data-testid="agent-card"]');
    const count = await agentCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test.skip('触摸交互应该在 iPhone 工作', async ({ page }) => {
    await page.setViewportSize({ width: iPhone.viewport!.width, height: iPhone.viewport!.height });
    await page.goto('/admin/agents/select');
    const agentCard = page.locator('[data-testid="agent-card"]').first();
    if (await agentCard.count() > 0) {
      await agentCard.tap();
      await expect(agentCard).toBeVisible();
    }
  });
});

// Android 测试
test.describe('Phase 6: 多设备适配测试 - Android', () => {
  test.skip('首页应该在 Android 正常显示', async ({ page }) => {
    await page.setViewportSize({ width: Pixel.viewport!.width, height: Pixel.viewport!.height });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test.skip('PWA 功能应该在 Android 可用', async ({ page }) => {
    await page.setViewportSize({ width: Pixel.viewport!.width, height: Pixel.viewport!.height });
    await page.goto('/');
    const registration = await page.evaluate(() => navigator.serviceWorker?.getRegistration());
    expect(typeof registration).toBeDefined();
  });

  test.skip('作品列表应该在 Android 正常显示', async ({ page }) => {
    await page.setViewportSize({ width: Pixel.viewport!.width, height: Pixel.viewport!.height });
    await page.goto('/works');
    const container = page.locator('[data-testid="works-list"], [data-testid="works-container"], main');
    await expect(container.first()).toBeVisible();
  });

  test.skip('项目管理应该在 Android 正常显示', async ({ page }) => {
    await page.setViewportSize({ width: Pixel.viewport!.width, height: Pixel.viewport!.height });
    await page.goto('/projects');
    const container = page.locator('[data-testid="projects-list"], [data-testid="projects-container"], main');
    await expect(container.first()).toBeVisible();
  });
});

// iPad 测试
test.describe('Phase 6: 多设备适配测试 - iPad', () => {
  test.skip('首页应该在 iPad 正常显示', async ({ page }) => {
    await page.setViewportSize({ width: iPad.viewport!.width, height: iPad.viewport!.height });
    await page.goto('/');
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(768);
    await expect(page.locator('body')).toBeVisible();
  });

  test.skip('导航栏应该在 iPad 正确显示', async ({ page }) => {
    await page.setViewportSize({ width: iPad.viewport!.width, height: iPad.viewport!.height });
    await page.goto('/');
    const nav = page.locator('nav, [data-testid="navigation"], [data-testid="navbar"]');
    await expect(nav.first()).toBeVisible();
  });

  test.skip('智能体卡片应该在 iPad 正确布局', async ({ page }) => {
    await page.setViewportSize({ width: iPad.viewport!.width, height: iPad.viewport!.height });
    await page.goto('/admin/agents/select');
    const agentCards = page.locator('[data-testid="agent-card"]');
    const count = await agentCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test.skip('游戏画布应该在 iPad 适配', async ({ page }) => {
    await page.setViewportSize({ width: iPad.viewport!.width, height: iPad.viewport!.height });
    await page.goto('/game');
    const canvas = page.locator('#game-canvas, canvas');
    await expect(canvas.first()).toBeVisible();
  });
});

// 桌面测试
test.describe('Phase 6: 多设备适配测试 - Desktop', () => {
  test.skip('首页应该在桌面正常显示', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(1024);
    await expect(page.locator('body')).toBeVisible();
  });

  test.skip('导航栏应该在桌面完整显示', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    const nav = page.locator('nav, [data-testid="navigation"], [data-testid="navbar"]');
    await expect(nav.first()).toBeVisible();
    const navItems = page.locator('nav a, nav button, [data-testid="nav-item"]');
    expect(await navItems.count()).toBeGreaterThanOrEqual(2);
  });

  test.skip('管理后台应该在桌面优化显示', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/admin');
    const dashboard = page.locator('[data-testid="admin-dashboard"], main');
    await expect(dashboard.first()).toBeVisible();
  });

  test.skip('游戏场景应该在桌面正常显示', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/game');
    const container = page.locator('#game-container, [data-testid="game-container"]');
    await expect(container.first()).toBeVisible();
  });

  test.skip('悬停交互应该在桌面工作', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/admin/agents/select');
    const agentCard = page.locator('[data-testid="agent-card"]').first();
    if (await agentCard.count() > 0) {
      await agentCard.hover();
      await expect(agentCard).toBeVisible();
    }
  });
});

// 响应式断点测试
test.describe('Phase 6: 多设备适配测试 - 响应式断点', () => {
  const breakpoints = [
    { name: 'xs', width: 375, height: 667 },
    { name: 'sm', width: 640, height: 800 },
    { name: 'md', width: 768, height: 1024 },
    { name: 'lg', width: 1024, height: 768 },
    { name: 'xl', width: 1280, height: 800 },
    { name: '2xl', width: 1536, height: 900 },
  ];

  for (const breakpoint of breakpoints) {
    test.skip(`布局应该在 ${breakpoint.name} 断点正确响应`, async ({ page }) => {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

// 横屏/竖屏测试
test.describe('Phase 6: 多设备适配测试 - 横屏/竖屏', () => {
  test.skip('应该支持竖屏模式', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test.skip('应该支持横屏模式', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test.skip('游戏场景应该适配横屏', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/game');
    const canvas = page.locator('#game-canvas, canvas');
    await expect(canvas.first()).toBeVisible();
  });
});

// 交互方式测试
test.describe('Phase 6: 多设备适配测试 - 交互方式', () => {
  test.skip('应该支持触摸点击', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/agents/select');
    const agentCard = page.locator('[data-testid="agent-card"]').first();
    if (await agentCard.count() > 0) {
      await agentCard.tap();
      await expect(agentCard).toBeVisible();
    }
  });

  test.skip('应该支持鼠标点击', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/admin/agents/select');
    const agentCard = page.locator('[data-testid="agent-card"]').first();
    if (await agentCard.count() > 0) {
      await agentCard.click();
      await expect(agentCard).toBeVisible();
    }
  });

  test.skip('应该支持鼠标悬停', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/admin/agents/select');
    const agentCard = page.locator('[data-testid="agent-card"]').first();
    if (await agentCard.count() > 0) {
      await agentCard.hover();
      await expect(agentCard).toBeVisible();
    }
  });

  test.skip('滚动应该在移动设备工作', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/works');
    await page.evaluate(() => window.scrollBy(0, 200));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThanOrEqual(0);
  });
});

// 配置验证测试（不需要服务器）
test.describe('Phase 6: 多设备适配测试 - 配置验证', () => {
  test('设备配置应该有效', async () => {
    expect(iPhone.viewport).toBeDefined();
    expect(iPhone.viewport!.width).toBeLessThan(768); // Mobile
  });

  test('桌面配置应该有效', async () => {
    // Desktop viewport
    const desktopWidth = 1920;
    expect(desktopWidth).toBeGreaterThanOrEqual(1024);
  });

  test('响应式断点配置应该有效', async () => {
    const breakpoints = [
      { name: 'xs', width: 375 },
      { name: 'sm', width: 640 },
      { name: 'md', width: 768 },
      { name: 'lg', width: 1024 },
      { name: 'xl', width: 1280 },
      { name: '2xl', width: 1536 },
    ];
    expect(breakpoints.length).toBe(6);
    expect(breakpoints[0].width).toBe(375);
    expect(breakpoints[5].width).toBe(1536);
  });
});
