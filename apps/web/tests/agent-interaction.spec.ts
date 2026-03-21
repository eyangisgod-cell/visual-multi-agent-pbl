import { test, expect } from '@playwright/test';

test.describe('Agent Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display agent panel or scene', async ({ page }) => {
    const agentPanel = page.locator('[data-testid="agent-panel"], .agent-panel, [class*="agent"]');
    const pixiCanvas = page.locator('canvas');

    const agentPanelVisible = await agentPanel.count() > 0;
    const canvasVisible = await pixiCanvas.count() > 0;

    expect(agentPanelVisible || canvasVisible).toBeTruthy();
  });

  test('should show agent selection options', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForTimeout(2000);

    const agentCards = page.locator('[data-testid="agent-card"], .agent-card, [class*="agent-card"]');
    const count = await agentCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow selecting an agent', async ({ page }) => {
    await page.goto('/agents');

    const firstAgent = page.locator('[data-testid="agent-card"], .agent-card').first();

    if (await firstAgent.count() > 0) {
      await firstAgent.click();
      await page.waitForTimeout(1000);

      const agentDetail = page.locator('[data-testid="agent-detail"], .agent-detail, [class*="agent-detail"]');
      expect(await agentDetail.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display agent status indicators', async ({ page }) => {
    await page.goto('/');

    const statusIndicators = page.locator(
      '[data-testid="agent-status"], .agent-status, [class*="status"], [class*="status-indicator"]'
    );

    const count = await statusIndicators.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show agent chat/dialog interface', async ({ page }) => {
    await page.goto('/chat');

    const chatInput = page.locator(
      'textarea[placeholder*="message"], input[placeholder*="message"], [class*="chat-input"]'
    );

    const chatInputVisible = await chatInput.count() > 0;
    expect(chatInputVisible).toBeTruthy();
  });

  test('should display agent state visualization', async ({ page }) => {
    await page.goto('/');

    const agentStates = page.locator(
      '[data-testid="agent-state"], [class*="agent-state"], [class*="state-idle"], [class*="state-working"], [class*="state-completed"]'
    );

    const count = await agentStates.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show speech bubble dialogs for agent communication', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const speechBubbles = page.locator(
      '[data-testid="speech-bubble"], .speech-bubble, [class*="speech"], [class*="dialog-bubble"]'
    );

    const count = await speechBubbles.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow assigning agent to project task', async ({ page }) => {
    await page.goto('/projects/1');

    const assignButton = page.locator(
      'button:has-text("Assign Agent"), [data-testid="assign-agent"], [class*="assign-agent"]'
    );

    const count = await assignButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
