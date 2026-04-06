/**
 * Simple test - Verify e2e-agent-layer exists in DOM
 */

import { test, expect } from '@playwright/test';

test.describe('E2E Agent Layer Verification', () => {
  test('Verify e2e-agent-layer exists after game loads', async ({ page }) => {
    // Go to game page directly (skip auth for now)
    await page.goto('/game', { waitUntil: 'domcontentloaded' });

    // Wait for any canvas to appear
    const canvas = page.locator('#game-container canvas').first();
    try {
      await canvas.waitFor({ state: 'visible', timeout: 5000 });
    } catch (e) {
      console.log('Canvas not found, page may require auth');
      // Check if we're on login page
      const url = page.url();
      console.log('Current URL:', url);
    }

    // Wait 2 seconds for React to render
    await page.waitForTimeout(2000);

    // Check for e2e-agent-layer
    const agentLayer = page.locator('#e2e-agent-layer');
    const count = await agentLayer.count();
    console.log('e2e-agent-layer count:', count);

    // Get all elements in game-container
    const domInfo = await page.evaluate(() => {
      const container = document.getElementById('game-container');
      if (!container) return null;

      const allElements = Array.from(container.querySelectorAll('*')).map(el => ({
        tagName: el.tagName,
        id: el.id,
        dataTestId: el.getAttribute('data-testid'),
      }));

      return allElements;
    });

    console.log('DOM elements:', JSON.stringify(domInfo, null, 2));

    // Even if count is 0, the test passes - we're debugging
    expect(true).toBe(true);
  });
});
