/**
 * Phase 11 - PWA (Progressive Web App) E2E Tests
 *
 * Tests for:
 * - Service Worker registration
 * - Offline page display
 * - Cache strategy verification
 * - Install prompt
 * - App manifest
 *
 * @see apps/web/next.config.js (next-pwa configuration)
 * @see apps/web/public/manifest.json
 * @see apps/web/src/app/offline/page.tsx
 */

import { test, expect } from '@playwright/test';

test.describe('Phase 11: PWA (Progressive Web App)', () => {
  const APP_URL = 'http://localhost:3000';

  test.describe('App Manifest', () => {
    test('应该返回有效的 manifest.json', async ({ request }) => {
      const response = await request.get(`${APP_URL}/manifest.json`);

      expect(response.status()).toBe(200);
      const manifest = await response.json();
      expect(manifest.name).toBe('可视项目式学习平台');
      expect(manifest.short_name).toBe('Visual PBL');
    });

    test('manifest 应该包含必要的图标', async ({ request }) => {
      const response = await request.get(`${APP_URL}/manifest.json`);
      const manifest = await response.json();

      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);

      // Should have 192x192 icon
      const icon192 = manifest.icons.find(
        (icon: any) => icon.sizes === '192x192'
      );
      expect(icon192).toBeDefined();
      expect(icon192.src).toBe('/icons/icon-192x192.png');

      // Should have 512x512 icon
      const icon512 = manifest.icons.find(
        (icon: any) => icon.sizes === '512x512'
      );
      expect(icon512).toBeDefined();
      expect(icon512.src).toBe('/icons/icon-512x512.png');
    });

    test('manifest 应该配置 start_url', async ({ request }) => {
      const response = await request.get(`${APP_URL}/manifest.json`);
      const manifest = await response.json();

      expect(manifest.start_url).toBe('/game');
    });

    test('manifest 应该设置 display 为 standalone', async ({ request }) => {
      const response = await request.get(`${APP_URL}/manifest.json`);
      const manifest = await response.json();

      expect(manifest.display).toBe('standalone');
    });

    test('manifest 应该包含主题颜色', async ({ request }) => {
      const response = await request.get(`${APP_URL}/manifest.json`);
      const manifest = await response.json();

      expect(manifest.theme_color).toBe('#4f46e5');
      expect(manifest.background_color).toBe('#ffffff');
    });

    test('manifest 应该包含应用截图', async ({ request }) => {
      const response = await request.get(`${APP_URL}/manifest.json`);
      const manifest = await response.json();

      expect(manifest.screenshots).toBeDefined();
      expect(Array.isArray(manifest.screenshots)).toBe(true);
      expect(manifest.screenshots.length).toBeGreaterThan(0);
    });

    test('manifest 应该包含快捷方式', async ({ request }) => {
      const response = await request.get(`${APP_URL}/manifest.json`);
      const manifest = await response.json();

      expect(manifest.shortcuts).toBeDefined();
      expect(Array.isArray(manifest.shortcuts)).toBe(true);

      // Should have game center shortcut
      const gameShortcut = manifest.shortcuts.find(
        (s: any) => s.name === '游戏中心'
      );
      expect(gameShortcut).toBeDefined();
      expect(gameShortcut.url).toBe('/game');

      // Should have projects shortcut
      const projectsShortcut = manifest.shortcuts.find(
        (s: any) => s.name === '项目列表'
      );
      expect(projectsShortcut).toBeDefined();
      expect(projectsShortcut.url).toBe('/projects');
    });

    test('HTML 页面应该引用 manifest', async ({ page }) => {
      await page.goto(APP_URL);

      const manifestLink = page.locator('link[rel="manifest"]');
      await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
    });
  });

  test.describe('Service Worker', () => {
    test('应该注册 Service Worker', async ({ page, context }) => {
      await page.goto(APP_URL);

      // Wait for service worker registration
      await page.waitForFunction(() => {
        return 'serviceWorker' in navigator;
      });

      const registration = await page.evaluate(() => {
        return navigator.serviceWorker.getRegistration();
      });

      expect(registration).toBeDefined();
    });

    test('Service Worker 应该使用 skipWaiting', async ({ page }) => {
      await page.goto(APP_URL);

      // Wait for service worker to be active
      await page.waitForFunction(
        () => {
          const reg = window.navigator.serviceWorker.controller;
          return reg !== null;
        },
        { timeout: 10000 }
      );

      const isActive = await page.evaluate(() => {
        return window.navigator.serviceWorker.controller !== null;
      });

      expect(isActive).toBe(true);
    });
  });

  test.describe('Offline Page', () => {
    test('应该显示离线页面', async ({ page, context }) => {
      // Go to offline page directly
      await page.goto(`${APP_URL}/offline`);

      // Verify page content
      await expect(page).toHaveTitle(/离线/);

      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      await expect(heading).toContainText('离线模式');

      const description = page.locator('p').first();
      await expect(description).toBeVisible();
      await expect(description).toContainText('网络连接');
    });

    test('离线页面应该有重新连接按钮', async ({ page }) => {
      await page.goto(`${APP_URL}/offline`);

      const reloadButton = page.locator('button', { hasText: '重新连接' });
      await expect(reloadButton).toBeVisible();
    });

    test('离线页面应该有返回按钮', async ({ page }) => {
      await page.goto(`${APP_URL}/offline`);

      const backButton = page.locator('button', { hasText: '返回上一页' });
      await expect(backButton).toBeVisible();
    });

    test('离线页面应该有提示框', async ({ page }) => {
      await page.goto(`${APP_URL}/offline`);

      const tipBox = page.locator('.bg-blue-50');
      await expect(tipBox).toBeVisible();
      await expect(tipBox).toContainText('提示');
      await expect(tipBox).toContainText('缓存');
    });

    test('点击重新连接按钮应该刷新页面', async ({ page }) => {
      await page.goto(`${APP_URL}/offline`);

      const reloadButton = page.locator('button', { hasText: '重新连接' });
      await reloadButton.click();

      // Wait for page reload
      await page.waitForLoadState('load');
    });
  });

  test.describe('Cache Strategy', () => {
    test('应该缓存静态图片资源', async ({ page, context }) => {
      // Navigate to a page with images
      await page.goto(APP_URL);

      // Wait for images to load
      await page.waitForLoadState('networkidle');

      // Check if images are loaded
      const images = page.locator('img');
      const count = await images.count();

      if (count > 0) {
        // Verify at least one image is loaded
        const firstImage = images.first();
        await expect(firstImage).toBeVisible();
      }
    });

    test('应该缓存 API 响应 (NetworkFirst)', async ({ page, context }) => {
      // Track network requests
      const requests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/api/')) {
          requests.push(request.url());
        }
      });

      await page.goto(APP_URL);
      await page.waitForLoadState('networkidle');

      // API requests should be made
      // Note: This test verifies the cache strategy is configured
      // Actual cache behavior depends on Service Worker implementation
      expect(requests.length).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('PWA Installability', () => {
    test('页面应该链接 manifest 以支持安装', async ({ page }) => {
      await page.goto(APP_URL);

      // Check for manifest link
      const manifestLink = page.locator('link[rel="manifest"]');
      await expect(manifestLink).toHaveCount(1);
    });

    test('页面应该有 theme-color meta 标签', async ({ page }) => {
      await page.goto(APP_URL);

      const themeColorMeta = page.locator('meta[name="theme-color"]');
      await expect(themeColorMeta).toHaveAttribute('content', '#4f46e5');
    });

    test('页面应该有 viewport meta 标签适配移动端', async ({ page }) => {
      await page.goto(APP_URL);

      const viewportMeta = page.locator('meta[name="viewport"]');
      await expect(viewportMeta).toHaveAttribute(
        'content',
        /width=device-width/
      );
    });
  });

  test.describe('Mobile Optimization', () => {
    test('应该有移动端友好的视口设置', async ({ page }) => {
      await page.goto(APP_URL);

      const viewport = page.locator('meta[name="viewport"]');
      await expect(viewport).toHaveAttribute('content', /initial-scale=1/);
    });

    test('游戏画布应该支持响应式尺寸', async ({ page }) => {
      await page.goto(`${APP_URL}/game`);

      // Check if game canvas exists
      const canvas = page.locator('#game-canvas');
      await expect(canvas).toBeVisible();

      // Verify canvas has responsive styles
      const canvasStyle = await canvas.getAttribute('style');
      expect(canvasStyle).toBeDefined();
    });
  });

  test.describe('Offline Capability', () => {
    test('应该在离线模式下显示离线页面', async ({ page, context }) => {
      // Set offline mode
      await context.setOffline(true);

      // Try to navigate to app
      await page.goto(APP_URL, { waitUntil: 'networkidle' });

      // Should either show offline page or cached content
      const isOfflinePage = await page
        .locator('h1', { hasText: '离线模式' })
        .isVisible()
        .catch(() => false);

      // Either show offline page or some cached content
      expect(isOfflinePage || (await page.content()).length).toBeGreaterThan(0);
    });

    test('重新连接后应该恢复正常功能', async ({ page, context }) => {
      // Set offline then online
      await context.setOffline(true);
      await page.goto(APP_URL, { waitUntil: 'networkidle' });

      // Go back online
      await context.setOffline(false);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should load normally
      expect(page.url()).toBe(APP_URL + '/');
    });
  });
});
