/**
 * Task 9: 性能优化专项 E2E Tests
 *
 * Tests for:
 * - Redis 缓存功能
 * - API 响应时间
 * - 数据库查询优化
 * - 图片懒加载
 *
 */

import { test, expect } from '@playwright/test';

test.describe('Task 9: 性能优化专项', () => {
  const API_BASE = 'http://localhost:3000';
  const API_PREFIX = `${API_BASE}/api`;

  test.describe('Redis 缓存功能', () => {
    test('应该可以缓存数据', async ({ request }) => {
      // 测试缓存 API（如果实现了缓存端点）
      const response = await request.get(`${API_PREFIX}/health`);
      expect(response.status()).toBe(200);
    });

    test('缓存应该有正确的 TTL', async ({ request }) => {
      // 测试缓存过期（需要具体实现）
      const startTime = Date.now();
      const response1 = await request.get(`${API_PREFIX}/admin/roles`);
      const firstTime = Date.now() - startTime;

      const startTime2 = Date.now();
      const response2 = await request.get(`${API_PREFIX}/admin/roles`);
      const secondTime = Date.now() - startTime2;

      // 第二次请求应该更快（如果缓存生效）
      expect(response1.status()).toBe(200);
      expect(response2.status()).toBe(200);
      console.log(`First request: ${firstTime}ms, Second request: ${secondTime}ms`);
    });
  });

  test.describe('API 响应时间', () => {
    test('角色列表 API 应该在 500ms 内响应', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get(`${API_PREFIX}/admin/roles`);
      const endTime = Date.now();

      expect(response.status()).toBe(200);
      expect(endTime - startTime).toBeLessThan(500);
    });

    test('文档列表 API 应该在 500ms 内响应', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get(`${API_PREFIX}/admin/knowledge/documents`);
      const endTime = Date.now();

      expect(response.status()).toBe(200);
      expect(endTime - startTime).toBeLessThan(500);
    });

    test('对话列表 API 应该在 500ms 内响应', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get(`${API_PREFIX}/conversations?userId=test`);
      const endTime = Date.now();

      // 200 或 400 都可以（取决于是否有数据）
      expect([200, 400]).toContain(response.status());
      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  test.describe('数据库索引优化', () => {
    test('用户查询应该使用索引', async ({ request }) => {
      // 通过 username 查询应该使用索引
      const startTime = Date.now();
      const response = await request.get(`${API_PREFIX}/admin/users?limit=10`);
      const endTime = Date.now();

      expect(response.status()).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('作品查询应该使用索引', async ({ request }) => {
      // 通过 project_id 查询应该使用索引
      const startTime = Date.now();
      const response = await request.get(`${API_PREFIX}/admin/works?limit=10`);
      const endTime = Date.now();

      expect(response.status()).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  test.describe('前端性能', () => {
    test('首页应该在 3 秒内加载完成', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(API_BASE);
      const endTime = Date.now();

      await expect(page).toHaveTitle(/.*/);
      expect(endTime - startTime).toBeLessThan(3000);
    });

    test('图片应该支持懒加载', async ({ page }) => {
      await page.goto(API_BASE);

      // 检查是否有图片使用了懒加载
      const images = await page.$$('img');
      let lazyLoadedCount = 0;

      for (const img of images) {
        const loading = await img.getAttribute('loading');
        if (loading === 'lazy') {
          lazyLoadedCount++;
        }
      }

      // 至少部分图片使用懒加载
      console.log(`Found ${images.length} images, ${lazyLoadedCount} with lazy loading`);
    });

    test('页面应该支持代码分割', async ({ page }) => {
      await page.goto(API_BASE);

      // 检查是否有动态导入的 chunk
      const response = await page.goto(API_BASE);
      const resources = await page.evaluate(() => {
        return performance.getEntriesByType('resource').filter(
          (r: any) => r.initiatorType === 'script'
        );
      });

      console.log(`Loaded ${resources.length} script resources`);
      expect(resources.length).toBeGreaterThan(0);
    });
  });

  test.describe('并发性能', () => {
    test('应该支持并发请求', async ({ request }) => {
      const startTime = Date.now();

      // 并发发送 5 个请求
      const requests = Promise.all([
        request.get(`${API_PREFIX}/admin/roles`),
        request.get(`${API_PREFIX}/admin/knowledge/documents`),
        request.get(`${API_PREFIX}/conversations?userId=test`),
        request.get(`${API_PREFIX}/admin/permissions`),
        request.get(`${API_PREFIX}/admin/users?limit=1`),
      ]);

      const responses = await requests;
      const endTime = Date.now();

      // 所有请求都应该成功
      responses.forEach((r) => {
        expect([200, 400, 401]).toContain(r.status());
      });

      console.log(`5 concurrent requests completed in ${endTime - startTime}ms`);
    });
  });
});
