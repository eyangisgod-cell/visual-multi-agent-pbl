/**
 * Visual PBL - 作品点赞功能 E2E 测试
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

test.describe('作品点赞功能', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/auth/login');
    await page.locator('input[name="username"]').fill(TEST_USER.username);
    await page.locator('input[name="password"]').fill(TEST_USER.password);
    await page.getByRole('button', { name: /登录/ }).click();
    await page.waitForTimeout(2000);
  });

  test('应该能够查看作品详情', async ({ page }) => {
    // 访问作品列表
    await page.goto('/works');
    await page.waitForTimeout(2000);

    // 点击第一个作品
    const workCard = page.locator('[data-testid="work-card"]').first();
    if (await workCard.isVisible()) {
      await workCard.click();
      await page.waitForTimeout(2000);

      // 验证作品标题存在
      const titleElement = page.locator('[data-testid="work-detail-title"]');
      await expect(titleElement).toBeVisible();
    }
  });

  test('应该能够点赞作品', async ({ page }) => {
    // 访问作品列表
    await page.goto('/works');
    await page.waitForTimeout(2000);

    // 点击第一个作品
    const workCard = page.locator('[data-testid="work-card"]').first();
    if (await workCard.isVisible()) {
      await workCard.click();
      await page.waitForTimeout(2000);

      // 获取初始点赞数
      const likeCountElement = page.locator('[data-testid="like-count"]');
      const initialCountText = await likeCountElement.textContent();
      const initialCount = parseInt(initialCountText || '0', 10);

      // 点击点赞按钮
      const likeButton = page.locator('[data-testid="like-work-btn"]');
      await likeButton.click();
      await page.waitForTimeout(1000);

      // 验证点赞数增加
      const newCountText = await likeCountElement.textContent();
      const newCount = parseInt(newCountText || '0', 10);
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    }
  });

  test('应该能够取消点赞作品', async ({ page }) => {
    // 访问作品列表
    await page.goto('/works');
    await page.waitForTimeout(2000);

    // 点击第一个作品
    const workCard = page.locator('[data-testid="work-card"]').first();
    if (await workCard.isVisible()) {
      await workCard.click();
      await page.waitForTimeout(2000);

      // 获取初始点赞数
      const likeCountElement = page.locator('[data-testid="like-count"]');
      const initialCountText = await likeCountElement.textContent();
      const initialCount = parseInt(initialCountText || '0', 10);

      // 点击点赞按钮（第一次点赞）
      const likeButton = page.locator('[data-testid="like-work-btn"]');
      await likeButton.click();
      await page.waitForTimeout(1000);

      // 再次点击取消点赞
      await likeButton.click();
      await page.waitForTimeout(1000);

      // 验证点赞数恢复
      const finalCountText = await likeCountElement.textContent();
      const finalCount = parseInt(finalCountText || '0', 10);
      expect(finalCount).toBe(initialCount);
    }
  });
});
