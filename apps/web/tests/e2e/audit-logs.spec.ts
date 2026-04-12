/**
 * Task 11 - Audit Logs System E2E Tests
 *
 * Tests for:
 * - Audit log creation API
 * - Audit log query API (filter by admin/entity/time)
 * - Audit log data model validation
 *
 * @see apps/web/src/app/api/admin/audit-logs/route.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Task 11: Audit Logs System', () => {
  const API_BASE = 'http://localhost:3000';
  const ADMIN_API_BASE = `${API_BASE}/api/admin/audit-logs`;

  // Test data
  const testUserId = `a1b2c3d4-e5f6-7890-abcd-ef1234567890`;
  const testEntityId = `b2c3d4e5-f6a7-8901-bcde-f12345678901`;

  // Helper to get CSRF token from cookie after visiting the site
  async function getCsrfToken(page: any): Promise<string> {
    await page.goto(API_BASE);
    const csrfToken = await page.evaluate(() => {
      return document.cookie.split('csrf-token=')[1]?.split(';')[0] || '';
    });
    return csrfToken;
  }

  test.describe('Audit Log Creation API', () => {
    test('应该可以创建审计日志', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'CREATE_AGENT',
          entityType: 'Agent',
          entityId: testEntityId,
          userId: testUserId,
          username: 'admin',
          metadata: { agent_name: 'Test Agent' },
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body).toHaveProperty('log');
      expect(body.log.action).toBe('CREATE_AGENT');
      expect(body.log.entityType).toBe('Agent');
      expect(body.log.entityId).toBe(testEntityId);
      expect(body.log.userId).toBe(testUserId);
      expect(body.log.username).toBe('admin');
    });

    test('应该可以创建简单的审计日志（仅必填字段）', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'UPDATE_USER',
          entityType: 'User',
          entityId: testEntityId,
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.log.action).toBe('UPDATE_USER');
      expect(body.log.entityType).toBe('User');
    });

    test('应该拒绝缺少 action 字段的请求', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          entityType: 'Agent',
          entityId: testEntityId,
        },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    test('应该可以创建包含 IP 地址的审计日志', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'DELETE_WORK',
          entityType: 'Work',
          entityId: testEntityId,
          ipAddress: '10.0.0.1',
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.log.ipAddress).toBe('10.0.0.1');
    });

    test('应该可以创建包含完整元数据的审计日志', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const metadata = {
        reason: 'User request',
        changes: {
          before: { name: 'Old Name' },
          after: { name: 'New Name' },
        },
      };

      const response = await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'UPDATE_PROJECT',
          entityType: 'Project',
          entityId: testEntityId,
          userId: testUserId,
          metadata,
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.log.metadata).toEqual(metadata);
    });
  });

  test.describe('Audit Log Query API', () => {
    test('应该可以获取审计日志列表', async ({ request }) => {
      const response = await request.get(ADMIN_API_BASE);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('logs');
      expect(body).toHaveProperty('pagination');
      expect(Array.isArray(body.logs)).toBe(true);
      expect(body.pagination).toHaveProperty('page');
      expect(body.pagination).toHaveProperty('limit');
      expect(body.pagination).toHaveProperty('total');
    });

    test('应该支持分页', async ({ request }) => {
      const response = await request.get(`${ADMIN_API_BASE}?page=1&limit=5`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(5);
      expect(body.logs.length).toBeLessThanOrEqual(5);
    });

    test('应该可以按 actionType 筛选', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // First create a log with specific action
      await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'FILTER_TEST_ACTION',
          entityType: 'Test',
          entityId: testEntityId,
        },
      });

      const response = await request.get(
        `${ADMIN_API_BASE}?actionType=FILTER_TEST_ACTION`
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      body.logs.forEach((log: any) => {
        expect(log.action).toBe('FILTER_TEST_ACTION');
      });
    });

    test('应该可以按 entityType 筛选', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // First create a log with specific entity type
      await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'CREATE',
          entityType: 'FILTER_TEST_ENTITY',
          entityId: testEntityId,
        },
      });

      const response = await request.get(
        `${ADMIN_API_BASE}?entityType=FILTER_TEST_ENTITY`
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      body.logs.forEach((log: any) => {
        expect(log.entityType).toBe('FILTER_TEST_ENTITY');
      });
    });

    test('应该可以按 userId 筛选', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);
      const testUser = `filter-test-user-id`;

      // First create a log with specific user
      await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'USER_FILTER_TEST',
          entityType: 'Test',
          entityId: testEntityId,
          userId: testUser,
        },
      });

      const response = await request.get(
        `${ADMIN_API_BASE}?userId=${testUser}`
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      body.logs.forEach((log: any) => {
        expect(log.userId).toBe(testUser);
      });
    });

    test('应该支持组合筛选', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const uniqueAction = 'COMBO_FILTER_TEST';
      const uniqueEntity = 'COMBO_ENTITY';

      await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: uniqueAction,
          entityType: uniqueEntity,
          entityId: testEntityId,
        },
      });

      const response = await request.get(
        `${ADMIN_API_BASE}?actionType=${uniqueAction}&entityType=${uniqueEntity}`
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      body.logs.forEach((log: any) => {
        expect(log.action).toBe(uniqueAction);
        expect(log.entityType).toBe(uniqueEntity);
      });
    });

    test('应该按创建时间降序排列', async ({ request }) => {
      const response = await request.get(`${ADMIN_API_BASE}?limit=10`);

      expect(response.status()).toBe(200);
      const body = await response.json();

      if (body.logs.length > 1) {
        for (let i = 1; i < body.logs.length; i++) {
          const prevTime = new Date(body.logs[i - 1].createdAt).getTime();
          const currTime = new Date(body.logs[i].createdAt).getTime();
          expect(prevTime).toBeGreaterThanOrEqual(currTime);
        }
      }
    });
  });

  test.describe('Audit Log Data Model', () => {
    test('审计日志应该包含所有必需字段', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);
      const action = 'MODEL_TEST_ACTION';

      const createResponse = await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action,
          entityType: 'Model',
          entityId: testEntityId,
          userId: testUserId,
          username: 'model_tester',
          metadata: { test: true },
          ipAddress: '192.168.0.1',
          userAgent: 'TestAgent/1.0',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createBody = await createResponse.json();
      const log = createBody.log;

      // Verify all fields are present
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('entityType');
      expect(log).toHaveProperty('entityId');
      expect(log).toHaveProperty('userId');
      expect(log).toHaveProperty('username');
      expect(log).toHaveProperty('metadata');
      expect(log).toHaveProperty('ipAddress');
      expect(log).toHaveProperty('userAgent');
      expect(log).toHaveProperty('createdAt');

      // Verify field values
      expect(log.action).toBe(action);
      expect(log.entityType).toBe('Model');
      expect(log.entityId).toBe(testEntityId);
      expect(log.userId).toBe(testUserId);
      expect(log.username).toBe('model_tester');
      expect(log.metadata).toEqual({ test: true });
      expect(log.ipAddress).toBe('192.168.0.1');
      expect(log.userAgent).toBe('TestAgent/1.0');
    });

    test('审计日志 ID 应该是 UUID 格式', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'UUID_TEST',
          entityType: 'Test',
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();

      // UUID format check (basic pattern)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(body.log.id).toMatch(uuidPattern);
    });

    test('createdAt 应该是有效的 ISO 日期格式', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'DATE_TEST',
          entityType: 'Test',
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();

      const createdAt = new Date(body.log.createdAt);
      expect(createdAt).toBeInstanceOf(Date);
      expect(createdAt.getTime()).not.toBeNaN();
    });

    test('可选字段可以为 null 或 undefined', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(ADMIN_API_BASE, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'OPTIONAL_FIELDS_TEST',
          entityType: null,
          entityId: null,
          userId: null,
          username: null,
          metadata: null,
          ipAddress: null,
          userAgent: null,
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.log.entityType).toBeNull();
      expect(body.log.entityId).toBeNull();
    });
  });

  test.describe('Audit Log Common Actions', () => {
    test('应该记录 CREATE 操作', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);
      const actions = ['CREATE_USER', 'CREATE_AGENT', 'CREATE_PROJECT', 'CREATE_WORK'];

      for (const action of actions) {
        const response = await request.post(ADMIN_API_BASE, {
          headers: { 'x-csrf-token': csrfToken },
          data: { action, entityType: action.split('_')[1] },
        });
        expect(response.status()).toBe(201);
      }
    });

    test('应该记录 UPDATE 操作', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);
      const actions = ['UPDATE_USER', 'UPDATE_AGENT', 'UPDATE_PROJECT', 'UPDATE_WORK'];

      for (const action of actions) {
        const response = await request.post(ADMIN_API_BASE, {
          headers: { 'x-csrf-token': csrfToken },
          data: { action, entityType: action.split('_')[1] },
        });
        expect(response.status()).toBe(201);
      }
    });

    test('应该记录 DELETE 操作', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);
      const actions = ['DELETE_USER', 'DELETE_AGENT', 'DELETE_PROJECT', 'DELETE_WORK'];

      for (const action of actions) {
        const response = await request.post(ADMIN_API_BASE, {
          headers: { 'x-csrf-token': csrfToken },
          data: { action, entityType: action.split('_')[1] },
        });
        expect(response.status()).toBe(201);
      }
    });
  });

  test.describe('Audit Log Integration with Key Operations', () => {
    test('作品审核通过时应该自动记录审计日志', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // First create a test work
      const workResponse = await request.post(`${API_BASE}/api/admin/works`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          title: 'Test Work for Audit',
          projectId: testEntityId,
          userId: testUserId,
          status: 'pending_review',
        },
      });

      if (workResponse.status() === 201) {
        const work = await workResponse.json();

        // Now approve the work
        const reviewResponse = await request.post(
          `${API_BASE}/api/admin/works/${work.id}/review`,
          {
            headers: { 'x-csrf-token': csrfToken },
            data: { action: 'approve' },
          }
        );

        expect(reviewResponse.status()).toBe(200);

        // Verify audit log was created
        const auditResponse = await request.get(
          `${ADMIN_API_BASE}?actionType=WORK_APPROVED`
        );
        expect(auditResponse.status()).toBe(200);
        const auditData = await auditResponse.json();

        // Should have at least one WORK_APPROVED log
        const hasWorkApprovalLog = auditData.logs.some(
          (log: any) => log.action === 'WORK_APPROVED' && log.entityId === work.id
        );
        expect(hasWorkApprovalLog).toBe(true);
      }
    });

    test('作品审核拒绝时应该自动记录审计日志', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // First create a test work
      const workResponse = await request.post(`${API_BASE}/api/admin/works`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          title: 'Test Work for Reject Audit',
          projectId: testEntityId,
          userId: testUserId,
          status: 'pending_review',
        },
      });

      if (workResponse.status() === 201) {
        const work = await workResponse.json();

        // Reject the work
        const reviewResponse = await request.post(
          `${API_BASE}/api/admin/works/${work.id}/review`,
          {
            headers: { 'x-csrf-token': csrfToken },
            data: { action: 'reject', reason: 'Not meeting requirements' },
          }
        );

        expect(reviewResponse.status()).toBe(200);

        // Verify audit log was created
        const auditResponse = await request.get(
          `${ADMIN_API_BASE}?actionType=WORK_REJECTED`
        );
        expect(auditResponse.status()).toBe(200);
        const auditData = await auditResponse.json();

        // Should have at least one WORK_REJECTED log
        const hasWorkRejectionLog = auditData.logs.some(
          (log: any) => log.action === 'WORK_REJECTED' && log.entityId === work.id
        );
        expect(hasWorkRejectionLog).toBe(true);
      }
    });

    test('创建智能体时应该自动记录审计日志', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);
      const uniqueAgentType = `test_audit_agent_${Date.now()}`;

      // Create an agent
      const agentResponse = await request.post(`${API_BASE}/api/admin/agents`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          agentType: uniqueAgentType,
          name: 'Test Audit Agent',
          description: 'Agent created for audit log testing',
        },
      });

      expect(agentResponse.status()).toBe(201);
      const agent = await agentResponse.json();

      // Verify audit log was created
      const auditResponse = await request.get(
        `${ADMIN_API_BASE}?actionType=AGENT_CREATED&entityType=AgentConfig`
      );
      expect(auditResponse.status()).toBe(200);
      const auditData = await auditResponse.json();

      // Should have at least one AGENT_CREATED log
      const hasAgentCreationLog = auditData.logs.some(
        (log: any) =>
          log.action === 'AGENT_CREATED' &&
          log.entityId === agent.id
      );
      expect(hasAgentCreationLog).toBe(true);
    });
  });
});
