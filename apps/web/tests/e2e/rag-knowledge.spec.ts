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

test.describe('Task 4: RAG 知识库系统', () => {
  const API_BASE = 'http://localhost:3000';
  const API_PREFIX = `${API_BASE}/api`;

  // Helper to get CSRF token
  async function getCsrfToken(page: any): Promise<string> {
    await page.goto(API_BASE);
    const csrfToken = await page.evaluate(() => {
      return document.cookie.split('csrf-token=')[1]?.split(';')[0] || '';
    });
    return csrfToken;
  }

  test.describe('知识库文档管理 API', () => {
    test('应该可以获取知识库文档列表', async ({ request }) => {
      const response = await request.get(`${API_PREFIX}/admin/knowledge/documents`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('documents');
      expect(Array.isArray(body.documents)).toBe(true);
    });

    test('应该可以上传知识文档', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(`${API_PREFIX}/admin/knowledge/documents`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
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

    test('应该拒绝上传空内容文档', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

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

    test('应该可以获取文档详情', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

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

    test('应该可以更新文档', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

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

    test('应该可以删除文档', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

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

      const body = await response.json();
      if (body.results.length > 0) {
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
  });

  test.describe('文档分类管理', () => {
    test('应该可以获取所有文档分类', async ({ request }) => {
      const response = await request.get(`${API_PREFIX}/admin/knowledge/categories`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('categories');
      expect(Array.isArray(body.categories)).toBe(true);
    });

    test('应该可以创建新分类', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

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
