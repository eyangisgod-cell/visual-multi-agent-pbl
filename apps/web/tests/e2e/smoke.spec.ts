/**
 * Phase 6 - MVP 冒烟测试 (Smoke Tests)
 *
 * 测试范围：
 * 1. 用户登录流程
 * 2. 智能体对话流程
 * 3. 项目任务完成流程
 * 4. 作品提交审核流程
 *
 * 这些测试验证核心用户流程是否正常工作
 */

import { test, expect } from '@playwright/test';

test.describe('Phase 6: MVP 冒烟测试', () => {
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

  test.describe('1. 用户登录流程', () => {
    test('应该可以访问登录页面', async ({ page }) => {
      await page.goto('/auth/login');
      await expect(page).toHaveTitle(/登录|Login/);
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('应该可以成功登录', async ({ page }) => {
      await loginAsAdmin(page);

      // 验证登录成功 - 应该能看到用户菜单或重定向到首页
      const userMenu = page.locator('[data-testid="user-menu"]');
      await expect(userMenu).toBeVisible({ timeout: 5000 });
    });

    test('应该可以退出登录', async ({ page }) => {
      await loginAsAdmin(page);

      // 点击用户菜单
      const userMenu = page.locator('[data-testid="user-menu"]');
      await userMenu.click();

      // 点击退出按钮
      const logoutButton = page.locator('[data-testid="logout-button"]');
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();

      // 验证已退出 - 应该看到登录链接
      await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
    });

    test('登录失败应该显示错误消息', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // 验证显示错误消息
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
    });
  });

  test.describe('2. 智能体对话流程', () => {
    test('应该可以访问智能体选择页面', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/agents/select');
      await page.waitForLoadState('networkidle');

      // 验证页面标题
      await expect(page.getByRole('heading', { name: /智能体|Agent/ })).toBeVisible();

      // 验证有智能体选项
      const agentOptions = page.locator('[data-testid="agent-option"]');
      await expect(agentOptions.first()).toBeVisible({ timeout: 5000 });
    });

    test('应该可以访问智能体配置页面', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/agents/configurator');
      await page.waitForLoadState('networkidle');

      // 验证页面标题
      await expect(page.getByRole('heading', { name: /配置|Config/ })).toBeVisible();

      // 验证配置表单存在
      const configForm = page.locator('[data-testid="agent-config-form"]');
      await expect(configForm).toBeVisible();
    });

    test('应该可以获取智能体预设列表', async ({ request }) => {
      const response = await request.get('/api/admin/agents/presets');

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('presets');
      expect(Array.isArray(body.presets)).toBe(true);
      expect(body.presets.length).toBeGreaterThanOrEqual(1);
    });

    test('应该可以保存智能体形象配置', async ({ request }) => {
      const avatarConfig = {
        bodyType: 'average',
        bodyColor: '#4f46e5',
        headShape: 'oval',
        hairstyle: 'short',
        hairColor: '#4b5563',
        eyes: 'almond',
        eyeColor: '#1e40af',
        mouth: 'smile',
        outfit: 'academic',
        outfitColor: '#6366f1',
      };

      const response = await request.post('/api/admin/agents/avatar', {
        data: avatarConfig,
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  test.describe('3. 项目任务完成流程', () => {
    test('应该可以访问项目管理页面', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');

      // 验证页面标题
      await expect(page.getByRole('heading', { name: /项目|Project/ })).toBeVisible();

      // 验证项目列表存在
      const projectList = page.locator('[data-testid="project-list"]');
      await expect(projectList).toBeVisible();
    });

    test('应该可以创建新项目', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');

      // 点击创建项目按钮
      const createButton = page.locator('[data-testid="create-project-btn"]');
      await expect(createButton).toBeVisible();
      await createButton.click();

      // 等待创建项目对话框出现
      await page.waitForTimeout(500);
      const dialog = page.locator('.fixed.inset-0');
      await expect(dialog).toBeVisible();

      // 填写项目信息
      await page.fill('input[name="title"]', '冒烟测试项目');
      await page.fill('textarea[name="description"]', '这是一个用于冒烟测试的项目');

      // 选择状态
      await page.selectOption('select[name="status"]', 'active');

      // 提交表单
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // 等待对话框关闭并刷新
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
    });

    test('应该可以查看项目任务列表', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');

      // 等待项目列表加载
      await page.waitForTimeout(2000);

      // 点击第一个项目查看详情
      const projectItems = page.locator('[data-testid="project-item"]');
      const count = await projectItems.count();

      if (count > 0) {
        await projectItems.first().click();
        await page.waitForLoadState('networkidle');

        // 验证任务列表存在
        const taskList = page.locator('[data-testid="task-list"]');
        await expect(taskList).toBeVisible();
      }
    });

    test('应该可以完成任务', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/projects');
      await page.waitForLoadState('networkidle');

      // 等待项目列表加载
      await page.waitForTimeout(2000);

      // 点击第一个项目
      const projectItems = page.locator('[data-testid="project-item"]');
      const count = await projectItems.count();

      if (count > 0) {
        await projectItems.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 查找任务完成按钮
        const completeButtons = page.locator('[data-testid="complete-task-btn"]');
        const completeCount = await completeButtons.count();

        if (completeCount > 0) {
          await completeButtons.first().click();
          await page.waitForTimeout(1000);

          // 验证任务状态改变
          const successMessage = page.locator('[data-testid="success-message"]');
          await expect(successMessage).toBeVisible();
        }
      }
    });
  });

  test.describe('4. 作品提交审核流程', () => {
    test('应该可以访问作品管理页面', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');

      // 验证页面标题
      await expect(page.getByRole('heading', { name: /作品|Work/ })).toBeVisible();

      // 验证作品列表存在
      const workList = page.locator('[data-testid="work-list"]');
      await expect(workList).toBeVisible();
    });

    test('应该可以提交新作品', async ({ page }) => {
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
      await page.fill('input[name="title"]', '冒烟测试作品');
      await page.fill('textarea[name="description"]', '这是一个用于冒烟测试的作品');

      // 提交表单
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // 等待对话框关闭并刷新
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
    });

    test('应该可以审核作品', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin/works');
      await page.waitForLoadState('networkidle');

      // 等待作品列表加载
      await page.waitForTimeout(2000);

      // 查找审核按钮
      const reviewButtons = page.locator('[data-testid="review-work-btn"]');
      const count = await reviewButtons.count();

      if (count > 0) {
        await reviewButtons.first().click();
        await page.waitForTimeout(1000);

        // 验证审核对话框出现
        const reviewDialog = page.locator('.fixed.inset-0');
        await expect(reviewDialog).toBeVisible();
      }
    });

    test('应该可以点赞作品', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/works');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 查找点赞按钮
      const likeButtons = page.locator('[data-testid="like-work-btn"]');
      const count = await likeButtons.count();

      if (count > 0) {
        const likeCountBefore = await page.locator('[data-testid="like-count"]').first().textContent();
        await likeButtons.first().click();
        await page.waitForTimeout(1000);

        // 验证点赞成功（要么数量增加，要么有成功提示）
        const likeCountAfter = await page.locator('[data-testid="like-count"]').first().textContent();
        const successMessage = page.locator('[data-testid="success-message"]');

        const likeIncreased = parseInt(likeCountAfter || '0') > parseInt(likeCountBefore || '0');
        const hasSuccessMessage = await successMessage.isVisible().catch(() => false);

        expect(likeIncreased || hasSuccessMessage).toBe(true);
      }
    });

    test('应该可以评论作品', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/works');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 查找作品链接
      const workLinks = page.locator('[data-testid="work-link"]');
      const count = await workLinks.count();

      if (count > 0) {
        await workLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 查找评论输入框
        const commentInput = page.locator('textarea[name="comment"]');
        await expect(commentInput).toBeVisible();

        // 输入评论
        await commentInput.fill('冒烟测试评论');

        // 提交评论
        const submitButton = page.locator('button:has-text("发表")');
        await submitButton.click();

        // 等待成功消息
        await page.waitForSelector('.fixed.top-4.right-4', { state: 'visible', timeout: 5000 });
      }
    });
  });

  test.describe('5. 核心页面可访问性', () => {
    test('首页应该可以访问', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL('/');
      await expect(page.locator('body')).toBeVisible();
    });

    test('管理后台首页应该可以访问', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/admin');
      await expect(page.locator('aside')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
    });

    test('游戏页面应该可以访问', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/game');
      await page.waitForLoadState('networkidle');

      // 验证游戏容器存在
      const gameContainer = page.locator('#game-container');
      await expect(gameContainer).toBeVisible({ timeout: 10000 });
    });

    test('作品列表页面应该可以访问', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/works');
      await expect(page.locator('body')).toBeVisible();
    });

    test('项目列表页面应该可以访问', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/projects');
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('6. API 健康检查', () => {
    test('健康检查 API 应该返回正常', async ({ request }) => {
      const response = await request.get('/api/health');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.status).toBe('ok');
    });

    test('登录 API 应该工作', async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: { username: 'admin', password: 'admin123' }
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('token');
      expect(body).toHaveProperty('user');
    });
  });
});
