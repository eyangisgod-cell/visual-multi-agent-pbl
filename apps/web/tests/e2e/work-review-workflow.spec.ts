/**
 * Task 13 - Work Review Workflow E2E Tests
 *
 * Tests for:
 * - Work review status machine (pending_review → approved → published / rejected)
 * - Review queue API
 * - Approve/Reject functionality
 * - Review notes/feedback
 *
 * @see apps/web/src/app/api/admin/works/review/route.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Task 13: Work Review Workflow', () => {
  const API_BASE = 'http://localhost:3000';
  const ADMIN_API_BASE = `${API_BASE}/api/admin/works`;

  // Test data
  const testUserId = `a1b2c3d4-e5f6-7890-abcd-ef1234567890`;
  const testProjectId = `b2c3d4e5-f6a7-8901-bcde-f12345678901`;

  // Helper to get CSRF token
  async function getCsrfToken(page: any): Promise<string> {
    await page.goto(API_BASE);
    const csrfToken = await page.evaluate(() => {
      return document.cookie.split('csrf-token=')[1]?.split(';')[0] || '';
    });
    return csrfToken;
  }

  test.describe('Review Queue API', () => {
    test('应该可以获取待审核作品列表', async ({ request }) => {
      const response = await request.get(`${ADMIN_API_BASE}/review`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('works');
      expect(body).toHaveProperty('pagination');
      expect(Array.isArray(body.works)).toBe(true);
    });

    test('待审核列表应该只包含 pending_review 状态的作品', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // First create a work with pending_review status
      const createResponse = await request.post(`${ADMIN_API_BASE}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          title: 'Test Work for Review',
          projectId: testProjectId,
          userId: testUserId,
          status: 'pending_review',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdWork = await createResponse.json();

      // Fetch pending works
      const reviewResponse = await request.get(`${ADMIN_API_BASE}/review`);
      expect(reviewResponse.status()).toBe(200);
      const body = await reviewResponse.json();

      // All works in the list should have status 'pending_review'
      body.works.forEach((work: any) => {
        expect(work.status).toBe('pending_review');
      });

      // Our created work should be in the list
      const workExists = body.works.some((w: any) => w.id === createdWork.id);
      expect(workExists).toBe(true);
    });

    test('待审核列表应该支持分页', async ({ request }) => {
      const response = await request.get(`${ADMIN_API_BASE}/review?page=1&limit=5`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(5);
      expect(body.works.length).toBeLessThanOrEqual(5);
    });

    test('待审核列表应该包含用户和项目信息', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Create a work
      await request.post(`${ADMIN_API_BASE}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          title: 'Test Work with Details',
          projectId: testProjectId,
          userId: testUserId,
          status: 'pending_review',
        },
      });

      const response = await request.get(`${ADMIN_API_BASE}/review`);
      expect(response.status()).toBe(200);
      const body = await response.json();

      if (body.works.length > 0) {
        const work = body.works[0];
        expect(work).toHaveProperty('user');
        expect(work.user).toHaveProperty('id');
        expect(work.user).toHaveProperty('username');
        expect(work).toHaveProperty('project');
        expect(work.project).toHaveProperty('id');
        expect(work.project).toHaveProperty('title');
      }
    });
  });

  test.describe('Approve/Reject Workflow', () => {
    test('应该可以批准作品（状态变更为 published）', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Create a work with pending_review status
      const createResponse = await request.post(`${ADMIN_API_BASE}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          title: 'Work to Approve',
          projectId: testProjectId,
          userId: testUserId,
          status: 'pending_review',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdWork = await createResponse.json();

      // Approve the work
      const approveResponse = await request.post(`${ADMIN_API_BASE}/${createdWork.id}/review`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'approve',
        },
      });

      expect(approveResponse.status()).toBe(200);
      const approvedWork = await approveResponse.json();
      expect(approvedWork.work.status).toBe('published');

      // Verify the work status is updated
      const getResponse = await request.get(`${ADMIN_API_BASE}/${createdWork.id}`);
      expect(getResponse.status()).toBe(200);
      const work = await getResponse.json();
      expect(work.status).toBe('published');
    });

    test('应该可以拒绝作品（状态变更为 rejected）', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Create a work with pending_review status
      const createResponse = await request.post(`${ADMIN_API_BASE}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          title: 'Work to Reject',
          projectId: testProjectId,
          userId: testUserId,
          status: 'pending_review',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdWork = await createResponse.json();

      // Reject the work with reason
      const rejectResponse = await request.post(`${ADMIN_API_BASE}/${createdWork.id}/review`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'reject',
          reason: '作品不符合要求，需要改进',
        },
      });

      expect(rejectResponse.status()).toBe(200);
      const rejectedWork = await rejectResponse.json();
      expect(rejectedWork.work.status).toBe('rejected');

      // Verify the work status is updated
      const getResponse = await request.get(`${ADMIN_API_BASE}/${createdWork.id}`);
      expect(getResponse.status()).toBe(200);
      const work = await getResponse.json();
      expect(work.status).toBe('rejected');
    });

    test('拒绝作品时必须提供原因', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Create a work with pending_review status
      const createResponse = await request.post(`${ADMIN_API_BASE}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          title: 'Work to Reject No Reason',
          projectId: testProjectId,
          userId: testUserId,
          status: 'pending_review',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdWork = await createResponse.json();

      // Reject without reason should fail
      const rejectResponse = await request.post(`${ADMIN_API_BASE}/${createdWork.id}/review`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'reject',
          reason: '',
        },
      });

      expect(rejectResponse.status()).toBe(400);
    });

    test('应该拒绝无效的审核操作', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Create a work
      const createResponse = await request.post(`${ADMIN_API_BASE}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          title: 'Test Work',
          projectId: testProjectId,
          userId: testUserId,
          status: 'pending_review',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdWork = await createResponse.json();

      // Invalid action
      const invalidResponse = await request.post(`${ADMIN_API_BASE}/${createdWork.id}/review`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'invalid_action',
        },
      });

      expect(invalidResponse.status()).toBe(400);
    });

    test('审核不存在的作品应该返回 404', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(`${ADMIN_API_BASE}/non-existent-id/review`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'approve',
        },
      });

      expect(response.status()).toBe(404);
    });
  });

  test.describe('Review Status Machine', () => {
    test('作品状态流转应该是：draft → pending_review → published', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Create work with draft status
      const createResponse = await request.post(`${ADMIN_API_BASE}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          title: 'Status Flow Test',
          projectId: testProjectId,
          userId: testUserId,
          status: 'draft',
        },
      });

      expect(createResponse.status()).toBe(201);
      const work = await createResponse.json();
      expect(work.status).toBe('draft');

      // Update to pending_review
      const updateResponse = await request.put(`${ADMIN_API_BASE}/${work.id}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          status: 'pending_review',
        },
      });

      expect(updateResponse.status()).toBe(200);
      const updatedWork = await updateResponse.json();
      expect(updatedWork.status).toBe('pending_review');

      // Approve to published
      const approveResponse = await request.post(`${ADMIN_API_BASE}/${work.id}/review`, {
        headers: { 'x-csrf-token': csrfToken },
        data: { action: 'approve' },
      });

      expect(approveResponse.status()).toBe(200);
      const publishedWork = await approveResponse.json();
      expect(publishedWork.work.status).toBe('published');
    });

    test('被拒绝的作品可以重新提交审核', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Create and reject a work
      const createResponse = await request.post(`${ADMIN_API_BASE}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          title: 'Reject and Resubmit',
          projectId: testProjectId,
          userId: testUserId,
          status: 'pending_review',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdWork = await createResponse.json();

      const rejectResponse = await request.post(`${ADMIN_API_BASE}/${createdWork.id}/review`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'reject',
          reason: '需要修改',
        },
      });

      expect(rejectResponse.status()).toBe(200);
      expect(rejectResponse.json().then(r => r.work.status)).toBe('rejected');

      // Update and resubmit
      const updateResponse = await request.put(`${ADMIN_API_BASE}/${createdWork.id}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          status: 'pending_review',
          description: '已根据反馈修改',
        },
      });

      expect(updateResponse.status()).toBe(200);
      const resubmittedWork = await updateResponse.json();
      expect(resubmittedWork.status).toBe('pending_review');
    });
  });

  test.describe('Review Audit Log', () => {
    test('批准作品时应该记录审计日志', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Create a work
      const createResponse = await request.post(`${ADMIN_API_BASE}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          title: 'Audit Log Test Approve',
          projectId: testProjectId,
          userId: testUserId,
          status: 'pending_review',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdWork = await createResponse.json();

      // Approve
      await request.post(`${ADMIN_API_BASE}/${createdWork.id}/review`, {
        headers: { 'x-csrf-token': csrfToken },
        data: { action: 'approve' },
      });

      // Check audit log
      const auditResponse = await request.get(`${API_BASE}/api/admin/audit-logs?actionType=WORK_APPROVED`);
      expect(auditResponse.status()).toBe(200);
      const body = await auditResponse.json();

      const hasApproveLog = body.logs.some((log: any) =>
        log.entityId === createdWork.id &&
        log.action === 'WORK_APPROVED'
      );
      expect(hasApproveLog).toBe(true);
    });

    test('拒绝作品时应该记录审计日志', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Create a work
      const createResponse = await request.post(`${ADMIN_API_BASE}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          title: 'Audit Log Test Reject',
          projectId: testProjectId,
          userId: testUserId,
          status: 'pending_review',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdWork = await createResponse.json();

      // Reject
      await request.post(`${ADMIN_API_BASE}/${createdWork.id}/review`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          action: 'reject',
          reason: '拒绝原因测试',
        },
      });

      // Check audit log
      const auditResponse = await request.get(`${API_BASE}/api/admin/audit-logs?actionType=WORK_REJECTED`);
      expect(auditResponse.status()).toBe(200);
      const body = await auditResponse.json();

      const hasRejectLog = body.logs.some((log: any) =>
        log.entityId === createdWork.id &&
        log.action === 'WORK_REJECTED'
      );
      expect(hasRejectLog).toBe(true);
    });
  });
});
