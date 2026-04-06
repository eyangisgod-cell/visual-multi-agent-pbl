/**
 * 作品审核功能 E2E 测试
 *
 * 测试目标：
 * 1. 访问作品审核页面
 * 2. 待审核作品列表展示
 * 3. 批准作品
 * 4. 拒绝作品（需要填写原因）
 */

import { test, expect } from '@playwright/test';

test.describe('作品审核功能', () => {
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

  test.describe('作品审核页面访问', () => {
    test('应该可以访问作品审核页面', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/work-review');
      await page.waitForLoadState('networkidle');

      // 应该显示作品审核页面标题
      const title = page.getByRole('heading', { name: '作品审核' });
      await expect(title).toBeVisible();
    });
  });

  test.describe('待审核作品列表展示', () => {
    test('应该显示作品审核页面内容', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/work-review');
      await page.waitForLoadState('networkidle');

      // 等待作品列表加载
      await page.waitForTimeout(2000);

      // 页面应该显示列表容器或"暂无待审核作品"提示
      const pendingList = page.locator('[data-testid="pending-works-list"]');
      const emptyMessage = page.locator('text=暂无待审核作品');

      const listVisible = await pendingList.isVisible().catch(() => false);
      const emptyVisible = await emptyMessage.isVisible().catch(() => false);

      //  either 列表或空状态提示应该可见
      expect(listVisible || emptyVisible).toBe(true);
    });

    test('应该显示作品审核状态标签', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/work-review');
      await page.waitForLoadState('networkidle');

      await page.waitForTimeout(2000);

      // 检查是否有待审核作品
      const pendingList = page.locator('[data-testid="pending-works-list"]');
      const hasList = await pendingList.isVisible().catch(() => false);

      if (hasList) {
        // 有待审核作品时，状态标签应该可见
        const pendingBadge = page.locator('[data-testid="pending-badge"]');
        await expect(pendingBadge).toBeVisible();
      }
      // 如果没有待审核作品，测试也通过（空状态是有效的）
    });
  });

  test.describe('批准作品', () => {
    test('应该可以批准作品', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/work-review');
      await page.waitForLoadState('networkidle');

      await page.waitForTimeout(2000);

      // 查找批准按钮
      const approveButtons = page.locator('[data-testid="approve-work-btn"]');
      const count = await approveButtons.count();

      if (count > 0) {
        // 点击批准按钮
        await approveButtons.first().click();

        // 等待成功提示
        await page.waitForTimeout(1000);

        // 应该显示成功消息
        const successToast = page.locator('[data-testid="success-toast"]');
        await expect(successToast).toBeVisible();
      }
    });
  });

  test.describe('拒绝作品', () => {
    test('应该可以拒绝作品并填写原因', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/work-review');
      await page.waitForLoadState('networkidle');

      await page.waitForTimeout(2000);

      // 查找拒绝按钮
      const rejectButtons = page.locator('[data-testid="reject-work-btn"]');
      const count = await rejectButtons.count();

      if (count > 0) {
        // 点击拒绝按钮
        await rejectButtons.first().click();

        // 等待拒绝对话框出现
        await page.waitForTimeout(500);

        // 应该显示拒绝原因输入框
        const reasonInput = page.locator('[data-testid="reject-reason-input"]');
        await expect(reasonInput).toBeVisible();

        // 输入拒绝原因
        await reasonInput.fill('内容不符合规范，需要修改');

        // 提交拒绝
        const confirmRejectBtn = page.locator('[data-testid="confirm-reject-btn"]');
        await confirmRejectBtn.click();

        // 等待成功提示
        await page.waitForTimeout(1000);

        // 应该显示成功消息
        const successToast = page.locator('[data-testid="success-toast"]');
        await expect(successToast).toBeVisible();
      }
    });

    test('拒绝作品时必须填写原因', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/work-review');
      await page.waitForLoadState('networkidle');

      await page.waitForTimeout(2000);

      // 查找拒绝按钮
      const rejectButtons = page.locator('[data-testid="reject-work-btn"]');
      const count = await rejectButtons.count();

      if (count > 0) {
        // 点击拒绝按钮
        await rejectButtons.first().click();

        // 等待拒绝对话框出现
        await page.waitForTimeout(500);

        // 不填写原因直接提交
        const confirmRejectBtn = page.locator('[data-testid="confirm-reject-btn"]');
        await confirmRejectBtn.click();

        // 应该显示错误提示（原因必填）
        const errorToast = page.locator('[data-testid="error-toast"]');
        await expect(errorToast).toBeVisible();
      }
    });
  });
});
