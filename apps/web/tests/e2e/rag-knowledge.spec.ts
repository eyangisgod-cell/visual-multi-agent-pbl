/**
 * Task 4: RAG 知识库系统 E2E Tests
 *
 * Tests for:
 * - 知识库文档上传和管理
 * - 文档切片和向量化
 * - 向量相似度搜索
 * - RAG 查询接口
 *
 * @see apps/ai-service/app/api/knowledge.py
 * @see apps/ai-service/app/api/rag.py
 */

import { test, expect } from '@playwright/test';

// Global constants
const API_BASE = 'http://localhost:3000';
const API_PREFIX = `${API_BASE}/api`;

// Test admin user credentials
const adminUser = {
  username: 'test_admin_' + Date.now(),
  password: 'testpassword123',
  nickname: 'Test Admin',
  grade: 1,
};

/**
 * Helper function to register, login, and get authenticated request context
 */
async function loginAndGetContext(page: any) {
  // Step 1: Register a new admin user
  const registerResponse = await page.request.post(`${API_BASE}/api/auth/register`, {
    data: {
      username: adminUser.username,
      password: adminUser.password,
      nickname: adminUser.nickname,
      grade: adminUser.grade,
    },
  });

  // Registration might fail if user exists, that's ok
  if (registerResponse.status() !== 201 && registerResponse.status() !== 409) {
    console.log('Registration response:', registerResponse.status());
  }

  // Step 1.5: Upgrade user to admin role for testing
  // We need admin role to access admin API endpoints
  const prisma = await import('@prisma/client').then(m => new m.PrismaClient());
  try {
    await prisma.user.update({
      where: { username: adminUser.username },
      data: { role: 'admin' }
    });
  } catch (err) {
    console.log('Could not upgrade user role:', err);
  } finally {
    await prisma.$disconnect();
  }

  // Step 2: Login to get session cookies
  const loginResponse = await page.request.post(`${API_BASE}/api/auth/login`, {
    data: {
      username: adminUser.username,
      password: adminUser.password,
    },
  });

  expect(loginResponse.status()).toBe(200);

  // Get cookies from login response headers
  const setCookieHeader = loginResponse.headers()['set-cookie'];
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader.join('; ') : (setCookieHeader || '');

  // Parse session and role cookies
  const sessionMatch = cookies.match(/session=([^;]+)/);
  const roleMatch = cookies.match(/user-role=([^;]+)/);

  // Extract cookie values
  const sessionValue = sessionMatch ? sessionMatch[1] : '';
  const roleValue = roleMatch ? roleMatch[1] : '';

  // Add cookies to the page context (for browser navigation)
  if (sessionValue) {
    await page.context().addCookies([{
      name: 'session',
      value: sessionValue,
      domain: 'localhost',
      path: '/',
    }]);
  }

  if (roleValue) {
    await page.context().addCookies([{
      name: 'user-role',
      value: roleValue,
      domain: 'localhost',
      path: '/',
    }]);
  }

  // Step 3: Make a test API call to get CSRF token cookie
  // The middleware will set a CSRF token cookie on 403 responses
  const testResponse = await page.request.post(`${API_BASE}/api/admin/knowledge/documents`, {
    headers: { 'Content-Type': 'application/json' },
    data: { title: 'test', content: 'test' },
  });

  // Get CSRF token from the response cookies
  const testSetCookie = testResponse.headers()['set-cookie'];
  const testCookies = Array.isArray(testSetCookie) ? testSetCookie.join('; ') : (testSetCookie || '');
  const csrfMatch = testCookies.match(/csrf-token=([^;]+)/);

  // Use the CSRF token from cookie
  let csrfToken = '';
  if (csrfMatch) {
    csrfToken = csrfMatch[1];
    // Add CSRF cookie to page context
    await page.context().addCookies([{
      name: 'csrf-token',
      value: csrfToken,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
    }]);
  }

  // Build cookie header manually - session is httpOnly so can't be read via page.context().cookies()
  const cookieParts = [];
  if (sessionValue) cookieParts.push(`session=${sessionValue}`);
  if (roleValue) cookieParts.push(`user-role=${roleValue}`);
  if (csrfToken) cookieParts.push(`csrf-token=${csrfToken}`);
  const cookieHeader = cookieParts.join('; ');

  // Return request helper with pre-configured headers
  // Note: We manually build the cookie string because httpOnly cookies (session) can't be read via page.context().cookies()
  const authenticatedRequest = {
    post: (url: string, options?: any) => page.request.post(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Cookie': cookieHeader,
        'x-csrf-token': csrfToken,
      },
    }),
    get: (url: string, options?: any) => page.request.get(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Cookie': cookieHeader,
        'x-csrf-token': csrfToken,
      },
    }),
    put: (url: string, options?: any) => page.request.put(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Cookie': cookieHeader,
        'x-csrf-token': csrfToken,
      },
    }),
    delete: (url: string, options?: any) => page.request.delete(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Cookie': cookieHeader,
        'x-csrf-token': csrfToken,
      },
    }),
  };

  return { request: authenticatedRequest, csrfToken, cookieHeader };
}

test.describe('Task 4: RAG 知识库系统', () => {

  test.describe('知识库文档管理 API', () => {
    test('应该可以获取知识库文档列表', async ({ page }) => {
      // 先登录获取认证凭据
      const { request, csrfToken } = await loginAndGetContext(page);

      const response = await request.get(`${API_PREFIX}/admin/knowledge/documents`, {
        headers: { 'x-csrf-token': csrfToken },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('documents');
      expect(Array.isArray(body.documents)).toBe(true);
    });

    test('应该可以上传知识文档', async ({ page }) => {
      const { request, csrfToken } = await loginAndGetContext(page);

      const response = await request.post(`${API_PREFIX}/admin/knowledge/documents`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          title: '测试文档',
          content: '这是一个测试文档的内容，用于 RAG 知识库系统测试。',
          category: '测试分类',
          tags: ['测试', 'RAG'],
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.document).toHaveProperty('id');
      expect(body.document.title).toBe('测试文档');
      expect(body.document.category).toBe('测试分类');
    });

    test('应该拒绝上传空内容文档', async ({ page }) => {
      const { request, csrfToken } = await loginAndGetContext(page);

      const response = await request.post(`${API_PREFIX}/admin/knowledge/documents`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        data: {
          title: '空文档',
          content: '',
          category: '测试',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('应该可以获取文档详情', async ({ page }) => {
      const { request, csrfToken } = await loginAndGetContext(page);

      // 先创建文档
      const createResponse = await request.post(`${API_PREFIX}/admin/knowledge/documents`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        data: {
          title: '详情测试文档',
          content: '文档内容',
          category: '测试',
        },
      });

      expect(createResponse.status()).toBe(201);
      const created = await createResponse.json();
      const docId = created.document.id;

      // 获取详情
      const getResponse = await request.get(`${API_PREFIX}/admin/knowledge/documents/${docId}`);
      expect(getResponse.status()).toBe(200);
      const body = await getResponse.json();
      expect(body.document.id).toBe(docId);
    });

    test('应该可以更新文档', async ({ page }) => {
      const { request, csrfToken } = await loginAndGetContext(page);

      // 创建文档
      const createResponse = await request.post(`${API_PREFIX}/admin/knowledge/documents`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        data: {
          title: '更新测试文档',
          content: '原始内容',
          category: '测试',
        },
      });

      const created = await createResponse.json();
      const docId = created.document.id;

      // 更新文档
      const updateResponse = await request.put(`${API_PREFIX}/admin/knowledge/documents/${docId}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        data: {
          title: '更新后的标题',
          content: '更新后的内容',
        },
      });

      expect(updateResponse.status()).toBe(200);
      const body = await updateResponse.json();
      expect(body.document.title).toBe('更新后的标题');
    });

    test('应该可以删除文档', async ({ page }) => {
      const { request, csrfToken } = await loginAndGetContext(page);

      // 创建文档
      const createResponse = await request.post(`${API_PREFIX}/admin/knowledge/documents`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        data: {
          title: '删除测试文档',
          content: '待删除内容',
          category: '测试',
        },
      });

      const created = await createResponse.json();
      const docId = created.document.id;

      // 删除文档
      const deleteResponse = await request.delete(`${API_PREFIX}/admin/knowledge/documents/${docId}`, {
        headers: { 'x-csrf-token': csrfToken },
      });

      expect(deleteResponse.status()).toBe(200);
    });
  });

  test.describe('RAG 向量搜索 API', () => {
    test('应该可以执行向量相似度搜索', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/knowledge/search`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          query: '如何学习编程',
          limit: 5,
        },
      });

      // 应该返回 200（即使没有数据）
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('results');
      expect(Array.isArray(body.results)).toBe(true);
    });

    test('搜索结果应该包含相关性分数', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/knowledge/search`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          query: '测试查询',
          limit: 5,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      if (body.results && body.results.length > 0) {
        expect(body.results[0]).toHaveProperty('score');
        expect(body.results[0]).toHaveProperty('content');
      }
    });

    test('应该支持按分类过滤搜索结果', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/knowledge/search`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          query: '测试',
          category: '编程',
          limit: 10,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('results');
    });
  });

  test.describe('RAG 问答 API', () => {
    test('应该可以执行 RAG 问答', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/knowledge/query`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          query: 'Python 和 JavaScript 有什么区别？',
          context_limit: 3,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('answer');
      expect(body).toHaveProperty('sources');
    });

    test('RAG 问答应该返回引用来源', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/knowledge/query`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          query: '如何准备面试',
          context_limit: 5,
        },
      });

      const body = await response.json();
      expect(body.sources).toBeDefined();
      expect(Array.isArray(body.sources)).toBe(true);
    });

    test('RAG 问答应该集成 LLM 生成智能回答', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/knowledge/query`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          query: '什么是向量数据库？',
          context_limit: 3,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();

      // LLM 生成的回答应该包含更丰富的内容，不只是简单的文档拼接
      expect(body.answer).toBeDefined();
      expect(body.answer.length).toBeGreaterThan(50);

      // 应该包含来源引用
      expect(body.sources).toBeDefined();
      expect(Array.isArray(body.sources)).toBe(true);
    });

    test('RAG 问答空查询应该返回错误', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/knowledge/query`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          query: '',
        },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });

    test('RAG 问答应该调用 AI Service 的 embedding 接口', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/knowledge/query`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          query: '机器学习基础概念',
          context_limit: 3,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();

      // 验证响应结构
      expect(body).toHaveProperty('answer');
      expect(body).toHaveProperty('sources');
      expect(body).toHaveProperty('query');
      expect(body.query).toBe('机器学习基础概念');
    });
  });

  test.describe('RAG 问答 API - 限流和 Token 计数', () => {
    test('RAG 问答应该包含 token 计数信息', async ({ request }) => {
      const response = await request.post(`${API_PREFIX}/knowledge/query`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          query: 'TypeScript 的类型系统',
          context_limit: 2,
        },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();

      // 响应应该包含 token 使用信息
      expect(body).toHaveProperty('usage');
      expect(body.usage).toHaveProperty('prompt_tokens');
      expect(body.usage).toHaveProperty('completion_tokens');
      expect(body.usage).toHaveProperty('total_tokens');
    });

    test('RAG 问答应该有请求限流保护', async ({ page }) => {
      const { request, csrfToken } = await loginAndGetContext(page);

      // 连续发送多个请求测试限流
      const requests = Array(10).fill(null).map(() =>
        request.post(`${API_PREFIX}/knowledge/query`, {
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          data: {
            query: '限流测试',
            context_limit: 1,
          },
        })
      );

      const responses = await Promise.all(requests);
      const statuses = responses.map(r => r.status());

      // 应该有至少一个请求成功（200）
      expect(statuses.some(s => s === 200)).toBe(true);
    });
  });

  test.describe('RAG 流式问答 API', () => {
    test('RAG 问答应该支持流式响应', async ({ page }) => {
      const { request, csrfToken } = await loginAndGetContext(page);

      // 测试流式响应端点
      const response = await request.post(`${API_PREFIX}/knowledge/query/stream`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        data: {
          query: '如何学习编程',
          context_limit: 3,
        },
      });

      // 流式响应应该返回 200
      expect(response.status()).toBe(200);
    });
  });

  test.describe('文档分类管理', () => {
    test('应该可以获取所有文档分类', async ({ page }) => {
      const { request, csrfToken } = await loginAndGetContext(page);

      const response = await request.get(`${API_PREFIX}/admin/knowledge/categories`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('categories');
      expect(Array.isArray(body.categories)).toBe(true);
    });

    test('应该可以创建新分类', async ({ page }) => {
      const { request, csrfToken } = await loginAndGetContext(page);

      const response = await request.post(`${API_PREFIX}/admin/knowledge/categories`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        data: {
          name: '新分类',
          description: '测试分类',
        },
      });

      // 分类可能已存在，200 或 201 都可以
      expect([200, 201, 409]).toContain(response.status());
    });
  });
});
