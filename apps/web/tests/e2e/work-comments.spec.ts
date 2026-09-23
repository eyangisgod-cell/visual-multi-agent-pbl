/**
 * E2E Tests for Work Comments with Nested Replies
 * Task 2.4: 评论嵌套回复功能
 */

import { test, expect } from '@playwright/test';

test.describe('Work Comments API', () => {
  const API_BASE = 'http://localhost:3000/api';

  // Valid UUID for testing
  const TEST_WORK_ID = '12345678-1234-1234-1234-123456789012';

  test.describe('POST /api/works/:workId/comments - Create Comment', () => {
    test('should create a top-level comment successfully', async ({ request }) => {
      // Create a comment on a work
      const response = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments`, {
        data: {
          content: 'This is a test comment'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.content).toBe('This is a test comment');
      expect(data.workId).toBe(TEST_WORK_ID);
      expect(data.parentId).toBeNull();
    });

    test('should return 400 when content is empty', async ({ request }) => {
      const response = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments`, {
        data: { content: '' }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('content');
    });

    test('should return 400 when content is missing', async ({ request }) => {
      const response = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments`, {
        data: {}
      });

      expect(response.status()).toBe(400);
    });

    test('should return 404 when work does not exist', async ({ request }) => {
      const response = await request.post(`${API_BASE}/works/00000000-0000-0000-0000-000000000000/comments`, {
        data: { content: 'Test comment' }
      });

      expect(response.status()).toBe(404);
    });
  });

  test.describe('POST /api/works/:workId/comments/reply - Create Reply', () => {
    test('should create a reply to a comment successfully', async ({ request }) => {
      // First create a parent comment
      const parentResponse = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments`, {
        data: { content: 'Parent comment' }
      });
      const parent = await parentResponse.json();

      // Create a reply
      const replyResponse = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments/reply`, {
        data: {
          content: 'This is a reply',
          parentId: parent.id
        }
      });

      expect(replyResponse.status()).toBe(200);
      const reply = await replyResponse.json();
      expect(reply.id).toBeDefined();
      expect(reply.content).toBe('This is a reply');
      expect(reply.parentId).toBe(parent.id);
    });

    test('should return 400 when parentId is invalid', async ({ request }) => {
      const response = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments/reply`, {
        data: {
          content: 'Reply content',
          parentId: 'invalid-parent-id'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should return 400 when replying to a reply (no nested replies)', async ({ request }) => {
      // Create parent comment
      const parentResponse = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments`, {
        data: { content: 'Parent' }
      });
      const parent = await parentResponse.json();

      // Create first reply
      const reply1Response = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments/reply`, {
        data: { content: 'Reply 1', parentId: parent.id }
      });
      const reply1 = await reply1Response.json();

      // Try to reply to the reply (should fail)
      const reply2Response = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments/reply`, {
        data: { content: 'Reply 2', parentId: reply1.id }
      });

      expect(reply2Response.status()).toBe(400);
    });
  });

  test.describe('GET /api/works/:workId/comments - Get Comments', () => {
    test('should return comments with replies', async ({ request }) => {
      // Create parent comment
      await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments`, {
        data: { content: 'Parent comment' }
      });

      // Get comments
      const response = await request.get(`${API_BASE}/works/${TEST_WORK_ID}/comments`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.comments).toBeDefined();
      expect(Array.isArray(data.comments)).toBe(true);
    });

    test('should include replyCount for each comment', async ({ request }) => {
      // Create parent comment
      const parentResponse = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments`, {
        data: { content: 'Parent' }
      });
      const parent = await parentResponse.json();

      // Create reply
      await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments/reply`, {
        data: { content: 'Reply', parentId: parent.id }
      });

      // Get comments and check replyCount
      const response = await request.get(`${API_BASE}/works/${TEST_WORK_ID}/comments`);
      const data = await response.json();

      const parentComment = data.comments.find((c: any) => c.id === parent.id);
      expect(parentComment.replyCount).toBeGreaterThanOrEqual(1);
    });

    test('should support pagination', async ({ request }) => {
      const response = await request.get(`${API_BASE}/works/${TEST_WORK_ID}/comments?page=1&limit=10`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.page).toBe(1);
      expect(data.limit).toBe(10);
      expect(data.total).toBeDefined();
    });
  });

  test.describe('GET /api/comments/:id/replies - Get Replies', () => {
    test('should return all replies for a comment', async ({ request }) => {
      // Create parent comment
      const parentResponse = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments`, {
        data: { content: 'Parent' }
      });
      const parent = await parentResponse.json();

      // Create multiple replies
      await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments/reply`, {
        data: { content: 'Reply 1', parentId: parent.id }
      });
      await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments/reply`, {
        data: { content: 'Reply 2', parentId: parent.id }
      });

      // Get replies
      const response = await request.get(`${API_BASE}/comments/${parent.id}/replies`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.replies).toBeDefined();
      expect(data.replies).toHaveLength(2);
    });

    test('should return empty array when no replies exist', async ({ request }) => {
      // Create comment without replies
      const parentResponse = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments`, {
        data: { content: 'Lonely comment' }
      });
      const parent = await parentResponse.json();

      const response = await request.get(`${API_BASE}/comments/${parent.id}/replies`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.replies).toBeDefined();
      expect(data.replies).toHaveLength(0);
    });
  });

  test.describe('DELETE /api/comments/:id - Delete Comment', () => {
    test('should delete a comment successfully', async ({ request }) => {
      // Create comment
      const createResponse = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments`, {
        data: { content: 'Comment to delete' }
      });
      const comment = await createResponse.json();

      // Delete comment
      const deleteResponse = await request.delete(`${API_BASE}/comments/${comment.id}`);

      expect(deleteResponse.status()).toBe(200);
      const deleteData = await deleteResponse.json();
      expect(deleteData.success).toBe(true);

      // Verify comment is deleted
      const getResponse = await request.get(`${API_BASE}/works/${TEST_WORK_ID}/comments`);
      const data = await getResponse.json();
      const deletedComment = data.comments.find((c: any) => c.id === comment.id);
      expect(deletedComment).toBeUndefined();
    });

    test('should cascade delete replies when parent is deleted', async ({ request }) => {
      // Create parent comment
      const parentResponse = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments`, {
        data: { content: 'Parent to delete' }
      });
      const parent = await parentResponse.json();

      // Create reply
      const replyResponse = await request.post(`${API_BASE}/works/${TEST_WORK_ID}/comments/reply`, {
        data: { content: 'Reply to cascade delete', parentId: parent.id }
      });
      const reply = await replyResponse.json();

      // Delete parent
      await request.delete(`${API_BASE}/comments/${parent.id}`);

      // Verify reply is also deleted
      const getRepliesResponse = await request.get(`${API_BASE}/comments/${parent.id}/replies`);
      expect(getRepliesResponse.status()).toBe(404);
    });
  });
});
