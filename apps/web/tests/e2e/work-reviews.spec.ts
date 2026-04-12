/**
 * Task 2 - Work Review System E2E Tests
 *
 * Tests for:
 * - WorkReview model and API
 * - Rating system (1-5 stars)
 * - Comment functionality
 * - Review aggregation (average rating, total count)
 * - Like/unlike functionality
 *
 * @see apps/web/src/app/api/works/[id]/reviews/route.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Task 2: Work Review System', () => {
  const API_BASE = 'http://localhost:3000';
  const API_BASE_REVIEWS = `${API_BASE}/api/works`;
  const API_BASE_REVIEW = `${API_BASE}/api/reviews`;

  // Test data
  const testUserId = `a1b2c3d4-e5f6-7890-abcd-ef1234567890`;
  const testWorkId = `b2c3d4e5-f6a7-8901-bcde-f12345678901`;

  // Helper to get CSRF token
  async function getCsrfToken(page: any): Promise<string> {
    await page.goto(API_BASE);
    const csrfToken = await page.evaluate(() => {
      return document.cookie.split('csrf-token=')[1]?.split(';')[0] || '';
    });
    return csrfToken;
  }

  test.describe('WorkReview Model - Basic Operations', () => {
    test('应该可以创建作品评价', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(`${API_BASE_REVIEWS}/${testWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          userId: testUserId,
          rating: 5,
          comment: '非常棒的作品！',
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body).toHaveProperty('review');
      expect(body.review.rating).toBe(5);
      expect(body.review.comment).toBe('非常棒的作品！');
      expect(body.review.workId).toBe(testWorkId);
      expect(body.review.userId).toBe(testUserId);
    });

    test('应该拒绝评分超出范围的评价（低于 1 分）', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(`${API_BASE_REVIEWS}/${testWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          userId: testUserId,
          rating: 0,
          comment: '无效的评分',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('应该拒绝评分超出范围的评价（高于 5 分）', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(`${API_BASE_REVIEWS}/${testWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          userId: testUserId,
          rating: 6,
          comment: '无效的评分',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('应该拒绝缺少评论内容的创建请求', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(`${API_BASE_REVIEWS}/${testWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          userId: testUserId,
          rating: 5,
        },
      });

      expect(response.status()).toBe(400);
    });

    test('应该可以创建不带评分的评论（仅文字评论）', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(`${API_BASE_REVIEWS}/${testWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          userId: testUserId,
          comment: '很好的作品',
        },
      });

      expect(response.status()).toBe(201);
    });
  });

  test.describe('Review Aggregation', () => {
    test('应该可以获取作品的评价列表', async ({ request }) => {
      const response = await request.get(`${API_BASE_REVIEWS}/${testWorkId}/reviews`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('reviews');
      expect(Array.isArray(body.reviews)).toBe(true);
    });

    test('应该可以获取作品的评分统计', async ({ request }) => {
      const response = await request.get(`${API_BASE_REVIEWS}/${testWorkId}/reviews/stats`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('averageRating');
      expect(body).toHaveProperty('totalReviews');
      expect(body).toHaveProperty('ratingDistribution');
    });

    test('评分统计应该正确计算平均分', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);
      const uniqueWorkId = `work-${Date.now()}`;

      // Create 3 reviews with ratings 3, 4, 5
      await request.post(`${API_BASE_REVIEWS}/${uniqueWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: { userId: testUserId, rating: 3, comment: 'ok' },
      });
      await request.post(`${API_BASE_REVIEWS}/${uniqueWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: { userId: `${testUserId}-2`, rating: 4, comment: 'good' },
      });
      await request.post(`${API_BASE_REVIEWS}/${uniqueWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: { userId: `${testUserId}-3`, rating: 5, comment: 'excellent' },
      });

      const response = await request.get(`${API_BASE_REVIEWS}/${uniqueWorkId}/reviews/stats`);
      expect(response.status()).toBe(200);
      const body = await response.json();

      // Average of 3, 4, 5 = 4
      expect(body.averageRating).toBeCloseTo(4, 1);
      expect(body.totalReviews).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Review Update and Delete', () => {
    test('应该可以更新自己的评价', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // First create a review
      const createResponse = await request.post(`${API_BASE_REVIEWS}/${testWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          userId: testUserId,
          rating: 3,
          comment: '一般般',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdReview = await createResponse.json();

      // Update the review
      const updateResponse = await request.put(`${API_BASE_REVIEW}/${createdReview.review.id}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          rating: 5,
          comment: '非常好！',
        },
      });

      expect(updateResponse.status()).toBe(200);
      const updatedReview = await updateResponse.json();
      expect(updatedReview.review.rating).toBe(5);
      expect(updatedReview.review.comment).toBe('非常好！');
    });

    test('应该只能删除自己的评价', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Create a review
      const createResponse = await request.post(`${API_BASE_REVIEWS}/${testWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          userId: testUserId,
          rating: 4,
          comment: '不错',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdReview = await createResponse.json();

      // Delete the review
      const deleteResponse = await request.delete(`${API_BASE_REVIEW}/${createdReview.review.id}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: { userId: testUserId },
      });

      expect(deleteResponse.status()).toBe(200);

      // Verify it's deleted
      const getResponse = await request.get(`${API_BASE_REVIEWS}/${testWorkId}/reviews`);
      const body = await getResponse.json();
      const reviewExists = body.reviews.some((r: any) => r.id === createdReview.review.id);
      expect(reviewExists).toBe(false);
    });

    test('应该拒绝更新不属于自己的评价', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Create a review with user1
      const createResponse = await request.post(`${API_BASE_REVIEWS}/${testWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          userId: 'user-1',
          rating: 4,
          comment: '不错',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdReview = await createResponse.json();

      // Try to update with user2
      const updateResponse = await request.put(`${API_BASE_REVIEW}/${createdReview.review.id}`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          userId: 'user-2',
          rating: 5,
          comment: '改分',
        },
      });

      expect(updateResponse.status()).toBe(403);
    });
  });

  test.describe('Work Like/Unlike', () => {
    test('应该可以点赞作品', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(`${API_BASE_REVIEWS}/${testWorkId}/like`, {
        headers: { 'x-csrf-token': csrfToken },
        data: { userId: testUserId },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.liked).toBe(true);
      expect(body.likeCount).toBeGreaterThanOrEqual(1);
    });

    test('应该可以取消点赞', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // First like
      await request.post(`${API_BASE_REVIEWS}/${testWorkId}/like`, {
        headers: { 'x-csrf-token': csrfToken },
        data: { userId: testUserId },
      });

      // Then unlike
      const unlikeResponse = await request.post(`${API_BASE_REVIEWS}/${testWorkId}/like`, {
        headers: { 'x-csrf-token': csrfToken },
        data: { userId: testUserId },
      });

      expect(unlikeResponse.status()).toBe(200);
      const body = await unlikeResponse.json();
      expect(body.liked).toBe(false);
    });

    test('应该可以获取作品的点赞数', async ({ request }) => {
      const response = await request.get(`${API_BASE_REVIEWS}/${testWorkId}/likes`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('likeCount');
      expect(typeof body.likeCount).toBe('number');
    });

    test('应该可以检查当前用户是否已点赞', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      // Like the work
      await request.post(`${API_BASE_REVIEWS}/${testWorkId}/like`, {
        headers: { 'x-csrf-token': csrfToken },
        data: { userId: testUserId },
      });

      // Check status
      const response = await request.get(`${API_BASE_REVIEWS}/${testWorkId}/like/status?userId=${testUserId}`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.liked).toBe(true);
    });
  });

  test.describe('Review Data Model Validation', () => {
    test('评价 ID 应该是 UUID 格式', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(`${API_BASE_REVIEWS}/${testWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          userId: testUserId,
          rating: 4,
          comment: '测试评价',
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();

      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(body.review.id).toMatch(uuidPattern);
    });

    test('评价应该包含创建时间', async ({ page, request }) => {
      const csrfToken = await getCsrfToken(page);

      const response = await request.post(`${API_BASE_REVIEWS}/${testWorkId}/reviews`, {
        headers: { 'x-csrf-token': csrfToken },
        data: {
          userId: testUserId,
          rating: 4,
          comment: '时间测试',
        },
      });

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.review.createdAt).toBeDefined();
      const createdAt = new Date(body.review.createdAt);
      expect(createdAt.getTime()).not.toBeNaN();
    });
  });
});
