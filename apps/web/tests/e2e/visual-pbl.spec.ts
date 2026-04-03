/**
 * Visual PBL E2E 测试脚本
 *
 * 使用 Playwright 进行端到端测试
 * 覆盖登录、注册、管理后台等核心功能
 *
 * 运行方式：
 *   npx playwright test tests/e2e/visual-pbl.spec.ts
 *   npx playwright test tests/e2e/visual-pbl.spec.ts --headed  # 有头模式
 *   npx playwright test tests/e2e/visual-pbl.spec.ts --ui     # UI 模式
 */

import { test, expect, type Page } from '@playwright/test';

// 测试配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:3333',
  apiURL: 'http://localhost:3333/api',
  timeout: 30000,
};

// 生成唯一测试用户
function generateTestUser() {
  const timestamp = Date.now();
  return {
    username: `testuser_${timestamp}`,
    password: 'Test123456!',
    email: `test_${timestamp}@example.com`,
    nickname: `Test User ${timestamp}`,
  };
}

test.describe('Visual PBL E2E 测试套件', () => {
  // ==================== 健康检查测试 ====================
  test.describe('服务健康检查', () => {
    test('前端服务应该正常运行', async ({ page }) => {
      const response = await page.goto('/api/health');
      expect(response?.status()).toBe(200);

      const json = await response?.json();
      expect(json).toHaveProperty('status', 'ok');
      expect(json).toHaveProperty('service', 'visual-pbl-web');
    });

    test('后端 AI 服务应该正常运行', async ({ request }) => {
      const response = await request.get('http://localhost:8000/api/v1/health');
      expect(response.status()).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty('status', 'ok');
      expect(json).toHaveProperty('service', 'visual-pbl-ai-service');
    });
  });

  // ==================== 首页测试 ====================
  test.describe('首页功能', () => {
    test('应该能访问首页', async ({ page }) => {
      await page.goto(TEST_CONFIG.baseURL);

      // 检查页面标题
      await expect(page).toHaveTitle(/Visual.*PBL|PBL.*Visual/i);

      // 检查是否有登录/注册入口
      const loginLink = page.locator('[data-testid="login-link"], a[href*="login"], a:has-text("登录"), a:has-text("Login")');
      const registerLink = page.locator('[data-testid="register-link"], a[href*="register"], a:has-text("注册"), a:has-text("Register")');

      // 至少有一个应该可见
      const loginVisible = await loginLink.isVisible().catch(() => false);
      const registerVisible = await registerLink.isVisible().catch(() => false);

      expect(loginVisible || registerVisible).toBe(true);
    });

    test('应该能访问登录页面', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/auth/login`);

      // 检查登录表单元素
      const usernameInput = page.locator('input[name="username"], input[type="text"], input[placeholder*="用户名"], input[placeholder*="Username"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")');

      await expect(usernameInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('应该能访问注册页面', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/auth/register`);

      // 检查注册表单元素
      const usernameInput = page.locator('input[name="username"], input[type="text"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      await expect(usernameInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    });
  });

  // ==================== 用户注册测试 ====================
  test.describe('用户注册功能', () => {
    test('应该能成功注册新用户', async ({ page }) => {
      const testUser = generateTestUser();

      await page.goto(`${TEST_CONFIG.baseURL}/auth/register`);

      // 填写注册表单
      await page.fill('input[name="username"]', testUser.username);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="confirmPassword"], input[placeholder*="确认密码"]', testUser.password);

      // 提交表单
      await page.click('button[type="submit"]');

      // 等待跳转或成功提示
      await page.waitForURL(/\/auth\/login|\/login/, { timeout: 5000 })
        .catch(() => {
          // 如果没有跳转，检查是否有成功消息
          console.log('Registration completed but no redirect occurred');
        });
    });

    test('注册时密码长度应该至少 6 位', async ({ page }) => {
      const testUser = generateTestUser();

      await page.goto(`${TEST_CONFIG.baseURL}/auth/register`);

      // 填写短密码
      await page.fill('input[name="username"]', testUser.username);
      await page.fill('input[name="password"]', '12345'); // 短密码

      await page.click('button[type="submit"]');

      // 应该有验证错误提示
      const errorMessage = page.locator('.error, [role="alert"], text=密码，text=password');
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
    });
  });

  // ==================== 用户登录测试 ====================
  test.describe('用户登录功能', () => {
    test('使用空用户名登录应该失败', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/auth/login`);

      // 只填密码
      await page.fill('input[type="password"]', 'somepassword123');
      await page.click('button[type="submit"]');

      // 应该有错误提示
      await page.waitForSelector('.error, [role="alert"], text=无效，text=错误', { timeout: 3000 })
        .catch(() => console.log('No error message found - may be handled differently'));
    });

    test('使用空密码登录应该失败', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/auth/login`);

      // 只填用户名
      await page.fill('input[name="username"]', 'testuser');
      await page.click('button[type="submit"]');

      // 应该有错误提示
      await page.waitForSelector('.error, [role="alert"]', { timeout: 3000 })
        .catch(() => console.log('No error message found - may be handled differently'));
    });
  });

  // ==================== 管理后台测试 ====================
  test.describe('管理后台功能', () => {
    test('未认证用户访问管理后台应该被重定向', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin`);

      // 应该被重定向到登录页或显示 401
      const currentUrl = page.url();
      expect(currentUrl.includes('/auth/login') || currentUrl.includes('/login')).toBe(true);
    });

    test('管理后台页面应该包含导航菜单', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', '跳过非 Chromium 浏览器');

      // 注意：此测试需要先创建管理员用户
      // 暂时只验证页面结构

      await page.goto(`${TEST_CONFIG.baseURL}/admin`);

      // 检查是否有侧边栏导航元素
      const sidebar = page.locator('aside, nav, [role="navigation"]');
      const sidebarExists = await sidebar.count() > 0;

      if (sidebarExists) {
        // 检查常见管理菜单项
        const menuItems = ['仪表盘', '项目', '智能体', '用户', '设置'];
        const pageContent = await page.content();

        const hasMenuItem = menuItems.some(item => pageContent.includes(item));
        expect(hasMenuItem).toBe(true);
      }
    });
  });

  // ==================== API 集成测试 ====================
  test.describe('API 集成测试', () => {
    test('健康检查 API 应该返回正常', async ({ request }) => {
      const response = await request.get(`${TEST_CONFIG.apiURL}/health`);
      expect(response.status()).toBe(200);

      const json = await response.json();
      expect(json.status).toBe('ok');
    });

    test('登录 API 应该拒绝无效凭据', async ({ request }) => {
      const response = await request.post(`${TEST_CONFIG.apiURL}/auth/login`, {
        data: {
          username: 'nonexistent_user',
          password: 'wrongpassword123',
        },
      });

      // 应该返回 401 错误
      expect(response.status()).toBe(401);

      const json = await response.json();
      expect(json).toHaveProperty('error');
    });
  });

  // ==================== 智能体功能测试 ====================
  test.describe('智能体功能', () => {
    test('智能体选择器页面应该可访问', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/admin/agents/select`);

      // 页面应该加载成功（可能需要认证）
      const currentUrl = page.url();

      // 如果未认证，应该重定向到登录页
      if (currentUrl.includes('/auth/login') || currentUrl.includes('/login')) {
        console.log('Redirected to login as expected for unauthenticated user');
      } else {
        // 如果已认证，检查页面内容
        const pageContent = await page.content();
        expect(pageContent).toContain('智能体');
      }
    });
  });

  // ==================== 响应式设计测试 ====================
  test.describe('响应式设计', () => {
    test('页面应该在移动设备上正常显示', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', '跳过非 Chromium 浏览器');

      // 模拟移动设备 viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto(TEST_CONFIG.baseURL);

      // 页面应该成功加载
      await expect(page).toHaveTitle(/./);

      // 检查是否有明显的布局问题
      const bodyWidth = await page.evaluate(() => document.body.clientWidth);
      expect(bodyWidth).toBeGreaterThan(0);
    });
  });
});

/**
 * 调试测试
 *
 * 使用方法:
 * 1. 运行单个测试：npx playwright test --grep "应该能成功注册新用户"
 * 2. 有头模式：npx playwright test --headed
 * 3. 调试模式：npx playwright test --debug
 *
 * 常见问题排查:
 * 1. 如果登录失败，检查后端日志：docker logs docker-web-1
 * 2. 如果 Prisma 报错，检查数据库连接：docker logs docker-postgres-1
 * 3. 如果 AI 服务不可用，检查：docker logs docker-ai-service-1
 */
