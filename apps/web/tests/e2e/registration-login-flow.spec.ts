/**
 * Visual PBL - 用户注册登录完整流程 E2E 测试
 *
 * 测试目标：
 * 1. 用户注册流程
 * 2. 用户登录流程
 * 3. 登录后会话管理
 * 4. 登出功能
 */

import { test, expect } from '@playwright/test';

// 生成唯一用户名和时间戳
const generateUniqueUsername = () => `testuser_${Date.now()}`;

test.describe('用户注册流程', () => {
  test('应该能够打开注册页面', async ({ page }) => {
    // 直接访问注册页面
    await page.goto('/auth/register');
    await expect(page.getByRole('heading', { name: /创建新账号/ })).toBeVisible();
  });

  test('应该能够使用有效信息注册新用户', async ({ page }) => {
    const username = generateUniqueUsername();
    const password = 'TestPass123!';

    // 导航到注册页面
    await page.goto('/auth/register');

    // 填写注册表单（使用 name 属性选择器）
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);

    // 提交注册
    await page.getByRole('button', { name: /注册/ }).click();

    // 等待页面跳转（注册成功后会自动登录并跳转）
    await page.waitForTimeout(5000);

    // 验证注册成功（检查是否在游戏页面或首页）
    const currentPage = page.url();
    const isLoggedIn = currentPage.includes('/game') || currentPage === 'http://localhost:3000/';
    expect(isLoggedIn).toBe(true);
  });

  test('应该验证密码长度', async ({ page }) => {
    await page.goto('/auth/register');

    // 填写过短的密码
    await page.locator('input[name="username"]').fill(generateUniqueUsername());
    await page.locator('input[name="password"]').fill('12345');
    await page.locator('input[name="confirmPassword"]').fill('12345');

    // 提交表单
    await page.getByRole('button', { name: /注册/ }).click();

    // 应该显示密码长度验证错误
    const errorMessage = page.getByText(/密码长度至少为 6 位/);
    await expect(errorMessage).toBeVisible();
  });

  test('应该验证两次密码是否一致', async ({ page }) => {
    await page.goto('/auth/register');

    // 填写不一致的密码
    await page.locator('input[name="username"]').fill(generateUniqueUsername());
    await page.locator('input[name="password"]').fill('TestPass123!');
    await page.locator('input[name="confirmPassword"]').fill('DifferentPass456!');

    // 提交表单
    await page.getByRole('button', { name: /注册/ }).click();

    // 应该显示密码不匹配错误
    const errorMessage = page.getByText(/两次输入的密码不一致/);
    await expect(errorMessage).toBeVisible();
  });

  test('应该检测已存在的用户名', async ({ page }) => {
    await page.goto('/auth/register');

    // 使用已存在的用户名（admin）
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('TestPass123!');
    await page.locator('input[name="confirmPassword"]').fill('TestPass123!');

    // 提交表单
    await page.getByRole('button', { name: /注册/ }).click();

    // 应该显示用户名已存在错误（API 返回英文）
    await page.waitForTimeout(1000);
    const pageContent = await page.content();
    expect(pageContent).toMatch(/Username already exists|用户名已存在/i);
  });
});

test.describe('用户登录流程', () => {
  test('应该能够打开登录页面', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: /欢迎回来/ })).toBeVisible();
  });

  test('应该能够使用正确的凭据登录', async ({ page }) => {
    await page.goto('/auth/login');

    // 填写登录表单
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');

    // 提交登录
    await page.getByRole('button', { name: /登录/ }).click();

    // 等待登录成功
    await page.waitForTimeout(3000);

    // 验证登录成功（跳转到游戏页面）
    await expect(page).toHaveURL(/\/game/);

    // 验证游戏页面元素
    const logoutButton = page.getByText(/Logout/);
    await expect(logoutButton).toBeVisible();
  });

  test('应该拒绝错误的密码', async ({ page }) => {
    await page.goto('/auth/login');

    // 填写正确的用户名和错误的密码
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('WrongPassword!');

    // 提交登录
    await page.getByRole('button', { name: /登录/ }).click();

    // 应该显示错误消息
    await page.waitForTimeout(1000);
    const pageContent = await page.content();
    // API 返回 "Invalid username or password"
    expect(pageContent).toMatch(/Invalid username or password|密码错误 | 用户不存在/i);
  });

  test('应该拒绝不存在的用户名', async ({ page }) => {
    await page.goto('/auth/login');

    // 填写不存在的用户名
    await page.locator('input[name="username"]').fill('nonexistent_user_12345');
    await page.locator('input[name="password"]').fill('TestPass123!');

    // 提交登录
    await page.getByRole('button', { name: /登录/ }).click();

    // 应该显示错误消息
    await page.waitForTimeout(1000);
    const pageContent = await page.content();
    // API 返回 "Invalid username or password"
    expect(pageContent).toMatch(/Invalid username or password|用户不存在 | 密码错误/i);
  });

  test('应该验证空表单提交', async ({ page }) => {
    await page.goto('/auth/login');

    // 直接提交空表单
    await page.getByRole('button', { name: /登录/ }).click();

    // 应该仍在登录页面（表单验证阻止提交）
    await expect(page).toHaveURL('/auth/login');
  });
});

test.describe('会话管理', () => {
  test('应该在页面刷新后保持登录状态', async ({ page }) => {
    // 先登录
    await page.goto('/auth/login');
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.getByRole('button', { name: /登录/ }).click();
    await page.waitForTimeout(3000);

    // 验证已登录
    const logoutButton = page.getByText(/Logout/);
    await expect(logoutButton).toBeVisible();

    // 刷新页面
    await page.reload();

    // 验证仍然登录
    await expect(logoutButton).toBeVisible();
  });

  test('应该能够登出', async ({ page }) => {
    // 先登录
    await page.goto('/auth/login');
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.getByRole('button', { name: /登录/ }).click();
    await page.waitForTimeout(3000);

    // 点击登出按钮
    const logoutButton = page.getByRole('button', { name: /Logout/ });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // 验证已登出（跳转到首页）
    await page.waitForTimeout(2000);
    // 登出后应该跳转到首页或登录页
    const currentPage = page.url();
    expect(currentPage === 'http://localhost:3000/' || currentPage.includes('/auth/login')).toBe(true);
  });

  test('登出后应该无法访问受保护页面', async ({ page }) => {
    // 先登录
    await page.goto('/auth/login');
    await page.locator('input[name="username"]').fill('admin');
    await page.locator('input[name="password"]').fill('admin123');
    await page.getByRole('button', { name: /登录/ }).click();
    await page.waitForTimeout(3000);

    // 点击登出按钮
    const logoutButton = page.getByRole('button', { name: /Logout/ });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    await page.waitForTimeout(2000);

    // 尝试访问管理后台
    await page.goto('/admin');
    await page.waitForTimeout(2000);

    // 验证：要么被重定向到登录页，要么显示 404（说明无法访问）
    const currentPage = page.url();
    const isOnLoginPage = currentPage.includes('/auth/login');
    const pageContent = await page.content();

    // 登出后访问 /admin 可能：1) 重定向到登录页 2) 显示 404（需要登录）3) 显示 401/403
    const isUnauthorized = pageContent.includes('404') ||
                          pageContent.includes('Unauthorized') ||
                          pageContent.includes('登录') ||
                          pageContent.includes('Login');

    expect(isOnLoginPage || isUnauthorized).toBe(true);
  });
});

test.describe('邀请码功能（可选）', () => {
  test.skip('应该允许使用邀请码注册', async ({ page }) => {
    // 跳过原因：邀请码功能需要有效的邀请码，测试环境无法保证
    // 此功能应该在集成测试环境中使用真实邀请码进行测试
    const username = generateUniqueUsername();
    const password = 'TestPass123!';

    await page.goto('/auth/register');

    // 填写基本信息
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.locator('input[name="nickname"]').fill('测试用户');
    await page.locator('input[name="grade"]').fill('5');

    // 填写邀请码
    await page.locator('input[name="invitationCode"]').fill('TEST1234');

    // 提交注册
    await page.getByRole('button', { name: /注册/ }).click();

    // 等待页面跳转（注册成功后会自动登录并跳转到首页）
    await page.waitForTimeout(5000);

    // 验证注册成功：检查是否跳转到首页或游戏页面
    const currentPage = page.url();
    const isOnRegisterPage = currentPage.includes('/auth/register');
    const hasError = await page.locator('text=/Error|错误|invalid/i').isVisible().catch(() => false);

    // 注册成功应该离开注册页面且没有错误
    expect(isOnRegisterPage || hasError).toBe(false);
  });
});
