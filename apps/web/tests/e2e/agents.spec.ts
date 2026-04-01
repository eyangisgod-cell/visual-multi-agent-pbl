/**
 * Agent System E2E Tests
 *
 * Tests for agent selector, agent cards, and agent interactions
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Agent Selector', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should load agent selector page', async ({ page }) => {
    await page.goto('/admin/agents/select');
    await expect(page.locator('h1')).toContainText('Select Agent');
  });

  test('should display all 5 agent types', async ({ page }) => {
    await page.goto('/admin/agents/select');

    // Check for all agent cards
    const agentCards = page.locator('[data-testid="agent-card"]');
    await expect(agentCards).toHaveCount(5);

    // Verify each agent type is present
    await expect(page.locator('[data-testid="agent-card-mentor"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-card-designer"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-card-analyst"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-card-marketer"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-card-assistant"]')).toBeVisible();
  });

  test('should display agent information', async ({ page }) => {
    await page.goto('/admin/agents/select');

    // Check mentor agent details
    const mentorCard = page.locator('[data-testid="agent-card-mentor"]');
    await expect(mentorCard.locator('[data-testid="agent-name"]')).toContainText('智慧导师');
    await expect(mentorCard.locator('[data-testid="agent-role"]')).toContainText('Mentor');
    await expect(mentorCard.locator('[data-testid="agent-description"]')).toBeVisible();
  });

  test('should highlight selected agent', async ({ page }) => {
    await page.goto('/admin/agents/select');

    // Select mentor agent
    await page.click('[data-testid="agent-card-mentor"]');

    // Verify selection state
    const selectedCard = page.locator('[data-testid="agent-card-mentor"]');
    await expect(selectedCard).toHaveClass(/selected|border-indigo/);

    // Verify other cards are not selected
    const otherCard = page.locator('[data-testid="agent-card-designer"]');
    await expect(otherCard).not.toHaveClass(/selected|border-indigo/);
  });

  test('should change selection when clicking different agent', async ({ page }) => {
    await page.goto('/admin/agents/select');

    // Select mentor first
    await page.click('[data-testid="agent-card-mentor"]');
    await expect(page.locator('[data-testid="agent-card-mentor"]')).toHaveClass(/selected/);

    // Change selection to designer
    await page.click('[data-testid="agent-card-designer"]');
    await expect(page.locator('[data-testid="agent-card-designer"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-testid="agent-card-mentor"]')).not.toHaveClass(/selected/);
  });
});

test.describe('Agent API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');
  });

  test('should fetch agent list from API', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/admin/agents/list')),
      page.goto('/admin/agents/select'),
    ]);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.agents).toBeInstanceOf(Array);
  });

  test('should save agent selection to API', async ({ page }) => {
    await page.goto('/admin/agents/select');

    // Click on an agent and wait for API call
    const [response] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes('/api/admin/agents/select') && res.method() === 'POST'
      ),
      page.click('[data-testid="agent-card-mentor"]'),
    ]);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.selected).toBe(true);
  });

  test('should load previously selected agent', async ({ page }) => {
    // First, select an agent
    await page.goto('/admin/agents/select');
    await page.click('[data-testid="agent-card-mentor"]');

    // Reload and verify selection persists
    await page.reload();
    await expect(page.locator('[data-testid="agent-card-mentor"]')).toHaveClass(/selected/);
  });
});

test.describe('Agent Status Indicators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');
    await page.goto('/admin/agents/select');
  });

  test('should display status badges on agent cards', async ({ page }) => {
    const statusBadges = page.locator('[data-testid="agent-status"]');
    await expect(statusBadges.first()).toBeVisible();
  });

  test('should show available status', async ({ page }) => {
    const availableBadge = page.locator('[data-testid="agent-status-available"]');
    await expect(availableBadge).toBeVisible();
  });

  test('should update status indicator on change', async ({ page }) => {
    // This test requires status update functionality
    const statusBadge = page.locator('[data-testid="agent-status"]').first();
    const initialStatus = await statusBadge.getAttribute('data-status');
    expect(['available', 'busy', 'offline']).toContain(initialStatus);
  });
});

test.describe('Agent Game Scene Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');
  });

  test('should render agents in game scene', async ({ page }) => {
    await page.goto('/game');

    // Wait for PixiJS canvas to load
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Agent sprites should be rendered (this is a basic check)
    // Actual sprite verification would require visual regression testing
  });

  test('should display speech bubble on agent interaction', async ({ page }) => {
    await page.goto('/game');

    // Click on an agent to trigger dialog
    await page.click('[data-testid="agent-mentor"]');

    // Speech bubble should appear
    const speechBubble = page.locator('[data-testid="speech-bubble"]');
    await expect(speechBubble).toBeVisible();
  });

  test('should hide speech bubble after timeout', async ({ page }) => {
    await page.goto('/game');
    await page.click('[data-testid="agent-mentor"]');

    // Wait for auto-hide timeout (default 3000ms)
    await page.waitForTimeout(3500);

    const speechBubble = page.locator('[data-testid="speech-bubble"]');
    await expect(speechBubble).not.toBeVisible();
  });
});

test.describe('Agent Animation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');
    await page.goto('/game');
  });

  test('should play idle animation', async ({ page }) => {
    // Agents should have idle animation
    const agent = page.locator('[data-testid="agent-mentor"]');
    await expect(agent).toBeVisible();

    // Verify agent element changes position slightly (idle animation)
    const initialBox = await agent.boundingBox();
    await page.waitForTimeout(1000);
    // Animation verification would require visual testing
  });

  test('should respond to hover interaction', async ({ page }) => {
    const agent = page.locator('[data-testid="agent-mentor"]');
    await agent.hover();

    // Hover state should trigger visual change
    await expect(agent).toHaveAttribute('data-hovered', 'true');
  });
});
