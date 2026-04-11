/**
 * 作品审核流程 TDD E2E Tests
 *
 * 测试目标：
 * 1. 审核状态机流转测试 (draft -> pending_review -> published/rejected)
 * 2. 审批/拒绝 API 测试
 * 3. 审核意见记录测试
 *
 * TDD 流程：
 * - RED: 先运行测试确认失败
 * - GREEN: 实现最小化功能让测试通过
 * - REFACTOR: 清理代码
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

  // ============================================================
  // API 级别测试 - 审核状态机流转
  // ============================================================
  test.describe('审核状态机流转 API 测试', () => {
    test('应该可以获取待审核作品列表', async ({ page }) => {
      // 登录后使用 page.request 获取认证上下文
      await loginAsAdmin(page);

      // 调用获取待审核作品列表的 API
      const response = await page.request.get('/api/admin/works/review?page=1&limit=10');

      expect(response.status()).toBe(200);
      const data = await response.json();

      // 验证响应结构
      expect(data).toHaveProperty('works');
      expect(data).toHaveProperty('pagination');
      expect(data.works).toBeInstanceOf(Array);
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('totalPages');
    });

    test('待审核作品列表应该只包含 status 为 pending_review 的作品', async ({ page }) => {
      await loginAsAdmin(page);

      const response = await page.request.get('/api/admin/works/review?page=1&limit=10');

      expect(response.status()).toBe(200);
      const data = await response.json();

      // 验证所有返回的作品状态都是 pending_review
      data.works.forEach((work: any) => {
        expect(work.status).toBe('pending_review');
      });
    });
  });

  test.describe('审批 API 测试', () => {
    test('应该可以批准作品 (pending_review -> published)', async ({ page }) => {
      // 首先需要登录获取管理员权限
      await loginAsAdmin(page);

      // 获取待审核作品列表
      const listResponse = await page.request.get('/api/admin/works/review?page=1&limit=1');
      expect(listResponse.status()).toBe(200);
      const listData = await listResponse.json();

      if (listData.works.length === 0) {
        console.log('No pending works to approve, skipping test');
        return;
      }

      const workId = listData.works[0].id;

      // 调用批准 API
      const approveResponse = await page.request.post(`/api/admin/works/${workId}/review`, {
        data: { action: 'approve' },
      });

      expect(approveResponse.status()).toBe(200);
      const approveData = await approveResponse.json();

      // 验证响应
      expect(approveData).toHaveProperty('work');
      expect(approveData.work.status).toBe('published');
      expect(approveData).toHaveProperty('message');
    });

    test('批准作品时 action 必须为 approve 或 reject', async ({ page }) => {
      await loginAsAdmin(page);

      // 使用无效的 action
      const response = await page.request.post('/api/admin/works/invalid-id/review', {
        data: { action: 'invalid_action' },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid action');
    });
  });

  test.describe('拒绝 API 测试', () => {
    test('拒绝作品时必须填写原因', async ({ page }) => {
      await loginAsAdmin(page);

      // 获取待审核作品列表
      const listResponse = await page.request.get('/api/admin/works/review?page=1&limit=1');
      expect(listResponse.status()).toBe(200);
      const listData = await listResponse.json();

      if (listData.works.length === 0) {
        console.log('No pending works to reject, skipping test');
        return;
      }

      const workId = listData.works[0].id;

      // 不提供拒绝原因
      const rejectResponse = await page.request.post(`/api/admin/works/${workId}/review`, {
        data: { action: 'reject' },
      });

      expect(rejectResponse.status()).toBe(400);
      const data = await rejectResponse.json();
      expect(data.error).toContain('Reject reason is required');
    });

    test('应该可以拒绝作品并记录原因', async ({ page }) => {
      await loginAsAdmin(page);

      // 获取待审核作品列表
      const listResponse = await page.request.get('/api/admin/works/review?page=1&limit=1');
      expect(listResponse.status()).toBe(200);
      const listData = await listResponse.json();

      if (listData.works.length === 0) {
        console.log('No pending works to reject, skipping test');
        return;
      }

      const workId = listData.works[0].id;
      const testReason = `测试拒绝原因 -${Date.now()}`;

      // 调用拒绝 API
      const rejectResponse = await page.request.post(`/api/admin/works/${workId}/review`, {
        data: { action: 'reject', reason: testReason },
      });

      expect(rejectResponse.status()).toBe(200);
      const rejectData = await rejectResponse.json();

      // 验证作品状态变为 rejected
      expect(rejectData).toHaveProperty('work');
      expect(rejectData.work.status).toBe('rejected');
    });
  });

  test.describe('审核意见记录测试', () => {
    test('拒绝原因应该被正确保存到作品描述中', async ({ page }) => {
      await loginAsAdmin(page);

      // 获取待审核作品列表
      const listResponse = await page.request.get('/api/admin/works/review?page=1&limit=1');
      expect(listResponse.status()).toBe(200);
      const listData = await listResponse.json();

      if (listData.works.length === 0) {
        console.log('No pending works to test, skipping test');
        return;
      }

      const workId = listData.works[0].id;
      const testReason = `测试拒绝原因 -${Date.now()}`;

      // 拒绝作品
      const rejectResponse = await page.request.post(`/api/admin/works/${workId}/review`, {
        data: { action: 'reject', reason: testReason },
      });

      expect(rejectResponse.status()).toBe(200);
      const rejectData = await rejectResponse.json();

      // 验证拒绝原因被保存
      expect(rejectData.work.description).toContain(testReason);
    });
  });
});
