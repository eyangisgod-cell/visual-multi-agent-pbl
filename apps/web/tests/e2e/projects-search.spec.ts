/**
 * 项目管理搜索功能 E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('项目管理搜索功能', () => {
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

  test('应该显示搜索框', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');

    // 验证搜索框存在
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();
  });

  test('应该可以按标题搜索项目', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');

    // 输入搜索关键词
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('测试');

    // 等待搜索结果更新
    await page.waitForTimeout(500);

    // 验证搜索结果
    const projectList = page.locator('[data-testid="project-list"]');
    const projects = projectList.locator('[data-testid="project-item"]');

    // 所有显示的项目应该包含搜索关键词
    const count = await projects.count();
    for (let i = 0; i < count; i++) {
      const project = projects.nth(i);
      const title = await project.locator('[data-testid="project-title"]').textContent();
      expect(title?.toLowerCase()).toContain('测试');
    }
  });

  test('应该可以按状态筛选项目', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');

    // 选择状态筛选
    const statusSelect = page.locator('[data-testid="status-select"]');
    await statusSelect.selectOption('active');

    // 等待筛选结果更新
    await page.waitForTimeout(500);

    // 验证筛选结果
    const projectList = page.locator('[data-testid="project-list"]');
    const projects = projectList.locator('[data-testid="project-item"]');

    const count = await projects.count();
    for (let i = 0; i < count; i++) {
      const project = projects.nth(i);
      const statusBadge = await project.locator('[data-testid="project-status"]').textContent();
      expect(statusBadge).toBe('进行中');
    }
  });

  test('应该可以清除搜索条件', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');

    // 输入搜索关键词
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('测试');
    await page.waitForTimeout(500);

    // 点击清除按钮
    const clearButton = page.locator('[data-testid="clear-search-btn"]');
    await clearButton.click();
    await page.waitForTimeout(300);

    // 验证搜索框为空
    const searchValue = await searchInput.inputValue();
    expect(searchValue).toBe('');

    // 验证显示所有项目
    const projectList = page.locator('[data-testid="project-list"]');
    const projects = projectList.locator('[data-testid="project-item"]');
    expect(await projects.count()).toBeGreaterThan(0);
  });

  test('应该显示搜索结果数量', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');

    // 输入搜索关键词
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('测试');
    await page.waitForTimeout(500);

    // 验证搜索结果数量显示
    const resultCount = page.locator('[data-testid="search-result-count"]');
    await expect(resultCount).toBeVisible();
  });

  test('应该显示无搜索结果提示', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');

    // 输入不存在的搜索关键词
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('xyz123notexist');
    await page.waitForTimeout(500);

    // 验证无搜索结果提示
    const noResultsMessage = page.locator('[data-testid="no-results-message"]');
    await expect(noResultsMessage).toBeVisible();
  });
});
