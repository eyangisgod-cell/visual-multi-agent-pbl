/**
 * Task 14 - User Role Assignment E2E Tests
 *
 * Tests for:
 * - User role assignment API
 * - Role validation
 * - Authorization checks
 *
 * @see apps/web/src/app/api/admin/users/[id]/role/route.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Task 14: User Role Assignment', () => {
  const API_BASE = 'http://localhost:3000';
  const ADMIN_API_BASE = `${API_BASE}/api/admin`;

  // Helper to get CSRF token
  async function getCsrfToken(page: any): Promise<string> {
    await page.goto(API_BASE);
    const csrfToken = await page.evaluate(() => {
      return document.cookie.split('csrf-token=')[1]?.split(';')[0] || '';
    });
    return csrfToken;
  }

  test.describe('User Role Assignment API', () => {
    test('应该可以给用户分配角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 获取用户列表
      const usersResponse = await request.get(`${ADMIN_API_BASE}/users?limit=1`);
      const usersData = await usersResponse.json();

      if (usersData.users.length > 0) {
        const testUser = usersData.users[0];

        // 分配 reviewer 角色
        const assignResponse = await request.post(`${ADMIN_API_BASE}/users/${testUser.id}/role`, {
          headers: { 'x-csrf-token': csrfToken },
          data: {
            role: 'reviewer',
          },
        });

        expect(assignResponse.status()).toBe(200);
        const userData = await assignResponse.json();
        expect(userData.user.role).toBe('reviewer');
      }
    });

    test('应该拒绝分配不存在的角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 获取用户列表
      const usersResponse = await request.get(`${ADMIN_API_BASE}/users?limit=1`);
      const usersData = await usersResponse.json();

      if (usersData.users.length > 0) {
        const testUser = usersData.users[0];

        // 尝试分配不存在的角色
        const assignResponse = await request.post(`${ADMIN_API_BASE}/users/${testUser.id}/role`, {
          headers: { 'x-csrf-token': csrfToken },
          data: {
            role: 'non_existent_role',
          },
        });

        expect(assignResponse.status()).toBe(400);
      }
    });

    test('应该拒绝给不存在的用户分配角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 尝试给不存在的用户分配角色
      const assignResponse = await request.post(`${ADMIN_API_BASE}/users/non-existent-id/role`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          role: 'reviewer',
        },
      });

      expect(assignResponse.status()).toBe(404);
    });

    test('应该拒绝缺少角色参数的请求', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 获取用户列表
      const usersResponse = await request.get(`${ADMIN_API_BASE}/users?limit=1`);
      const usersData = await usersResponse.json();

      if (usersData.users.length > 0) {
        const testUser = usersData.users[0];

        // 尝试分配空角色
        const assignResponse = await request.post(`${ADMIN_API_BASE}/users/${testUser.id}/role`, {
          headers: { 'x-csrf-token': csrfToken },
          data: {},
        });

        expect(assignResponse.status()).toBe(400);
      }
    });

    test('应该可以更新用户的角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 获取用户列表
      const usersResponse = await request.get(`${ADMIN_API_BASE}/users?limit=1`);
      const usersData = await usersResponse.json();

      if (usersData.users.length > 0) {
        const testUser = usersData.users[0];

        // 先分配 reviewer 角色
        await request.post(`${ADMIN_API_BASE}/users/${testUser.id}/role`, {
          headers: { 'x-csrf-token': csrfToken },
          data: { role: 'reviewer' },
        });

        // 再分配 editor 角色
        const updateResponse = await request.post(`${ADMIN_API_BASE}/users/${testUser.id}/role`, {
          headers: { 'x-csrf-token': csrfToken },
          data: { role: 'editor' },
        });

        expect(updateResponse.status()).toBe(200);
        const userData = await updateResponse.json();
        expect(userData.user.role).toBe('editor');
      }
    });

    test('应该可以获取所有可用角色列表', async ({ request }) => {
      const response = await request.get(`${ADMIN_API_BASE}/roles`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.roles).toBeDefined();
      expect(Array.isArray(body.roles)).toBe(true);
    });
  });

  test.describe('Role Validation', () => {
    test('应该只允许分配系统中存在的角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // 获取用户列表
      const usersResponse = await request.get(`${ADMIN_API_BASE}/users?limit=1`);
      const usersData = await usersResponse.json();

      if (usersData.users.length > 0) {
        const testUser = usersData.users[0];

        // 尝试分配无效角色名
        const invalidRoles = ['admin ', ' ADMIN', '', '   '];

        for (const invalidRole of invalidRoles) {
          const response = await request.post(`${ADMIN_API_BASE}/users/${testUser.id}/role`, {
            headers: { 'x-csrf-token': csrfToken },
            data: { role: invalidRole },
          });

          expect(response.status()).toBe(400);
        }
      }
    });
  });
});
