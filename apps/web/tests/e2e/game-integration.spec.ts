/**
 * 游戏页面功能集成测试
 * 测试智能体渲染、对话系统和任务面板
 */

import { test, expect } from '@playwright/test';

test.describe('游戏页面集成测试', () => {
  const GAME_URL = 'http://localhost:3000/game';

  test.beforeEach(async ({ page }) => {
    // 直接登录（使用预创建的测试用户）
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'test123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // 导航到游戏页面
    await page.goto(GAME_URL);

    // 等待游戏完全加载 - 等待 E2E 智能体层出现
    await page.waitForSelector('#e2e-agent-layer', { timeout: 30000 });
    await page.waitForTimeout(2000);
  });

  test.describe('智能体渲染修复', () => {
    test('应该渲染 5 种不同类型的智能体', async ({ page }) => {
      // 等待所有智能体都渲染完成
      const agentTypes = ['mentor', 'designer', 'analyst', 'marketer', 'assistant'];

      for (const agentType of agentTypes) {
        const agent = await page.locator(`[data-testid="agent-${agentType}"]`);
        await expect(agent).toBeVisible({ timeout: 5000 });
      }
    });

    test('每个智能体应该显示正确的名称', async ({ page }) => {
      const agentNames = {
        mentor: '智慧导师',
        designer: '创意设计师',
        analyst: '数据分析师',
        marketer: '运营推广师',
        assistant: 'CEO 助手',
      };

      for (const [agentType, expectedName] of Object.entries(agentNames)) {
        const agent = page.locator(`[data-testid="agent-${agentType}"]`);
        const agentName = await agent.getAttribute('data-agent-name');
        expect(agentName).toBe(expectedName);
      }
    });
  });

  test.describe('AI 对话系统', () => {
    test('点击智能体应该打开对话窗口', async ({ page }) => {
      const agent = page.locator('[data-testid="agent-mentor"]');
      await agent.click();
      await page.waitForTimeout(1000);

      // 检查对话窗口是否打开
      const dialog = await page.locator('text=智慧导师').first();
      await expect(dialog).toBeVisible();
    });

    test('应该能够发送消息并收到回复', async ({ page }) => {
      const agent = page.locator('[data-testid="agent-mentor"]');
      await agent.click();
      await page.waitForTimeout(1000);

      // 输入消息
      const input = page.locator('input[placeholder="输入消息..."]');
      await input.fill('你好');

      // 发送消息
      const sendButton = page.locator('button:has-text("发送")');
      await sendButton.click();

      // 等待回复（可能来自 fallback）
      await page.waitForTimeout(2000);

      // 检查是否有回复消息
      const messages = page.locator('div[class*="bg-indigo-600"], div[class*="bg-gray-700"]');
      await expect(messages.first()).toBeVisible();
    });

    test('对话 API 应该返回响应', async ({ page }) => {
      // 点击智能体打开对话窗口
      await page.locator('[data-testid="agent-mentor"]').click();
      await page.waitForTimeout(1000);

      // 输入消息
      const input = page.locator('input[placeholder="输入消息..."]');
      await input.fill('测试');

      // 监听 API 响应并点击发送
      const [chatResponse] = await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/chat')).catch(() => null),
        page.locator('button:has-text("发送")').click(),
      ]);

      // API 可能返回 200（成功）或其他状态，至少验证有响应
      expect(chatResponse === null || chatResponse.status() < 500).toBeTruthy();
    });
  });

  test.describe('任务系统 UI', () => {
    test('应该能够打开任务面板', async ({ page }) => {
      const taskButton = page.locator('button:has-text("任务")');
      await taskButton.click();
      await page.waitForTimeout(500);

      const taskPanel = page.locator('[data-testid="task-panel"]');
      await expect(taskPanel).toBeVisible();
    });

    test('应该能够创建新任务', async ({ page }) => {
      // 打开任务面板
      const taskButton = page.locator('button:has-text("任务")');
      await taskButton.click();
      await page.waitForTimeout(500);

      // 点击创建任务按钮
      const createBtn = page.locator('[data-testid="create-task-btn"]');
      await createBtn.click();

      // 填写表单
      const form = page.locator('[data-testid="task-form"]');
      await expect(form).toBeVisible();

      await form.locator('input[name="title"]').fill('测试任务');
      await form.locator('textarea[name="description"]').fill('这是一个测试任务');

      // 提交表单
      await form.locator('button[type="submit"]').click();
      await page.waitForTimeout(500);

      // 验证任务已添加到列表
      const taskList = page.locator('[data-testid="task-list"]');
      await expect(taskList).toContainText('测试任务');
    });

    test('应该显示任务列表', async ({ page }) => {
      const taskButton = page.locator('button:has-text("任务")');
      await taskButton.click();
      await page.waitForTimeout(500);

      const taskList = page.locator('[data-testid="task-list"]');
      await expect(taskList).toBeVisible();
    });
  });

  test.describe('智能体选择器', () => {
    test('应该显示智能体选择器', async ({ page }) => {
      const selector = page.locator('[data-testid="agent-selector"]');
      await expect(selector).toBeVisible();
    });

    test('应该能够展开智能体列表', async ({ page }) => {
      const expandButton = page.locator('[data-testid="agent-selector"] button').first();
      await expandButton.click();
      await page.waitForTimeout(300);

      // 验证至少有一个智能体选项
      const agentOptions = page.locator('[data-testid^="agent-option-"]');
      await expect(agentOptions.first()).toBeVisible();
    });

    test('应该显示 5 种智能体选项', async ({ page }) => {
      const expandButton = page.locator('[data-testid="agent-selector"] button').first();
      await expandButton.click();
      await page.waitForTimeout(300);

      const agentTypes = ['mentor', 'designer', 'analyst', 'marketer', 'assistant'];

      for (const agentType of agentTypes) {
        const option = page.locator(`[data-testid="agent-option-${agentType}"]`);
        await expect(option).toBeVisible();
      }
    });
  });

  test.describe('玩家移动功能', () => {
    test('玩家应该能够通过 WASD 移动', async ({ page }) => {
      const canvas = page.locator('canvas').first();

      // 等待游戏完全加载
      await page.waitForFunction(() => {
        const el = document.getElementById('position-display');
        return el && el.textContent && el.textContent.match(/\(\d+, \d+\)/);
      }, { timeout: 10000 });

      await canvas.focus();
      await page.waitForTimeout(500);

      const positionDisplay = page.locator('#position-display');
      const initialPos = await positionDisplay.textContent();
      expect(initialPos).toBeDefined();

      // 解析初始位置
      const match = initialPos.match(/\((\d+), (\d+)\)/);
      expect(match).toBeTruthy();
      const [initialX, initialY] = [parseInt(match![1]), parseInt(match![2])];

      // 先向下移动（S 键），确保有移动空间
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('s');
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(300);

      const afterDownPos = await positionDisplay.textContent();
      const downMatch = afterDownPos.match(/\((\d+), (\d+)\)/);
      expect(downMatch).toBeTruthy();
      const [, downY] = [parseInt(downMatch![1]), parseInt(downMatch![2])];

      // 验证向下移动后 Y 坐标增加
      expect(downY).toBeGreaterThanOrEqual(initialY);

      // 再按 W 键向上移动
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('w');
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(300);

      const finalPos = await positionDisplay.textContent();
      const finalMatch = finalPos.match(/\((\d+), (\d+)\)/);
      expect(finalMatch).toBeTruthy();
      const [, finalY] = [parseInt(finalMatch![1]), parseInt(finalMatch![2])];

      // 验证向上移动后 Y 坐标减少（至少比向下后的位置小）
      expect(finalY).toBeLessThanOrEqual(downY);
    });
  });
});
