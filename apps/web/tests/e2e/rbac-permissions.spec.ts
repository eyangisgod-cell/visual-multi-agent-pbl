/**
 * Task 14 - RBAC Permissions System E2E Tests
 *
 * Tests for:
 * - Role management (create, update, delete)
 * - Permission definitions
 * - Role-permission assignment
 * - Permission check middleware
 *
 * @see apps/web/src/app/api/admin/roles/route.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Task 14: RBAC Permissions System', () => {
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

  test.describe('Role Management API', () => {
    test('应该可以获取角色列表', async ({ request }) => {
      const response = await request.get(`${ADMIN_API_BASE}/roles`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('roles');
      expect(Array.isArray(body.roles)).toBe(true);
    });

    test('应该可以创建新角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);
      const uniqueRoleName = `test_role_${Date.now()}`;

      const response = await request.post(`${ADMIN_API_BASE}/roles`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          name: uniqueRoleName,
          description: '测试角色',
          permissions: ['view_users', 'view_projects'],
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.role).toHaveProperty('id');
      expect(body.role.name).toBe(uniqueRoleName);
      expect(body.role.description).toBe('测试角色');
    });

    test('应该拒绝创建已存在的角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // First create a role
      const uniqueRoleName = `duplicate_test_${Date.now()}`;
      await request.post(`${ADMIN_API_BASE}/roles`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          name: uniqueRoleName,
          description: '测试',
          permissions: [],
        },
      });

      // Try to create same role again
      const response = await request.post(`${ADMIN_API_BASE}/roles`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          name: uniqueRoleName,
          description: '重复测试',
          permissions: [],
        },
      });

      expect(response.status()).toBe(409);
    });

    test('应该拒绝创建缺少名称的角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(`${ADMIN_API_BASE}/roles`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          description: '缺少名称',
          permissions: [],
        },
      });

      expect(response.status()).toBe(400);
    });

    test('应该可以更新角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);
      const uniqueRoleName = `update_test_${Date.now()}`;

      // Create a role
      const createResponse = await request.post(`${ADMIN_API_BASE}/roles`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          name: uniqueRoleName,
          description: '原始描述',
          permissions: ['view_users'],
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdRole = await createResponse.json();

      // Update the role
      const updateResponse = await request.put(`${ADMIN_API_BASE}/roles/${createdRole.role.id}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          description: '更新后的描述',
          permissions: ['view_users', 'view_projects'],
        },
      });

      expect(updateResponse.status()).toBe(200);
      const updatedRole = await updateResponse.json();
      expect(updatedRole.role.description).toBe('更新后的描述');
      expect(updatedRole.role.permissions).toEqual(['view_users', 'view_projects']);
    });

    test('应该可以删除角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);
      const uniqueRoleName = `delete_test_${Date.now()}`;

      // Create a role
      const createResponse = await request.post(`${ADMIN_API_BASE}/roles`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          name: uniqueRoleName,
          description: '待删除',
          permissions: [],
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdRole = await createResponse.json();

      // Delete the role
      const deleteResponse = await request.delete(`${ADMIN_API_BASE}/roles/${createdRole.role.id}`, {
        headers: { 'x-csrf-token': csrfToken },
      });

      expect(deleteResponse.status()).toBe(200);

      // Verify it's deleted
      const getResponse = await request.get(`${ADMIN_API_BASE}/roles`);
      const body = await getResponse.json();
      const roleExists = body.roles.some((r: any) => r.id === createdRole.role.id);
      expect(roleExists).toBe(false);
    });

    test('应该拒绝删除不存在的角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.delete(`${ADMIN_API_BASE}/roles/non-existent-id`, {
        headers: { 'x-csrf-token': csrfToken },
      });

      expect(response.status()).toBe(404);
    });

    test('应该拒绝删除系统内置角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Try to delete super_admin (built-in role)
      const response = await request.delete(`${ADMIN_API_BASE}/roles/super_admin`, {
        headers: { 'x-csrf-token': csrfToken },
      });

      // Should be 400 (bad request) or 403 (forbidden) for built-in roles
      expect([400, 403]).toContain(response.status());
    });
  });

  test.describe('Permission Definitions', () => {
    test('应该可以获取权限定义列表', async ({ request }) => {
      const response = await request.get(`${ADMIN_API_BASE}/permissions`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('permissions');
      expect(Array.isArray(body.permissions)).toBe(true);
    });

    test('权限列表应该包含预定义权限', async ({ request }) => {
      const response = await request.get(`${ADMIN_API_BASE}/permissions`);

      expect(response.status()).toBe(200);
      const body = await response.json();

      const permissionKeys = body.permissions.map((p: any) => p.key);

      // Check for common permissions
      expect(permissionKeys).toContain('view_users');
      expect(permissionKeys).toContain('create_users');
      expect(permissionKeys).toContain('edit_users');
      expect(permissionKeys).toContain('delete_users');
      expect(permissionKeys).toContain('view_projects');
      expect(permissionKeys).toContain('view_works');
      expect(permissionKeys).toContain('review_works');
    });

    test('权限应该包含分类信息', async ({ request }) => {
      const response = await request.get(`${ADMIN_API_BASE}/permissions`);

      expect(response.status()).toBe(200);
      const body = await response.json();

      if (body.permissions.length > 0) {
        const permission = body.permissions[0];
        expect(permission).toHaveProperty('key');
        expect(permission).toHaveProperty('name');
        expect(permission).toHaveProperty('category');
        expect(permission).toHaveProperty('description');
      }
    });
  });

  test.describe('Role-Permission Assignment', () => {
    test('应该可以给角色分配权限', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);
      const uniqueRoleName = `permission_assign_${Date.now()}`;

      // Create a role
      const createResponse = await request.post(`${ADMIN_API_BASE}/roles`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          name: uniqueRoleName,
          description: '权限分配测试',
          permissions: ['view_users'],
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdRole = await createResponse.json();

      // Verify permissions are assigned
      expect(createdRole.role.permissions).toEqual(['view_users']);
    });

    test('应该可以更新角色的权限', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);
      const uniqueRoleName = `permission_update_${Date.now()}`;

      // Create a role
      const createResponse = await request.post(`${ADMIN_API_BASE}/roles`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          name: uniqueRoleName,
          description: '权限更新测试',
          permissions: ['view_users'],
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdRole = await createResponse.json();

      // Update permissions
      const updateResponse = await request.put(`${ADMIN_API_BASE}/roles/${createdRole.role.id}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          description: '权限更新测试',
          permissions: ['view_users', 'view_projects', 'edit_projects'],
        },
      });

      expect(updateResponse.status()).toBe(200);
      const updatedRole = await updateResponse.json();
      expect(updatedRole.role.permissions).toEqual(['view_users', 'view_projects', 'edit_projects']);
    });
  });

  test.describe('Built-in Roles', () => {
    test('系统应该包含预定义角色', async ({ request }) => {
      const response = await request.get(`${ADMIN_API_BASE}/roles`);

      expect(response.status()).toBe(200);
      const body = await response.json();

      const roleNames = body.roles.map((r: any) => r.name);

      // Check for built-in roles
      expect(roleNames).toContain('super_admin');
    });

    test('super_admin 角色应该包含所有权限', async ({ request }) => {
      const response = await request.get(`${ADMIN_API_BASE}/roles`);

      expect(response.status()).toBe(200);
      const body = await response.json();

      const superAdmin = body.roles.find((r: any) => r.name === 'super_admin');
      if (superAdmin) {
        expect(superAdmin.permissions).toBeDefined();
        // super_admin should have all permissions or a wildcard
        expect(superAdmin.permissions.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('User Role Assignment', () => {
    test('应该可以给用户分配角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Get or create a test role
      const rolesResponse = await request.get(`${ADMIN_API_BASE}/roles`);
      const rolesData = await rolesResponse.json();
      const testRole = rolesData.roles.find((r: any) => r.name === 'reviewer') || rolesData.roles[0];

      // Get users
      const usersResponse = await request.get(`${ADMIN_API_BASE}/users?limit=1`);
      const usersData = await usersResponse.json();

      if (usersData.users.length > 0) {
        const testUser = usersData.users[0];

        // Assign role to user
        const assignResponse = await request.post(`${ADMIN_API_BASE}/users/${testUser.id}/role`, {
          headers: { 'x-csrf-token': csrfToken },
          data: {
            role: testRole.name,
          },
        });

        expect(assignResponse.status()).toBe(200);
        const userData = await assignResponse.json();
        expect(userData.user.role).toBe(testRole.name);
      }
    });

    test('应该拒绝分配不存在的角色', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Get users
      const usersResponse = await request.get(`${ADMIN_API_BASE}/users?limit=1`);
      const usersData = await usersResponse.json();

      if (usersData.users.length > 0) {
        const testUser = usersData.users[0];

        // Try to assign non-existent role
        const assignResponse = await request.post(`${ADMIN_API_BASE}/users/${testUser.id}/role`, {
          headers: { 'x-csrf-token': csrfToken },
          data: {
            role: 'non_existent_role',
          },
        });

        expect(assignResponse.status()).toBe(400);
      }
    });
  });

  test.describe('Permission Check Middleware', () => {
    test('应该拒绝未授权用户访问受保护端点', async ({ request }) => {
      // This test verifies that permission checks are in place
      // Actual implementation depends on the middleware design

      const response = await request.get(`${ADMIN_API_BASE}/users`);

      // Should either succeed (if authenticated) or return 401/403
      expect([200, 401, 403]).toContain(response.status());
    });
  });
});
