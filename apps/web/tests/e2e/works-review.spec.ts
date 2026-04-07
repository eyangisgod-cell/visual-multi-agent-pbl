/**
 * 作品评价系统 E2E Tests
 *
 * Tests for work review system:
 * - 点赞功能 (Like)
 * - 评论功能 (Comment)
 */

import { test, expect } from '@playwright/test';

test.describe('作品评价系统', () => {
  // 辅助函数：管理员登录
  async function loginAsAdmin(page: any) {
    const context = page.context();
    await context.clearCookies();
    await page.goto('/auth/login', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  test.describe('作品点赞功能', () => {
    test('应该可以点赞作品', async ({ page }) => {
      await loginAsAdmin(page);

      // 导航到作品管理页面
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');

      // 等待作品列表加载
      await page.waitForTimeout(2000);

      // 查找第一个作品的点赞按钮
      const likeButton = page.locator('[data-testid="like-btn"]').first();
      const likeCount = page.locator('[data-testid="like-count"]').first();

      // 获取点赞前的数量
      const beforeCount = await likeCount.textContent();

      // 点击点赞按钮
      await likeButton.click();
      await page.waitForTimeout(1000);

      // 验证点赞数增加
      const afterCount = await likeCount.textContent();
      expect(parseInt(afterCount || '0')).toBeGreaterThan(parseInt(beforeCount || '0'));
    });

    test('应该可以取消点赞', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 先点赞
      const likeButton = page.locator('[data-testid="like-btn"]').first();
      const likeCount = page.locator('[data-testid="like-count"]').first();

      await likeButton.click();
      await page.waitForTimeout(500);

      // 获取点赞后的数量
      const afterLikeCount = await likeCount.textContent();

      // 再次点击取消点赞
      await likeButton.click();
      await page.waitForTimeout(500);

      // 验证点赞数恢复
      const afterUnlikeCount = await likeCount.textContent();
      expect(afterUnlikeCount).toBe(afterLikeCount);
    });

    test('应该显示作品的点赞状态', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 验证点赞按钮存在
      const likeButton = page.locator('[data-testid="like-btn"]').first();
      await expect(likeButton).toBeVisible();

      // 验证点赞按钮有正确的图标或文字
      const likeIcon = likeButton.locator('svg');
      await expect(likeIcon).toBeVisible();
    });
  });

  test.describe('作品评论功能', () => {
    test('应该可以发表评论', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 打开评论区域
      const commentToggle = page.locator('[data-testid="comment-toggle"]').first();
      await commentToggle.click();
      await page.waitForTimeout(500);

      // 查找评论输入框
      const commentInput = page.locator('[data-testid="comment-input"]');
      const submitButton = page.locator('[data-testid="comment-submit"]');

      // 输入评论内容
      await commentInput.fill('这是一条测试评论');
      await submitButton.click();
      await page.waitForTimeout(1000);

      // 验证评论发表成功
      const successMessage = page.locator('[data-testid="comment-success"]');
      await expect(successMessage).toBeVisible();

      // 验证评论列表中包含新评论
      const commentList = page.locator('[data-testid="comment-list"]');
      await expect(commentList).toContainText('这是一条测试评论');
    });

    test('应该显示评论列表', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 打开评论区域
      const commentToggle = page.locator('[data-testid="comment-toggle"]').first();
      await commentToggle.click();
      await page.waitForTimeout(500);

      // 验证评论列表存在
      const commentList = page.locator('[data-testid="comment-list"]');
      await expect(commentList).toBeVisible();

      // 验证评论包含作者和内容
      const commentItems = page.locator('[data-testid="comment-item"]');
      const count = await commentItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test('应该可以回复评论', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 打开评论区域
      const commentToggle = page.locator('[data-testid="comment-toggle"]').first();
      await commentToggle.click();
      await page.waitForTimeout(500);

      // 查找第一条评论的回复按钮
      const replyButton = page.locator('[data-testid="reply-btn"]').first();
      const replyButtonVisible = await replyButton.isVisible();

      if (replyButtonVisible) {
        await replyButton.click();
        await page.waitForTimeout(300);

        // 查找回复输入框
        const replyInput = page.locator('[data-testid="reply-input"]');
        const replySubmit = page.locator('[data-testid="reply-submit"]');

        // 输入回复内容
        await replyInput.fill('这是一条回复');
        await replySubmit.click();
        await page.waitForTimeout(1000);

        // 验证回复成功
        const successMessage = page.locator('[data-testid="reply-success"]');
        await expect(successMessage).toBeVisible();
      }
    });
  });

  test.describe('作品详情页评价功能', () => {
    test('应该在详情页可以点赞和评论', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 点击进入作品详情页
      const viewButton = page.locator('[data-testid="view-work-btn"]').first();
      await viewButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 验证详情页点赞按钮存在
      const detailLikeButton = page.locator('[data-testid="like-btn"]');
      await expect(detailLikeButton).toBeVisible();

      // 验证详情页评论区域存在
      const detailCommentSection = page.locator('[data-testid="comment-section"]');
      await expect(detailCommentSection).toBeVisible();
    });
  });
});
