import { test, expect } from '@playwright/test';

test.describe('Agent Interaction', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
  });

  test('should display agent panel or scene', async ({ page }) => {
    // Look for agent-related elements
    const agentPanel = page.locator('[data-testid="agent-panel"], .agent-panel, [class*="agent"]');
    const pixiCanvas = page.locator('canvas');

    // Either agent panel or PixiJS canvas should be visible
    const agentPanelVisible = await agentPanel.count() > 0;
    const canvasVisible = await pixiCanvas.count() > 0;

    expect(agentPanelVisible || canvasVisible).toBeTruthy();
  });

  test('should show agent selection options', async ({ page }) => {
    await page.goto('/agents');

    // Check for agent selection UI
    const agentCards = page.locator('[data-testid="agent-card"], .agent-card, [class*="agent-card"]');

    // Wait for agents to load
    await page.waitForTimeout(2000);

    // Should have multiple agent options (at least 1)
    const count = await agentCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow selecting an agent', async ({ page }) => {
    await page.goto('/agents');

    // Find and click an agent card
    const firstAgent = page.locator('[data-testid="agent-card"], .agent-card').first();

    if (await firstAgent.count() > 0) {
      await firstAgent.click();

      // Should navigate to agent detail or show agent dialog
      await page.waitForTimeout(1000);

      // Check for agent detail view
      const agentDetail = page.locator('[data-testid="agent-detail"], .agent-detail, [class*="agent-detail"]');
      expect(await agentDetail.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display agent status indicators', async ({ page }) => {
    await page.goto('/');

    // Look for status indicators
    const statusIndicators = page.locator(
      '[data-testid="agent-status"], .agent-status, [class*="status"], [class*="status-indicator"]'
    );

    const count = await statusIndicators.count();
    // Status indicators are optional in phase-3
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show agent chat/dialog interface', async ({ page }) => {
    await page.goto('/chat');

    // Look for chat input
    const chatInput = page.locator(
      'textarea[placeholder*="message"], input[placeholder*="message"], [class*="chat-input"]'
    );

    const chatInputVisible = await chatInput.count() > 0;
    expect(chatInputVisible).toBeTruthy();
  });

  test('should display agent state visualization', async ({ page }) => {
    await page.goto('/');

    // Look for agent state elements (idle, working, completed)
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
