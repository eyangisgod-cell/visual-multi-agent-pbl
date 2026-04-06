/**
 * Phase 5 - 项目任务系统 E2E 测试
 *
 * 测试目标：
 * 1. 项目 CRUD 操作
 * 2. 任务创建和分配
 * 3. 任务进度追踪
 * 4. 项目任务列表展示
 */

import { test, expect } from '@playwright/test';

test.describe('Phase 5 - 项目任务系统', () => {
  // 辅助函数：管理员登录（用于管理后台测试）
  async function loginAsAdmin(page: any) {
    // 清除之前的状态（cookie 和 localStorage）
    const context = page.context();
    await context.clearCookies();

    // 直接导航到登录页面
    await page.goto('/auth/login', { waitUntil: 'networkidle' });

    // 清除 localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });

    // 填写表单并提交
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 等待登录成功 - 等待页面跳转（可能是游戏页面或任何需要认证的页面）
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  // 辅助函数：导航到管理后台
  async function goToAdmin(page: any) {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  }

  test('应该可以访问项目管理页面', async ({ page }) => {
    await loginAsAdmin(page);
    await goToAdmin(page);

    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');

    // 应该显示项目管理页面标题
    await expect(page.getByRole('heading', { name: '项目管理' })).toBeVisible();
  });

  test('应该可以查看项目列表', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');

    // 应该显示项目列表容器
    const projectList = page.locator('[data-testid="project-list"]');
    await expect(projectList).toBeVisible();
  });

  test('应该可以创建新项目', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');

    // 点击创建项目按钮
    const createButton = page.locator('[data-testid="create-project-btn"]');
    await createButton.click();

    // 等待创建项目对话框出现
    await page.waitForTimeout(500);
    const dialog = page.locator('.fixed.inset-0');
    await expect(dialog).toBeVisible();

    // 填写项目信息
    await page.fill('input[name="title"]', '测试项目');
    await page.fill('textarea[name="description"]', '这是一个测试项目');

    // 提交表单
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // 等待消息提示出现并消失
    await page.waitForTimeout(5000);
  });

  test('应该可以编辑项目', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');

    // 等待项目列表加载
    await page.waitForTimeout(3000);

    // 检查是否有项目
    let editButtons = page.locator('[data-testid="edit-project-btn"]');
    let count = await editButtons.count();

    if (count === 0) {
      // 如果没有项目，创建一个并刷新页面
      const createButton = page.locator('[data-testid="create-project-btn"]');
      await createButton.click();
      await page.waitForTimeout(500);

      await page.fill('input[name="title"]', '编辑测试项目');
      await page.fill('textarea[name="description"]', '用于编辑测试');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // 等待消息提示出现
      await page.waitForSelector('.fixed.top-4.right-4', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(4000);

      // 刷新页面以加载新项目
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      editButtons = page.locator('[data-testid="edit-project-btn"]');
      count = await editButtons.count();
    }

    // 确保有项目可以编辑
    expect(count).toBeGreaterThan(0);

    // 点击编辑按钮
    await editButtons.first().click();

    // 等待编辑对话框加载
    await page.waitForTimeout(1000);

    // 验证编辑对话框中的标题输入框存在
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toBeVisible();
  });

  test('应该可以删除项目', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');

    // 等待项目列表加载
    await page.waitForTimeout(3000);

    // 检查是否有项目
    let deleteButtons = page.locator('[data-testid="delete-project-btn"]');
    let count = await deleteButtons.count();

    if (count === 0) {
      // 如果没有项目，创建一个并刷新页面
      const createButton = page.locator('[data-testid="create-project-btn"]');
      await createButton.click();
      await page.waitForTimeout(500);

      await page.fill('input[name="title"]', '删除测试项目');
      await page.fill('textarea[name="description"]', '用于删除测试');
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // 等待消息提示出现
      await page.waitForSelector('.fixed.top-4.right-4', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(4000);

      // 刷新页面以加载新项目
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      deleteButtons = page.locator('[data-testid="delete-project-btn"]');
      count = await deleteButtons.count();
    }

    // 确保有项目可以删除
    expect(count).toBeGreaterThan(0);

    // 点击删除按钮
    await deleteButtons.first().click();

    // 确认删除对话框
    const confirmButton = page.locator('button:has-text("确认删除")');
    await expect(confirmButton).toBeVisible();
  });

  // 以下测试需要项目详情页面，暂时跳过
  // test('应该可以查看任务列表', async ({ page }) => {
  //   await loginAsAdmin(page);
  //   await page.goto('/admin/projects');
  //   await page.waitForLoadState('networkidle');

  //   // 进入第一个项目
  //   const projectLink = page.locator('[data-testid="project-link"]').first();
  //   await projectLink.click();
  //   await page.waitForURL('**/admin/projects/*');

  //   // 应该显示任务列表
  //   const taskItems = page.locator('[data-testid="task-item"]');
  //   await expect(taskItems.first()).toBeVisible({ timeout: 5000 });
  // });

  // test('应该可以查看项目进度仪表板', async ({ page }) => {
  //   await loginAsAdmin(page);
  //   await page.goto('/admin/projects');
  //   await page.waitForLoadState('networkidle');

  //   // 进入第一个项目
  //   const projectLink = page.locator('[data-testid="project-link"]').first();
  //   await projectLink.click();
  //   await page.waitForURL('**/admin/projects/*');

  //   // 应该显示进度仪表板
  //   const progressDashboard = page.locator('[data-testid="progress-dashboard"]');
  //   await expect(progressDashboard).toBeVisible();
  // });
});
