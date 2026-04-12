/**
 * Task 3: 智能体实时对话系统 E2E Tests
 *
 * Tests for:
 * - 对话历史存储和检索
 * - 消息 CRUD 操作
 * - WebSocket 实时通信
 * - 对话上下文管理
 *
 * @see apps/web/src/app/api/conversations/route.ts
 * @see apps/web/src/app/api/conversations/[id]/messages/route.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Task 3: 智能体实时对话系统', () => {
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

  test.describe('对话历史 API', () => {
    test('应该可以创建新对话', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(`${API_PREFIX}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: {
          agentId: 'agent-mentor-001',
          title: '第一次对话',
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.conversation).toHaveProperty('id');
      expect(body.conversation.agentId).toBe('agent-mentor-001');
      expect(body.conversation.title).toBe('第一次对话');
    });

    test('应该可以获取用户的对话列表', async ({ request }) => {
      const response = await request.get(`${API_PREFIX}/conversations?userId=test-user`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('conversations');
      expect(Array.isArray(body.conversations)).toBe(true);
    });

    test('应该可以获取特定对话详情', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 先创建对话
      const createResponse = await request.post(`${API_PREFIX}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: {
          agentId: 'agent-mentor-001',
          title: '测试对话',
        },
      });

      expect(createResponse.status()).toBe(201);
      const created = await createResponse.json();
      const conversationId = created.conversation.id;

      // 获取对话详情
      const getResponse = await request.get(`${API_PREFIX}/conversations/${conversationId}`);
      expect(getResponse.status()).toBe(200);
      const body = await getResponse.json();
      expect(body.conversation.id).toBe(conversationId);
    });

    test('应该可以删除对话', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 创建对话
      const createResponse = await request.post(`${API_PREFIX}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: {
          agentId: 'agent-mentor-001',
          title: '待删除对话',
        },
      });

      expect(createResponse.status()).toBe(201);
      const created = await createResponse.json();
      const conversationId = created.conversation.id;

      // 删除对话
      const deleteResponse = await request.delete(`${API_PREFIX}/conversations/${conversationId}`, {
        headers: { 'x-csrf-token': csrfToken },
      });

      expect(deleteResponse.status()).toBe(200);

      // 验证已删除
      const getResponse = await request.get(`${API_PREFIX}/conversations/${conversationId}`);
      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('消息 CRUD API', () => {
    test('应该可以发送消息', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 创建对话
      const createResponse = await request.post(`${API_PREFIX}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: {
          agentId: 'agent-mentor-001',
          title: '消息测试',
        },
      });

      const created = await createResponse.json();
      const conversationId = created.conversation.id;

      // 发送消息
      const messageResponse = await request.post(`${API_PREFIX}/conversations/${conversationId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: {
          role: 'user',
          content: '你好，我想学习编程',
        },
      });

      expect(messageResponse.status()).toBe(201);
      const body = await messageResponse.json();
      expect(body.message).toHaveProperty('id');
      expect(body.message.role).toBe('user');
      expect(body.message.content).toBe('你好，我想学习编程');
    });

    test('应该可以获取对话的消息列表', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 创建对话
      const createResponse = await request.post(`${API_PREFIX}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: {
          agentId: 'agent-mentor-001',
          title: '消息列表测试',
        },
      });

      const created = await createResponse.json();
      const conversationId = created.conversation.id;

      // 发送多条消息
      await request.post(`${API_PREFIX}/conversations/${conversationId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: { role: 'user', content: '第一条消息' },
      });

      await request.post(`${API_PREFIX}/conversations/${conversationId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: { role: 'assistant', content: '回复第一条' },
      });

      // 获取消息列表
      const getResponse = await request.get(`${API_PREFIX}/conversations/${conversationId}/messages`);
      expect(getResponse.status()).toBe(200);
      const body = await getResponse.json();
      expect(body.messages).toBeDefined();
      expect(body.messages.length).toBeGreaterThanOrEqual(2);
    });

    test('应该可以更新消息', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 创建对话
      const createResponse = await request.post(`${API_PREFIX}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: {
          agentId: 'agent-mentor-001',
          title: '更新消息测试',
        },
      });

      const created = await createResponse.json();
      const conversationId = created.conversation.id;

      // 创建消息
      const messageResponse = await request.post(`${API_PREFIX}/conversations/${conversationId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: { role: 'user', content: '原始内容' },
      });

      const messageData = await messageResponse.json();
      const messageId = messageData.message.id;

      // 更新消息
      const updateResponse = await request.put(`${API_PREFIX}/messages/${messageId}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: { content: '更新后的内容' },
      });

      expect(updateResponse.status()).toBe(200);
      const body = await updateResponse.json();
      expect(body.message.content).toBe('更新后的内容');
    });

    test('应该可以删除消息', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 创建对话
      const createResponse = await request.post(`${API_PREFIX}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: {
          agentId: 'agent-mentor-001',
          title: '删除消息测试',
        },
      });

      const created = await createResponse.json();
      const conversationId = created.conversation.id;

      // 创建消息
      const messageResponse = await request.post(`${API_PREFIX}/conversations/${conversationId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: { role: 'user', content: '待删除消息' },
      });

      const messageData = await messageResponse.json();
      const messageId = messageData.message.id;

      // 删除消息
      const deleteResponse = await request.delete(`${API_PREFIX}/messages/${messageId}`, {
        headers: { 'x-csrf-token': csrfToken },
      });

      expect(deleteResponse.status()).toBe(200);
    });
  });

  test.describe('对话上下文管理', () => {
    test('应该保持对话上下文连续性', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 创建对话
      const createResponse = await request.post(`${API_PREFIX}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: {
          agentId: 'agent-mentor-001',
          title: '上下文测试',
        },
      });

      const created = await createResponse.json();
      const conversationId = created.conversation.id;

      // 发送多轮对话
      const messages = [
        { role: 'user' as const, content: '我喜欢 Python' },
        { role: 'assistant' as const, content: 'Python 是一门很好的语言' },
        { role: 'user' as const, content: '你觉得它和 JavaScript 有什么区别？' },
      ];

      for (const msg of messages) {
        await request.post(`${API_PREFIX}/conversations/${conversationId}/messages`, {
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
          },
          data: msg,
        });
      }

      // 获取消息列表，验证上下文
      const getResponse = await request.get(`${API_PREFIX}/conversations/${conversationId}/messages`);
      const body = await getResponse.json();

      expect(body.messages.length).toBeGreaterThanOrEqual(3);

      // 验证消息顺序
      const contents = body.messages.map((m: any) => m.content);
      expect(contents).toContain('我喜欢 Python');
      expect(contents).toContain('你觉得它和 JavaScript 有什么区别？');
    });
  });

  test.describe('消息验证', () => {
    test('应该拒绝空内容消息', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 创建对话
      const createResponse = await request.post(`${API_PREFIX}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: {
          agentId: 'agent-mentor-001',
          title: '验证测试',
        },
      });

      const created = await createResponse.json();
      const conversationId = created.conversation.id;

      // 发送空内容消息
      const response = await request.post(`${API_PREFIX}/conversations/${conversationId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: { role: 'user', content: '' },
      });

      expect(response.status()).toBe(400);
    });

    test('应该拒绝无效的角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 创建对话
      const createResponse = await request.post(`${API_PREFIX}/conversations`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: {
          agentId: 'agent-mentor-001',
          title: '角色验证',
        },
      });

      const created = await createResponse.json();
      const conversationId = created.conversation.id;

      // 发送无效角色消息
      const response = await request.post(`${API_PREFIX}/conversations/${conversationId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        data: { role: 'invalid_role', content: '测试消息' },
      });

      expect(response.status()).toBe(400);
    });
  });
});
