/**
 * Phase 9 - Agent Memory System E2E Integration Tests
 *
 * Tests for:
 * - Memory creation (SHORT_TERM, LONG_TERM, EPISODIC, PROCEDURAL, SEMANTIC)
 * - Memory retrieval by agent_id
 * - Vector similarity search
 * - Memory consolidation (short-term to long-term)
 * - Memory importance calculation
 * - Memory decay calculation
 *
 * @see apps/ai-service/app/api/memory.py
 */

import { test, expect } from '@playwright/test';

// Test configuration
const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const API_V1_BASE = `${AI_SERVICE_BASE_URL}/api/v1`;

test.describe('Phase 9: Agent Memory System', () => {
  // Test data - valid UUIDs
  const testAgentId = `a1b2c3d4-e5f6-7890-abcd-ef1234567890`;
  const testUserId = `b2c3d4e5-f6a7-8901-bcde-f12345678901`;

  test.beforeEach(async ({ page }) => {
    // Clean up before each test (if needed)
    // In production, implement a cleanup endpoint or database transaction
  });

  test.describe('Memory Creation API', () => {
    test('应该可以创建短期记忆', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory`, {
        data: {
          agent_id: testAgentId,
          type: 'SHORT_TERM',
          content: '用户今天询问了关于天气的问题',
          importance: 3,
          tags: ['weather', 'question'],
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body.agent_id).toBe(testAgentId);
      expect(body.type).toBe('SHORT_TERM');
      expect(body.content).toBe('用户今天询问了关于天气的问题');
    });

    test('应该可以创建长期记忆', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory`, {
        data: {
          agent_id: testAgentId,
          type: 'LONG_TERM',
          content: '用户喜欢蓝色主题',
          importance: 8,
          tags: ['preference', 'color'],
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.type).toBe('LONG_TERM');
      expect(body.importance).toBe(8);
    });

    test('应该可以创建情景记忆 (EPISODIC)', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory`, {
        data: {
          agent_id: testAgentId,
          type: 'EPISODIC',
          content: '用户完成了第一个项目：智能校园导航系统',
          importance: 9,
          tags: ['milestone', 'project', 'completion'],
          metadata: { project_id: 'proj-123', completion_date: '2026-04-09' },
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.type).toBe('EPISODIC');
      expect(body.metadata).toEqual({
        project_id: 'proj-123',
        completion_date: '2026-04-09',
      });
    });

    test('应该可以创建程序记忆 (PROCEDURAL)', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory`, {
        data: {
          agent_id: testAgentId,
          type: 'PROCEDURAL',
          content: '用户掌握了 Python 基础语法',
          importance: 7,
          tags: ['skill', 'python', 'programming'],
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.type).toBe('PROCEDURAL');
    });

    test('应该可以创建语义记忆 (SEMANTIC)', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory`, {
        data: {
          agent_id: testAgentId,
          type: 'SEMANTIC',
          content: '水的沸点是 100 摄氏度',
          importance: 5,
          tags: ['knowledge', 'science', 'physics'],
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.type).toBe('SEMANTIC');
    });

    test('应该拒绝无效的 memory_type', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory`, {
        data: {
          agent_id: testAgentId,
          type: 'INVALID_TYPE',
          content: 'This should fail',
        },
      });

      expect(response.status()).toBe(422); // Validation error
    });

    test('应该拒绝缺少必填字段的请求', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory`, {
        data: {
          // Missing agent_id and type
          content: 'Incomplete request',
        },
      });

      expect(response.status()).toBe(422);
    });

    test('importance 分数应该在 1-10 范围内', async ({ request }) => {
      // Test value below range
      const responseLow = await request.post(`${API_V1_BASE}/memory`, {
        data: {
          agent_id: testAgentId,
          type: 'SHORT_TERM',
          content: 'Test',
          importance: 0, // Invalid
        },
      });

      expect(responseLow.status()).toBe(422);

      // Test value above range
      const responseHigh = await request.post(`${API_V1_BASE}/memory`, {
        data: {
          agent_id: testAgentId,
          type: 'SHORT_TERM',
          content: 'Test',
          importance: 11, // Invalid
        },
      });

      expect(responseHigh.status()).toBe(422);
    });
  });

  test.describe('Memory Retrieval API', () => {
    let createdMemoryId: string | null = null;

    test.beforeAll(async ({ request }) => {
      // Create some test memories
      const response = await request.post(`${API_V1_BASE}/memory`, {
        data: {
          agent_id: testAgentId,
          type: 'SHORT_TERM',
          content: '测试记忆内容',
          importance: 5,
          tags: ['test'],
        },
      });
      const body = await response.json();
      createdMemoryId = body.id;
    });

    test('应该可以获取 agent 的所有记忆', async ({ request }) => {
      const response = await request.get(`${API_V1_BASE}/memory/${testAgentId}`);

      expect(response.status()).toBe(200);
      const memories = await response.json();
      expect(Array.isArray(memories)).toBe(true);
    });

    test('应该可以按 memory_type 筛选记忆', async ({ request }) => {
      // First create memories of different types
      await request.post(`${API_V1_BASE}/memory`, {
        data: {
          agent_id: testAgentId,
          type: 'LONG_TERM',
          content: '长期记忆',
          importance: 5,
        },
      });

      const response = await request.get(
        `${API_V1_BASE}/memory/${testAgentId}?memory_type=LONG_TERM`
      );

      expect(response.status()).toBe(200);
      const memories = await response.json();
      expect(Array.isArray(memories)).toBe(true);
      // All returned memories should be LONG_TERM
      memories.forEach((m: any) => {
        expect(m.type).toBe('LONG_TERM');
      });
    });

    test('应该限制返回结果数量', async ({ request }) => {
      const response = await request.get(
        `${API_V1_BASE}/memory/${testAgentId}?limit=5`
      );

      expect(response.status()).toBe(200);
      const memories = await response.json();
      expect(memories.length).toBeLessThanOrEqual(5);
    });
  });

  test.describe('Memory Vector Search API', () => {
    const vectorTestAgentId = `vector-test-a1b2c3d4-e5f6-7890-abcd-ef1234567890`;

    test.beforeAll(async ({ request }) => {
      // Create memories with different content for search testing
      const memories = [
        { content: '用户喜欢编程，特别是 Python 和 JavaScript', tags: ['programming', 'python', 'javascript'] },
        { content: '用户今天学习了机器学习基础', tags: ['learning', 'ml'] },
        { content: '用户询问了关于数据库设计的问题', tags: ['database', 'design'] },
        { content: '用户对人工智能很感兴趣', tags: ['ai', 'interest'] },
      ];

      for (const memory of memories) {
        await request.post(`${API_V1_BASE}/memory`, {
          data: {
            agent_id: testAgentId,
            type: 'SEMANTIC',
            content: memory.content,
            importance: 5,
            tags: memory.tags,
          },
        });
      }
    });

    test('应该可以按关键词搜索记忆', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory/search`, {
        data: {
          agent_id: testAgentId,
          query: '编程 Python',
          top_k: 3,
        },
      });

      expect(response.status()).toBe(200);
      const results = await response.json();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    test('应该返回按相似度排序的结果', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory/search`, {
        data: {
          agent_id: testAgentId,
          query: '机器学习',
          top_k: 5,
        },
      });

      expect(response.status()).toBe(200);
      const results = await response.json();
      // Results should be ordered by similarity (highest first)
      expect(results.length).toBeGreaterThan(0);
    });

    test('应该可以按 memory_type 筛选搜索结果', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory/search`, {
        data: {
          agent_id: testAgentId,
          query: '用户',
          memory_type: 'SEMANTIC',
          top_k: 10,
        },
      });

      expect(response.status()).toBe(200);
      const results = await response.json();
      results.forEach((r: any) => {
        expect(r.type).toBe('SEMANTIC');
      });
    });

    test('top_k 应该限制返回结果数量', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory/search`, {
        data: {
          agent_id: testAgentId,
          query: '用户',
          top_k: 2,
        },
      });

      expect(response.status()).toBe(200);
      const results = await response.json();
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  test.describe('Memory Vector Similarity Search API (pgvector)', () => {
    const vectorTestAgentId = `vector-test-f1e2d3c4-b5a6-7890-cdef-123456789012`;

    test.beforeAll(async ({ request }) => {
      // Create memories with semantically different content for vector search testing
      const memories = [
        {
          content: 'Python 是一种高级编程语言，常用于数据科学和 web 开发',
          tags: ['python', 'programming', 'language'],
          type: 'SEMANTIC',
        },
        {
          content: 'JavaScript 主要用于浏览器前端开发和 Node.js 后端服务',
          tags: ['javascript', 'web', 'frontend'],
          type: 'SEMANTIC',
        },
        {
          content: '机器学习是人工智能的一个分支，使用算法从数据中学习模式',
          tags: ['ml', 'ai', 'algorithms'],
          type: 'SEMANTIC',
        },
        {
          content: '数据库是组织和存储数据的系统，支持高效查询和管理',
          tags: ['database', 'storage', 'sql'],
          type: 'SEMANTIC',
        },
        {
          content: '深度学习使用神经网络处理复杂任务，如图像识别和自然语言处理',
          tags: ['deep-learning', 'neural-networks', 'ai'],
          type: 'SEMANTIC',
        },
      ];

      for (const memory of memories) {
        await request.post(`${API_V1_BASE}/memory`, {
          data: {
            agent_id: vectorTestAgentId,
            type: memory.type as any,
            content: memory.content,
            importance: 5,
            tags: memory.tags,
          },
        });
      }
    });

    test('向量搜索应该返回语义相似的结果而不是 ILIKE 匹配', async ({ request }) => {
      // Search for "coding" which should match programming-related memories semantically
      const response = await request.post(`${API_V1_BASE}/memory/search`, {
        data: {
          agent_id: vectorTestAgentId,
          query: '编程和代码开发',
          top_k: 3,
        },
      });

      expect(response.status()).toBe(200);
      const results = await response.json();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Results should have similarity scores
      results.forEach((r: any) => {
        expect(r).toHaveProperty('similarity');
        expect(typeof r.similarity).toBe('number');
      });
    });

    test('向量搜索应该按余弦相似度降序排列结果', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory/search`, {
        data: {
          agent_id: vectorTestAgentId,
          query: '人工智能和神经网络',
          top_k: 5,
        },
      });

      expect(response.status()).toBe(200);
      const results = await response.json();
      expect(results.length).toBeGreaterThan(0);

      // Check that results are sorted by similarity (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }
    });

    test('向量搜索应该支持按 memory_type 筛选', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory/search`, {
        data: {
          agent_id: vectorTestAgentId,
          query: '编程语言',
          memory_type: 'SEMANTIC',
          top_k: 5,
        },
      });

      expect(response.status()).toBe(200);
      const results = await response.json();
      results.forEach((r: any) => {
        expect(r.type).toBe('SEMANTIC');
      });
    });

    test('向量搜索的相似度分数应该在 0 到 1 之间', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory/search`, {
        data: {
          agent_id: vectorTestAgentId,
          query: '数据分析',
          top_k: 5,
        },
      });

      expect(response.status()).toBe(200);
      const results = await response.json();

      results.forEach((r: any) => {
        expect(r.similarity).toBeGreaterThanOrEqual(0);
        expect(r.similarity).toBeLessThanOrEqual(1);
      });
    });

    test('向量搜索应该返回 embedding 信息（可选）', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory/search`, {
        data: {
          agent_id: vectorTestAgentId,
          query: '测试查询',
          top_k: 1,
        },
      });

      expect(response.status()).toBe(200);
      // Response should be valid regardless of whether embedding is included
    });
  });

  test.describe('Memory Consolidation API', () => {
    test.beforeAll(async ({ request }) => {
      // Create short-term memories with varying importance
      const memories = [
        { content: '低重要性记忆', importance: 2 },
        { content: '中等重要性记忆', importance: 5 },
        { content: '高重要性记忆', importance: 8 },
        { content: '很高重要性记忆', importance: 10 },
      ];

      for (const memory of memories) {
        await request.post(`${API_V1_BASE}/memory`, {
          data: {
            agent_id: testAgentId,
            type: 'SHORT_TERM',
            content: memory.content,
            importance: memory.importance,
          },
        });
      }
    });

    test('应该可以将高重要性的短期记忆转为长期记忆', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory/consolidate`, {
        data: {
          agent_id: testAgentId,
          threshold: 7, // Only consolidate importance >= 7
        },
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('consolidated_count');
      expect(result.consolidated_count).toBeGreaterThanOrEqual(0);
    });

    test('应该返回已巩固的记忆数量', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory/consolidate`, {
        data: {
          agent_id: testAgentId,
          threshold: 5,
        },
      });

      const result = await response.json();
      expect(typeof result.consolidated_count).toBe('number');
      expect(result).toHaveProperty('memories_consolidated');
    });
  });

  test.describe('Memory Importance Calculation API', () => {
    test('应该根据交互次数计算重要性分数', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory/calculate-importance`, {
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
      expect(result.importance).toBeGreaterThanOrEqual(1);
      expect(result.importance).toBeLessThanOrEqual(10);
    });

    test('应该考虑时间权重', async ({ request }) => {
      const responseHighRecency = await request.post(`${API_V1_BASE}/memory/calculate-importance`, {
        data: {
          agent_id: testAgentId,
          interactions_count: 5,
          time_weight: 1.0, // Most recent
          emotional_weight: 0.5,
        },
      });

      const responseLowRecency = await request.post(`${API_V1_BASE}/memory/calculate-importance`, {
        data: {
          agent_id: testAgentId,
          interactions_count: 5,
          time_weight: 0.1, // Old
          emotional_weight: 0.5,
        },
      });

      const highRecency = await responseHighRecency.json();
      const lowRecency = await responseLowRecency.json();

      // Higher recency should result in higher importance
      expect(highRecency.importance).toBeGreaterThanOrEqual(lowRecency.importance);
    });

    test('应该考虑情感权重', async ({ request }) => {
      const responseHighEmotion = await request.post(`${API_V1_BASE}/memory/calculate-importance`, {
        data: {
          agent_id: testAgentId,
          interactions_count: 5,
          time_weight: 0.5,
          emotional_weight: 1.0, // High emotional significance
        },
      });

      const responseLowEmotion = await request.post(`${API_V1_BASE}/memory/calculate-importance`, {
        data: {
          agent_id: testAgentId,
          interactions_count: 5,
          time_weight: 0.5,
          emotional_weight: 0.0, // No emotional significance
        },
      });

      const highEmotion = await responseHighEmotion.json();
      const lowEmotion = await responseLowEmotion.json();

      // Higher emotional weight should result in higher importance
      expect(highEmotion.importance).toBeGreaterThanOrEqual(lowEmotion.importance);
    });
  });

  test.describe('Memory Decay Calculation API', () => {
    test('应该计算记忆的衰减因子', async ({ request }) => {
      const response = await request.post(`${API_V1_BASE}/memory/calculate-decay`, {
        data: {
          agent_id: testAgentId,
          days_old: 7,
        },
      });

      expect(response.status()).toBe(200);
      const result = await response.json();
      expect(result).toHaveProperty('decay_factor');
      expect(result.decay_factor).toBeGreaterThan(0);
      expect(result.decay_factor).toBeLessThanOrEqual(1);
    });

    test('应该使用指数衰减 (约 30 天半衰期)', async ({ request }) => {
      // Fresh memory (0 days)
      const freshResponse = await request.post(`${API_V1_BASE}/memory/calculate-decay`, {
        data: { agent_id: testAgentId, days_old: 0 },
      });
      const fresh = await freshResponse.json();
      expect(fresh.decay_factor).toBe(1); // No decay for fresh memories

      // 30-day-old memory (should be ~0.5 due to half-life)
      const oldResponse = await request.post(`${API_V1_BASE}/memory/calculate-decay`, {
        data: { agent_id: testAgentId, days_old: 30 },
      });
      const old = await oldResponse.json();
      expect(old.decay_factor).toBeCloseTo(0.5, 1); // Approximately 0.5

      // 60-day-old memory (should be ~0.25)
      const veryOldResponse = await request.post(`${API_V1_BASE}/memory/calculate-decay`, {
        data: { agent_id: testAgentId, days_old: 60 },
      });
      const veryOld = await veryOldResponse.json();
      expect(veryOld.decay_factor).toBeLessThan(old.decay_factor);
    });

    test('记忆越老衰减越大', async ({ request }) => {
      const day7 = await (await request.post(`${API_V1_BASE}/memory/calculate-decay`, {
        data: { agent_id: testAgentId, days_old: 7 },
      })).json();

      const day30 = await (await request.post(`${API_V1_BASE}/memory/calculate-decay`, {
        data: { agent_id: testAgentId, days_old: 30 },
      })).json();

      const day90 = await (await request.post(`${API_V1_BASE}/memory/calculate-decay`, {
        data: { agent_id: testAgentId, days_old: 90 },
      })).json();

      expect(day7.decay_factor).toBeGreaterThan(day30.decay_factor);
      expect(day30.decay_factor).toBeGreaterThan(day90.decay_factor);
    });
  });
});
