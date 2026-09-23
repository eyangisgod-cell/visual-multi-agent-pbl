/**
 * Visual PBL - 好友排行榜功能 E2E 测试
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

test.describe('好友排行榜功能', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/auth/login');
    await page.locator('input[name="username"]').fill(TEST_USER.username);
    await page.locator('input[name="password"]').fill(TEST_USER.password);
    await page.getByRole('button', { name: /登录/ }).click();
    await page.waitForTimeout(2000);
  });

  test('应该能够访问排行榜页面', async ({ page }) => {
    await page.goto('/points/leaderboard');
    await page.waitForTimeout(2000);

    // 验证页面标题存在
    const titleElement = page.locator('h1, [data-testid="leaderboard-title"]');
    await expect(titleElement).toBeVisible();
  });

  test('应该能够查看全站排行榜', async ({ page }) => {
    await page.goto('/points/leaderboard?scope=all');
    await page.waitForTimeout(2000);

    // 验证排行榜列表存在
    const leaderboardList = page.locator('[data-testid="leaderboard-list"]');
    await expect(leaderboardList).toBeVisible();

    // 验证至少有一个排名项
    const firstRank = page.locator('[data-testid="leaderboard-item"]').first();
    await expect(firstRank).toBeVisible();
  });

  test('应该能够查看好友排行榜（需要登录）', async ({ page }) => {
    await page.goto('/points/leaderboard?scope=friends');
    await page.waitForTimeout(2000);

    // 验证页面显示
    const leaderboardList = page.locator('[data-testid="leaderboard-list"]');
    await expect(leaderboardList).toBeVisible();

    // 好友排行榜可能为空（如果没有好友）
    // 验证页面有相应的提示信息或列表
    const emptyMessage = page.locator('[data-testid="empty-friends-message"]');
    const hasItems = await page.locator('[data-testid="leaderboard-item"]').count() > 0;
    const hasEmptyMessage = await emptyMessage.isVisible();

    expect(hasItems || hasEmptyMessage).toBeTruthy();
  });

  test('API 应该返回正确的排行榜数据', async ({ page }) => {
    // 直接调用 API 验证
    const response = await page.request.get('/api/points/leaderboard?limit=10');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('leaderboard');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.leaderboard)).toBeTruthy();

    if (data.leaderboard.length > 0) {
      const firstItem = data.leaderboard[0];
      expect(firstItem).toHaveProperty('rank');
      expect(firstItem).toHaveProperty('userId');
      expect(firstItem).toHaveProperty('nickname');
      expect(firstItem).toHaveProperty('points');
      expect(firstItem).toHaveProperty('level');
    }
  });

  test('API 应该支持好友排行榜查询', async ({ page }) => {
    // 直接调用 API 验证好友排行榜
    const response = await page.request.get('/api/points/leaderboard?scope=friends&limit=10');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('leaderboard');
    expect(data).toHaveProperty('scope');
    expect(data.scope).toBe('friends');
    expect(Array.isArray(data.leaderboard)).toBeTruthy();
  });
});
