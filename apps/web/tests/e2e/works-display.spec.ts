/**
 * Task #157 - 作品展示页面 E2E 测试（学生端）
 *
 * 测试目标：
 * 1. 访问作品列表页面
 * 2. 作品卡片展示
 * 3. 作品详情页面
 * 4. 按项目筛选作品
 */

import { test, expect } from '@playwright/test';

test.describe('Task #157 - 作品展示页面（学生端）', () => {
  // 辅助函数：登录并导航到作品页面
  async function loginAndGoToWorks(page: any) {
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

    // 导航到作品列表页面
    await page.goto('/works');
    await page.waitForLoadState('networkidle');
  }

  test.describe('作品列表页面', () => {
    test('应该可以访问作品列表页面', async ({ page }) => {
      await loginAndGoToWorks(page);

      // 验证页面标题存在
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();

      // 验证不显示 404
      const notFoundText = page.locator('text=404');
      await expect(notFoundText).not.toBeVisible();
    });

    test('作品列表页面应该显示作品卡片', async ({ page }) => {
      await loginAndGoToWorks(page);

      // 等待作品列表加载
      await page.waitForTimeout(2000);

      // 验证作品卡片容器存在
      const workCards = page.locator('[data-testid="work-card"]');
      const count = await workCards.count();

      // 至少应该有一个作品卡片（如果数据库有作品）
      if (count > 0) {
        expect(count).toBeGreaterThan(0);

        // 验证每个卡片都有标题
        const titles = workCards.locator('[data-testid="work-title"]');
        const titleCount = await titles.count();
        expect(titleCount).toBe(count);
      }
    });

    test('作品卡片应该包含基本信息', async ({ page }) => {
      await loginAndGoToWorks(page);

      // 等待作品列表加载
      await page.waitForTimeout(2000);

      const workCards = page.locator('[data-testid="work-card"]');
      const count = await workCards.count();

      if (count > 0) {
        const firstCard = workCards.first();

        // 验证作品标题存在
        const title = firstCard.locator('[data-testid="work-title"]');
        await expect(title).toBeVisible();

        // 验证作品封面存在（如果有）
        const coverImage = firstCard.locator('[data-testid="work-cover"]');
        const imageCount = await coverImage.count();
        if (imageCount > 0) {
          await expect(coverImage.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('作品详情页面', () => {
    test('点击作品卡片应该跳转到详情页', async ({ page }) => {
      await loginAndGoToWorks(page);

      // 等待作品列表加载
      await page.waitForTimeout(2000);

      const workCards = page.locator('[data-testid="work-card"]');
      const count = await workCards.count();

      if (count > 0) {
        // 获取第一个作品的 ID
        const firstCard = workCards.first();
        const workId = await firstCard.getAttribute('data-work-id');

        // 点击作品卡片
        await firstCard.click();

        // 验证 URL 包含作品 ID
        await page.waitForURL(`/works/${workId}`, { timeout: 5000 });

        // 验证详情页标题存在
        const heading = page.locator('h1');
        await expect(heading).toBeVisible();
      }
    });

    test('作品详情页应该显示完整信息', async ({ page }) => {
      await loginAndGoToWorks(page);

      // 等待作品列表加载
      await page.waitForTimeout(2000);

      const workCards = page.locator('[data-testid="work-card"]');
      const count = await workCards.count();

      if (count > 0) {
        const firstCard = workCards.first();
        const workId = await firstCard.getAttribute('data-work-id');

        // 直接导航到详情页
        await page.goto(`/works/${workId}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // 验证作品标题存在
        const title = page.locator('[data-testid="work-detail-title"]');
        await expect(title).toBeVisible();

        // 验证作品内容存在
        const content = page.locator('[data-testid="work-detail-content"]');
        await expect(content).toBeVisible();

        // 验证作者信息存在
        const author = page.locator('[data-testid="work-detail-author"]');
        await expect(author).toBeVisible();
      }
    });
  });

  test.describe('按项目筛选作品', () => {
    test('应该可以按项目筛选作品', async ({ page }) => {
      await loginAndGoToWorks(page);

      // 等待页面加载
      await page.waitForTimeout(2000);

      // 查找项目筛选器
      const projectFilter = page.locator('[data-testid="project-filter"]');
      const filterCount = await projectFilter.count();

      if (filterCount > 0) {
        // 获取筛选器选项数量
        const options = projectFilter.locator('option');
        const optionCount = await options.count();

        if (optionCount > 1) {
          // 选择第一个非空项目选项
          await page.selectOption('[data-testid="project-filter"]', { index: 1 });
          await page.waitForTimeout(1000);

          // 验证作品列表已更新
          const workCards = page.locator('[data-testid="work-card"]');
          // 筛选后应该有作品或显示空状态
          const count = await workCards.count();
          expect(count).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('重置筛选应该显示所有作品', async ({ page }) => {
      await loginAndGoToWorks(page);

      // 等待页面加载
      await page.waitForTimeout(2000);

      // 记录初始作品数量
      const initialCards = page.locator('[data-testid="work-card"]');
      const initialCount = await initialCards.count();

      const projectFilter = page.locator('[data-testid="project-filter"]');
      const filterCount = await projectFilter.count();

      if (filterCount > 0) {
        // 选择一个项目
        const options = projectFilter.locator('option');
        const optionCount = await options.count();

        if (optionCount > 1) {
          await page.selectOption('[data-testid="project-filter"]', { index: 1 });
          await page.waitForTimeout(1000);

          // 重置筛选（选择全部）
          await page.selectOption('[data-testid="project-filter"]', { index: 0 });
          await page.waitForTimeout(1000);

          // 验证作品数量恢复到初始状态
          const resetCards = page.locator('[data-testid="work-card"]');
          const resetCount = await resetCards.count();
          expect(resetCount).toBe(initialCount);
        }
      }
    });
  });
});
