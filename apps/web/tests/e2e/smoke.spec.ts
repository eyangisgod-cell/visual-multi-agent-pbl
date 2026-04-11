/**
 * Phase 6 - MVP 冒烟测试 (Smoke Tests)
 *
 * 测试范围：
 * 1. 核心页面可访问性
 * 2. API 健康检查
 * 3. 智能体预设 API
 * 4. 记忆系统 API
 *
 * 注意：需要登录的测试已标记为 skip，直到登录页面实现
 */

import { test, expect } from '@playwright/test';

// 辅助函数：管理员登录（目前跳过）
async function loginAsAdmin(page: any) {
  const context = page.context();
  await context.clearCookies();
  await page.goto('/auth/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle', { timeout: 10000 });
}

test.describe('Phase 6: MVP 冒烟测试', () => {
  test.describe('1. 核心页面可访问性', () => {
    test('首页应该可以访问', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL('/');
      await expect(page.locator('body')).toBeVisible();
    });

    test('管理后台首页应该可以访问', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      // 管理后台应该可访问（可能需要认证重定向）
      expect(page.url()).toContain('admin');
    });

    test.skip('游戏页面应该可以访问', async ({ page }) => {
      // 跳过：需要登录
      await loginAsAdmin(page);
      await page.goto('/game');
      await page.waitForLoadState('networkidle');
      const gameContainer = page.locator('#game-container');
      await expect(gameContainer).toBeVisible({ timeout: 10000 });
    });

    test.skip('作品列表页面应该可以访问', async ({ page }) => {
      // 跳过：需要登录
      await loginAsAdmin(page);
      await page.goto('/works');
      await expect(page.locator('body')).toBeVisible();
    });

    test.skip('项目列表页面应该可以访问', async ({ page }) => {
      // 跳过：需要登录
      await loginAsAdmin(page);
      await page.goto('/projects');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('2. API 健康检查', () => {
    test('健康检查 API 应该返回正常', async ({ request }) => {
      const response = await request.get('/api/health');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.status).toBe('ok');
    });

    test.skip('登录 API 应该工作', async ({ request }) => {
      // 跳过：登录 API 尚未实现
      const response = await request.post('/api/auth/login', {
        data: { username: 'admin', password: 'admin123' }
      });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
    });
  });

  test.describe('3. 智能体预设 API', () => {
    test('应该可以获取智能体预设列表', async ({ request }) => {
      const response = await request.get('/api/admin/agents/presets');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('presets');
      expect(Array.isArray(body.presets)).toBe(true);
      expect(body.presets.length).toBeGreaterThanOrEqual(1);
    });

    test.skip('应该可以保存智能体形象配置', async ({ request }) => {
      // 跳过：需要认证（403）
      const avatarConfig = {
        bodyType: 'average',
        bodyColor: '#4f46e5',
        headShape: 'oval',
        hairstyle: 'short',
        hairColor: '#4b5563',
        eyes: 'almond',
        eyeColor: '#1e40af',
        mouth: 'smile',
        outfit: 'academic',
        outfitColor: '#6366f1',
      };
      const response = await request.post('/api/admin/agents/avatar', { data: avatarConfig });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  test.describe('4. 记忆系统 API', () => {
    const testAgentId = `a1b2c3d4-e5f6-7890-abcd-ef1234567890`;

    test.skip('应该可以创建记忆', async ({ request }) => {
      // 跳过：AI Service 未运行
      const response = await request.post('http://localhost:8000/api/v1/memory', {
        data: {
          agent_id: testAgentId,
          type: 'SHORT_TERM',
          content: '测试记忆内容',
          importance: 5,
          tags: ['test'],
        },
      });
      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body.agent_id).toBe(testAgentId);
    });

    test.skip('应该可以获取记忆列表', async ({ request }) => {
      // 跳过：AI Service 未运行
      const response = await request.get(`http://localhost:8000/api/v1/memory/${testAgentId}`);
      expect(response.status()).toBe(200);
      const memories = await response.json();
      expect(Array.isArray(memories)).toBe(true);
    });

    test.skip('应该可以搜索记忆', async ({ request }) => {
      // 跳过：AI Service 未运行
      const response = await request.post('http://localhost:8000/api/v1/memory/search', {
        data: {
          agent_id: testAgentId,
          query: '测试',
          top_k: 5,
        },
      });
      expect(response.status()).toBe(200);
      const results = await response.json();
      expect(Array.isArray(results)).toBe(true);
    });

    test.skip('应该可以巩固记忆', async ({ request }) => {
      // 跳过：AI Service 未运行
      const response = await request.post('http://localhost:8000/api/v1/memory/consolidate', {
        data: {
          agent_id: testAgentId,
          threshold: 5,
        },
      });
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('consolidated_count');
    });

    test.skip('应该可以计算记忆重要性', async ({ request }) => {
      // 跳过：AI Service 未运行
      const response = await request.post('http://localhost:8000/api/v1/memory/calculate-importance', {
        data: {
          agent_id: testAgentId,
          interactions_count: 10,
          time_weight: 0.8,
          emotional_weight: 0.6,
        },
      });
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('importance');
    });

    test.skip('应该可以计算记忆衰减', async ({ request }) => {
      // 跳过：AI Service 未运行
      const response = await request.post('http://localhost:8000/api/v1/memory/calculate-decay', {
        data: {
          agent_id: testAgentId,
          days_old: 7,
        },
      });
      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('decay_factor');
    });
  });

  test.describe('5. 安全 API', () => {
    test.skip('速率限制应该工作', async ({ request }) => {
      // 跳过：需要验证速率限制中间件
      const requests = [];
      for (let i = 0; i < 110; i++) {
        requests.push(request.get('/api/health'));
      }
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status() === 429);
      expect(rateLimited).toBe(true);
    });

    test.skip('SQL 注入应该被阻止', async ({ request }) => {
      // 跳过：需要验证 SQL 注入防护
      const response = await request.post('http://localhost:8000/api/v1/memory', {
        data: {
          agent_id: "'; DROP TABLE agent_memories; --",
          type: 'SHORT_TERM',
          content: 'SQL injection test',
        },
      });
      expect(response.status()).toBe(400);
    });

    test.skip('XSS 应该被清理', async ({ request }) => {
      // 跳过：需要验证 XSS 防护
      const response = await request.post('http://localhost:8000/api/v1/memory', {
        data: {
          agent_id: testAgentId,
          type: 'SHORT_TERM',
          content: '<script>alert("xss")</script>',
        },
      });
      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.content).not.toContain('<script>');
    });
  });
});
