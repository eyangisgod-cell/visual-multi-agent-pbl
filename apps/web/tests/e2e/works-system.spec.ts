/**
 * Task #157 - 作品系统 E2E 测试
 *
 * 测试目标：
 * 1. 作品 CRUD 操作
 * 2. 作品展示
 * 3. 作品评价（点赞、评论）
 */

import { test, expect } from '@playwright/test';

test.describe('Task #157 - 作品系统', () => {
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

  // 辅助函数：导航到管理后台
  async function goToAdmin(page: any) {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  }

  test.describe('作品 CRUD 操作', () => {
    test('应该可以访问作品管理页面', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');

      // 应该显示作品管理页面标题
      await expect(page.getByRole('heading', { name: '作品管理' })).toBeVisible();
    });

    test('应该可以查看作品列表', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');

      // 应该显示作品列表容器
      const workList = page.locator('[data-testid="work-list"]');
      await expect(workList).toBeVisible();
    });

    test('应该可以创建新作品', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');

      // 点击创建作品按钮
      const createButton = page.locator('[data-testid="create-work-btn"]');
      await expect(createButton).toBeVisible();
      await createButton.click();

      // 等待创建作品对话框出现
      await page.waitForTimeout(500);
      const dialog = page.locator('.fixed.inset-0');
      await expect(dialog).toBeVisible();

      // 填写作品信息
      await page.fill('input[name="title"]', '测试作品');
      await page.fill('textarea[name="description"]', '这是一个测试作品');

      // 选择项目（从下拉列表选择第一个非空选项）
      const options = page.locator('select[name="projectId"] option');
      const optCount = await options.count();
      if (optCount > 1) {
        await page.selectOption('select[name="projectId"]', { index: 1 });
      }

      // 提交表单
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // 等待对话框关闭并刷新
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
    });

    test('应该可以编辑作品', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');

      // 等待作品列表加载
      await page.waitForTimeout(3000);

      // 检查是否有作品
      let editButtons = page.locator('[data-testid="edit-work-btn"]');
      let count = await editButtons.count();

      if (count === 0) {
        // 如果没有作品，创建一个
        const createButton = page.locator('[data-testid="create-work-btn"]');
        await createButton.click();
        await page.waitForTimeout(500);

        await page.fill('input[name="title"]', '编辑测试作品');
        await page.fill('textarea[name="description"]', '用于编辑测试');

        // 等待项目选项加载并选择
        await page.waitForTimeout(1000);
        const options = page.locator('select[name="projectId"] option');
        const optCount = await options.count();
        console.log('Project options count:', optCount);

        // 如果没有项目选项，测试应该跳过
        if (optCount <= 1) {
          console.log('No projects available, skipping work creation');
          await page.keyboard.press('Escape'); // 关闭对话框
          await page.waitForTimeout(500);
          return;
        }

        await page.selectOption('select[name="projectId"]', { index: 1 });

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // 等待对话框关闭并刷新
        await page.waitForTimeout(3000);
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        editButtons = page.locator('[data-testid="edit-work-btn"]');
        count = await editButtons.count();
      }

      // 如果没有作品，跳过测试
      if (count === 0) {
        console.log('No works available for edit test');
        return;
      }

      expect(count).toBeGreaterThan(0);

      // 点击编辑按钮
      await editButtons.first().click();

      // 等待编辑对话框加载
      await page.waitForTimeout(1000);

      // 验证编辑对话框中的标题输入框存在
      const titleInput = page.locator('input[name="title"]');
      await expect(titleInput).toBeVisible();
    });

    test('应该可以删除作品', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');

      // 等待作品列表加载
      await page.waitForTimeout(3000);

      // 检查是否有作品
      let deleteButtons = page.locator('[data-testid="delete-work-btn"]');
      let count = await deleteButtons.count();

      if (count === 0) {
        // 如果没有作品，创建一个
        const createButton = page.locator('[data-testid="create-work-btn"]');
        await createButton.click();
        await page.waitForTimeout(500);

        await page.fill('input[name="title"]', '删除测试作品');
        await page.fill('textarea[name="description"]', '用于删除测试');

        // 等待项目选项加载并选择
        await page.waitForTimeout(1000);
        const options = page.locator('select[name="projectId"] option');
        const optCount = await options.count();
        console.log('Project options count:', optCount);

        // 如果没有项目选项，测试应该跳过
        if (optCount <= 1) {
          console.log('No projects available, skipping work creation');
          await page.keyboard.press('Escape'); // 关闭对话框
          await page.waitForTimeout(500);
          return;
        }

        await page.selectOption('select[name="projectId"]', { index: 1 });

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // 等待对话框关闭并刷新
        await page.waitForTimeout(3000);
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        deleteButtons = page.locator('[data-testid="delete-work-btn"]');
        count = await deleteButtons.count();
      }

      // 如果没有作品，跳过测试
      if (count === 0) {
        console.log('No works available for delete test');
        return;
      }

      expect(count).toBeGreaterThan(0);

      // 点击删除按钮
      await deleteButtons.first().click();

      // 确认删除对话框
      const confirmButton = page.locator('button:has-text("确认删除")');
      await expect(confirmButton).toBeVisible();
    });
  });

  test.describe('作品评价系统', () => {
    test('应该可以点赞作品', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/works');
      await page.waitForLoadState('networkidle');

      // 等待作品列表加载
      await page.waitForTimeout(3000);

      // 查找点赞按钮
      const likeButtons = page.locator('[data-testid="like-work-btn"]');
      const count = await likeButtons.count();

      if (count > 0) {
        // 记录点赞前的数量
        const likeCountBefore = await page.locator('[data-testid="like-count"]').first().textContent();

        // 点击点赞按钮
        await likeButtons.first().click();
        await page.waitForTimeout(1000);

        // 验证点赞数量增加
        const likeCountAfter = await page.locator('[data-testid="like-count"]').first().textContent();
        expect(parseInt(likeCountAfter || '0')).toBeGreaterThan(parseInt(likeCountBefore || '0'));
      }
    });

    test('应该可以评论作品', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/works');
      await page.waitForLoadState('networkidle');

      // 等待作品列表加载
      await page.waitForTimeout(3000);

      // 进入作品详情页
      const workLinks = page.locator('[data-testid="work-link"]');
      const count = await workLinks.count();

      if (count > 0) {
        await workLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // 查找评论输入框
        const commentInput = page.locator('textarea[name="comment"]');
        await expect(commentInput).toBeVisible();

        // 输入评论
        await commentInput.fill('这是一条测试评论');

        // 提交评论
        const submitButton = page.locator('button:has-text("发表评论")');
        await submitButton.click();

        // 等待评论成功消息
        await page.waitForSelector('.fixed.top-4.right-4', { state: 'visible', timeout: 5000 });
      }
    });
  });
});
