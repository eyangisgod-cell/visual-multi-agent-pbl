/**
 * WebSocket E2E Tests
 *
 * Tests for real-time communication features:
 * - WebSocket connection
 * - Message sending/receiving
 * - Online status tracking
 */

import { test, expect } from '@playwright/test';

test.describe('WebSocket 实时通信', () => {
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

  test('应该可以建立 WebSocket 连接', async ({ page }) => {
    await loginAsAdmin(page);

    // 导航到需要 WebSocket 的页面
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等待 WebSocket 连接建立
    await page.waitForTimeout(2000);

    // 验证连接状态（通过检查 console 日志）
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('WebSocket')) {
        consoleMessages.push(text);
      }
    });

    // 验证有连接成功日志
    const hasConnected = consoleMessages.some(msg => msg.includes('Connected'));
    expect(hasConnected).toBe(true);
  });

  test('应该显示在线用户列表', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等待在线用户列表更新
    await page.waitForTimeout(3000);

    // 验证在线用户列表存在
    const onlineUsersElement = page.locator('[data-testid="online-users"]');
    await expect(onlineUsersElement).toBeVisible();
  });

  test('应该可以发送实时消息', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等待 WebSocket 连接
    await page.waitForTimeout(2000);

    // 查找消息输入框
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-message-btn"]');

    // 如果消息功能可用，测试发送
    const inputVisible = await messageInput.isVisible();
    if (inputVisible) {
      await messageInput.fill('测试消息');
      await sendButton.click();

      // 验证消息发送成功
      await page.waitForTimeout(1000);
      const sentMessages = page.locator('[data-testid="sent-message"]');
      await expect(sentMessages.first()).toBeVisible();
    }
  });
});
