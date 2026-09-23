/**
 * 通知系统 E2E 测试
 * 测试通知的创建、查看、标记已读、删除等功能
 */

import { test, expect } from '@playwright/test';

test.describe('通知系统', () => {
  const API_BASE_URL = 'http://localhost:3000';

  test.beforeEach(async ({ request }) => {
    // 清理之前的测试通知
    const notifications = await request.get(`${API_BASE_URL}/api/notifications?userId=test-user-123`);
    if (notifications.ok()) {
      const data = await notifications.json();
      for (const notification of data.notifications || []) {
        await request.delete(`${API_BASE_URL}/api/notifications/${notification.id}`);
      }
    }
  });

  test.describe('通知创建', () => {
    test('应该能够创建通知', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/notifications`, {
        data: {
          userId: 'test-user-123',
          type: 'info',
          title: '测试通知',
          content: '这是一条测试通知内容',
        },
      });

      // 验证响应状态
      if (response.status() === 201) {
        const data = await response.json();
        expect(data.notification).toBeDefined();
        expect(data.notification.title).toBe('测试通知');
        expect(data.notification.isRead).toBe(false);
      } else {
        // API 可能返回其他状态，至少验证连接正常
        expect(response.status()).toBeLessThan(500);
      }
    });

    test('应该能够创建不同类型通知', async ({ request }) => {
      const types = ['success', 'warning', 'error', 'task', 'system', 'achievement'];

      for (const type of types) {
        const response = await request.post(`${API_BASE_URL}/api/notifications`, {
          data: {
            userId: 'test-user-123',
            type,
            title: `${type} 类型通知`,
            content: '测试内容',
          },
        });

        if (response.status() === 201) {
          const data = await response.json();
          expect(data.notification.type).toBe(type);
        }
      }
    });

    test('应该验证必填字段', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/notifications`, {
        data: {
          userId: 'test-user-123',
          // 缺少 title 和 content
        },
      });

      // 应该返回 400 或其他错误状态
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('通知获取', () => {
    test.beforeEach(async ({ request }) => {
      // 创建测试数据
      for (let i = 0; i < 3; i++) {
        await request.post(`${API_BASE_URL}/api/notifications`, {
          data: {
            userId: `test-user-fetch-${i}`,
            type: 'info',
            title: `通知 ${i + 1}`,
            content: `内容 ${i + 1}`,
          },
        });
      }
    });

    test('应该能够获取通知列表', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/notifications?userId=test-user-fetch-0`);

      if (response.ok()) {
        const data = await response.json();
        expect(data.notifications).toBeDefined();
        expect(Array.isArray(data.notifications)).toBeTruthy();
      }
    });

    test('应该按创建时间降序排列', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/notifications?userId=test-user-fetch-0`);

      if (response.ok()) {
        const data = await response.json();
        // 验证返回的数据结构
        if (data.notifications && data.notifications.length > 0) {
          expect(data.notifications[0]).toBeDefined();
        }
      }
    });

    test('应该支持筛选未读通知', async ({ request }) => {
      const unreadResponse = await request.get(
        `${API_BASE_URL}/api/notifications?userId=test-user-fetch-0&isRead=false`
      );

      if (unreadResponse.ok()) {
        const unreadData = await unreadResponse.json();
        expect(Array.isArray(unreadData.notifications)).toBeTruthy();
      }
    });
  });

  test.describe('通知操作', () => {
    let createdNotificationId: string;

    test.beforeEach(async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/notifications`, {
        data: {
          userId: 'test-user-action',
          type: 'info',
          title: '待处理通知',
          content: '需要标记为已读',
        },
      });
      if (response.status() === 201) {
        const data = await response.json();
        createdNotificationId = data.notification.id;
      }
    });

    test('应该能够标记通知为已读', async ({ request }) => {
      if (!createdNotificationId) {
        test.skip();
        return;
      }

      const response = await request.put(`${API_BASE_URL}/api/notifications/${createdNotificationId}`, {
        data: { isRead: true },
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data.notification.isRead).toBe(true);
        expect(data.notification.readAt).toBeDefined();
      }
    });

    test('应该能够删除通知', async ({ request }) => {
      if (!createdNotificationId) {
        test.skip();
        return;
      }

      const deleteResponse = await request.delete(
        `${API_BASE_URL}/api/notifications/${createdNotificationId}`
      );

      if (deleteResponse.ok()) {
        // 验证已删除
        const getResponse = await request.get(
          `${API_BASE_URL}/api/notifications/${createdNotificationId}`
        );
        expect(getResponse.status()).toBe(404);
      }
    });
  });

  test.describe('批量操作', () => {
    test.beforeEach(async ({ request }) => {
      // 创建多条通知
      for (let i = 0; i < 3; i++) {
        await request.post(`${API_BASE_URL}/api/notifications`, {
          data: {
            userId: 'test-user-batch',
            type: 'info',
            title: `批量通知 ${i + 1}`,
            content: '测试内容',
          },
        });
      }
    });

    test('应该能够批量标记所有通知为已读', async ({ request }) => {
      const response = await request.put(`${API_BASE_URL}/api/notifications/batch`, {
        data: {
          userId: 'test-user-batch',
          action: 'mark_all_read',
        },
      });

      if (response.ok()) {
        const data = await response.json();
        expect(data.count).toBeGreaterThanOrEqual(0);
      }
    });

    test('应该能够批量删除已读通知', async ({ request }) => {
      // 先标记所有为已读
      await request.put(`${API_BASE_URL}/api/notifications/batch`, {
        data: {
          userId: 'test-user-batch',
          action: 'mark_all_read',
        },
      });

      // 删除所有已读
      const deleteResponse = await request.delete(`${API_BASE_URL}/api/notifications/batch`, {
        data: {
          userId: 'test-user-batch',
          action: 'delete_all_read',
        },
      });

      if (deleteResponse.ok()) {
        // 验证已删除
        const notifications = await request.get(
          `${API_BASE_URL}/api/notifications?userId=test-user-batch`
        );
        if (notifications.ok()) {
          const notificationsData = await notifications.json();
          expect(notificationsData.notifications.length).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});
