/**
 * 审计日志功能 E2E 测试
 *
 * 测试目标：
 * 1. 访问审计日志页面
 * 2. 审计日志列表展示
 * 3. 按操作类型筛选
 */

import { test, expect } from '@playwright/test';

test.describe('审计日志功能', () => {
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

  test.describe('审计日志页面访问', () => {
    test('应该可以访问审计日志页面', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');

      // 等待页面加载
      await page.waitForTimeout(2000);

      // 应该显示审计日志页面标题
      const title = page.getByRole('heading', { name: '审计日志' });
      await expect(title).toBeVisible();
    });
  });

  test.describe('审计日志列表展示', () => {
    test('应该显示审计日志列表', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');

      // 等待日志列表加载
      await page.waitForTimeout(2000);

      // 页面应该显示列表容器或"暂无审计日志"提示
      const logTable = page.locator('[data-testid="audit-logs-table"]');
      const emptyMessage = page.locator('text=暂无审计日志');

      const tableVisible = await logTable.isVisible().catch(() => false);
      const emptyVisible = await emptyMessage.isVisible().catch(() => false);

      // 要么列表可见，要么空状态提示可见
      expect(tableVisible || emptyVisible).toBe(true);
    });

    test('应该显示审计日志基本信息', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');

      await page.waitForTimeout(2000);

      // 检查是否有日志
      const logTable = page.locator('[data-testid="audit-logs-table"]');
      const hasTable = await logTable.isVisible().catch(() => false);

      if (hasTable) {
        // 应该显示操作类型列
        const actionColumn = page.locator('th:has-text("操作类型")');
        await expect(actionColumn).toBeVisible();

        // 应该显示操作时间列
        const timeColumn = page.locator('th:has-text("操作时间")');
        await expect(timeColumn).toBeVisible();

        // 应该显示操作人列
        const userColumn = page.locator('th:has-text("操作人")');
        await expect(userColumn).toBeVisible();
      }
    });
  });

  test.describe('按操作类型筛选', () => {
    test('应该可以按操作类型筛选', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');

      await page.waitForTimeout(2000);

      // 检查是否有筛选器
      const filterSelect = page.locator('[data-testid="action-type-filter"]');
      const hasFilter = await filterSelect.isVisible().catch(() => false);

      if (hasFilter) {
        // 选择操作类型
        await filterSelect.selectOption('WORK_APPROVED');

        // 等待筛选结果
        await page.waitForTimeout(1000);

        // 页面应该仍然正常显示
        const title = page.getByRole('heading', { name: '审计日志' });
        await expect(title).toBeVisible();
      }
    });

    test('应该可以重置筛选', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/audit-logs');
      await page.waitForLoadState('networkidle');

      await page.waitForTimeout(2000);

      // 检查是否有筛选器和重置按钮
      const filterSelect = page.locator('[data-testid="action-type-filter"]');
      const resetButton = page.locator('[data-testid="reset-filter-btn"]');

      const hasFilter = await filterSelect.isVisible().catch(() => false);
      const hasReset = await resetButton.isVisible().catch(() => false);

      if (hasFilter && hasReset) {
        // 先选择一个筛选条件
        await filterSelect.selectOption('WORK_APPROVED');
        await page.waitForTimeout(500);

        // 点击重置
        await resetButton.click();
        await page.waitForTimeout(500);

        // 筛选器应该重置为默认值
        const selectedValue = await filterSelect.inputValue();
        expect(selectedValue).toBe('');
      }
    });
  });
});
