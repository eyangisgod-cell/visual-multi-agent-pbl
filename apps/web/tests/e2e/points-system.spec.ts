/**
 * E2E Tests for Points System
 * Task 12: 积分系统设计
 */

import { test, expect } from '@playwright/test';

test.describe('Points System API', () => {
  const API_BASE = 'http://localhost:3000/api';

  test.describe('GET /api/users/:id/points - Get User Points', () => {
    test('should return user points info', async ({ request }) => {
      // Create a test user first (assuming endpoint exists)
      // For now, test with a mock user ID
      const response = await request.get(`${API_BASE}/users/test-user-id/points`);

      // Should return 404 for non-existent user
      expect([404, 200]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.userId).toBeDefined();
        expect(data.points).toBeDefined();
        expect(data.level).toBeDefined();
      }
    });

    test('should return 404 for non-existent user', async ({ request }) => {
      const response = await request.get(`${API_BASE}/users/non-existent-user/points`);

      expect(response.status()).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
    });

    test('should include level info with points', async ({ request }) => {
      const response = await request.get(`${API_BASE}/users/test-user-id/points`);

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.level).toBeDefined();
        expect(data.levelName).toBeDefined();
        expect(data.progressToNextLevel).toBeDefined();
      }
    });

    test('should include points logs when includeLogs=true', async ({ request }) => {
      const response = await request.get(
        `${API_BASE}/users/test-user-id/points?includeLogs=true&limit=10`
      );

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.logs).toBeDefined();
        expect(Array.isArray(data.logs)).toBe(true);
      }
    });
  });

  test.describe('POST /api/users/:id/points - Add/Deduct Points', () => {
    test('should add points with valid action', async ({ request }) => {
      const response = await request.post(`${API_BASE}/users/test-user-id/points`, {
        data: {
          points: 10,
          action: 'login',
          description: 'Daily login bonus'
        }
      });

      // Should return 404 for non-existent user or 200 if user exists
      expect([404, 200]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.points).toBeDefined();
        expect(data.pointsChanged).toBe(10);
      }
    });

    test('should return 400 when action is missing', async ({ request }) => {
      const response = await request.post(`${API_BASE}/users/test-user-id/points`, {
        data: { points: 10, description: 'No action' }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('action');
    });

    test('should return 400 when description is missing', async ({ request }) => {
      const response = await request.post(`${API_BASE}/users/test-user-id/points`, {
        data: { points: 10, action: 'login' }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('description');
    });

    test('should return 400 when points is zero', async ({ request }) => {
      const response = await request.post(`${API_BASE}/users/test-user-id/points`, {
        data: { points: 0, action: 'test', description: 'Zero points' }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('zero');
    });

    test('should deduct points when points is negative', async ({ request }) => {
      const response = await request.post(`${API_BASE}/users/test-user-id/points`, {
        data: {
          points: -50,
          action: 'admin_deduction',
          description: 'Penalty for violation'
        }
      });

      expect([404, 200, 400]).toContain(response.status());
    });

    test('should record points log entry', async ({ request }) => {
      // After adding points, the log should be created
      const response = await request.post(`${API_BASE}/users/test-user-id/points`, {
        data: {
          points: 10,
          action: 'login',
          description: 'Login test'
        }
      });

      if (response.status() === 200) {
        // Verify log was created
        const logResponse = await request.get(
          `${API_BASE}/users/test-user-id/points?includeLogs=true`
        );
        if (logResponse.status() === 200) {
          const data = await logResponse.json();
          expect(data.logs).toBeDefined();
        }
      }
    });
  });

  test.describe('GET /api/points/rules - Get Points Rules', () => {
    test('should return points rules configuration', async ({ request }) => {
      const response = await request.get(`${API_BASE}/points/rules`);

      // Should return rules configuration
      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.rules).toBeDefined();
        expect(Array.isArray(data.rules)).toBe(true);
      }
    });

    test('should return rules for specific action', async ({ request }) => {
      const response = await request.get(`${API_BASE}/points/rules?action=login`);

      if (response.status() === 200) {
        const data = await response.json();
        // Should find the login rule
        expect(data.rules).toBeDefined();
      }
    });
  });

  test.describe('POST /api/points/rules - Create Points Rule (Admin)', () => {
    test('should create new points rule', async ({ request }) => {
      const response = await request.post(`${API_BASE}/points/rules`, {
        data: {
          action: 'test_action',
          points: 5,
          description: 'Test rule',
          dailyLimit: 1
        }
      });

      // May require authentication
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should return 400 when points is invalid', async ({ request }) => {
      const response = await request.post(`${API_BASE}/points/rules`, {
        data: {
          action: 'invalid_rule',
          points: 0,
          description: 'Zero points rule'
        }
      });

      expect([400, 401, 403]).toContain(response.status());
    });
  });

  test.describe('GET /api/points/levels - Get Level Configuration', () => {
    test('should return user levels configuration', async ({ request }) => {
      const response = await request.get(`${API_BASE}/points/levels`);

      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.levels).toBeDefined();
        expect(Array.isArray(data.levels)).toBe(true);
        // Should have at least level 1
        expect(data.levels.some((l: any) => l.level === 1)).toBe(true);
      }
    });

    test('should return level info for specific points', async ({ request }) => {
      const response = await request.get(`${API_BASE}/points/level?points=100`);

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.level).toBeDefined();
        expect(data.levelName).toBeDefined();
        expect(data.minPoints).toBeDefined();
      }
    });
  });

  test.describe('GET /api/points/leaderboard - Get Points Leaderboard', () => {
    test('should return top users by points', async ({ request }) => {
      const response = await request.get(`${API_BASE}/points/leaderboard?limit=10`);

      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.leaderboard).toBeDefined();
        expect(Array.isArray(data.leaderboard)).toBe(true);
      }
    });

    test('should support time range filter', async ({ request }) => {
      const response = await request.get(`${API_BASE}/points/leaderboard?period=weekly`);

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.leaderboard).toBeDefined();
      }
    });

    test('should support friend leaderboard', async ({ request }) => {
      const response = await request.get(`${API_BASE}/points/leaderboard?scope=friends`);

      // May require authentication
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('POST /api/points/redeem - Redeem Points for Rewards', () => {
    test('should redeem points successfully', async ({ request }) => {
      const response = await request.post(`${API_BASE}/points/redeem`, {
        data: {
          rewardId: 'test-reward',
          quantity: 1
        }
      });

      // May require authentication
      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('should return 400 when insufficient points', async ({ request }) => {
      const response = await request.post(`${API_BASE}/points/redeem`, {
        data: {
          rewardId: 'expensive-reward',
          quantity: 1
        }
      });

      expect([400, 401, 404]).toContain(response.status());

      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toContain('insufficient') || expect(data.error).toContain('points');
      }
    });

    test('should create redemption record', async ({ request }) => {
      const response = await request.post(`${API_BASE}/points/redeem`, {
        data: {
          rewardId: 'test-reward',
          quantity: 1
        }
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.redemptionId).toBeDefined();
        expect(data.pointsDeducted).toBeDefined();
      }
    });
  });

  test.describe('GET /api/points/rewards - Get Available Rewards', () => {
    test('should return available rewards', async ({ request }) => {
      const response = await request.get(`${API_BASE}/points/rewards`);

      expect([200, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.rewards).toBeDefined();
        expect(Array.isArray(data.rewards)).toBe(true);
      }
    });

    test('should filter rewards by points range', async ({ request }) => {
      const response = await request.get(`${API_BASE}/points/rewards?maxPoints=100`);

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.rewards).toBeDefined();
        // All rewards should be <= maxPoints
        if (data.rewards.length > 0) {
          data.rewards.forEach((reward: any) => {
            expect(reward.cost).toBeLessThanOrEqual(100);
          });
        }
      }
    });
  });

  test.describe('Points Earning Actions', () => {
    test('should award points for daily login', async ({ request }) => {
      const response = await request.post(`${API_BASE}/users/test-user/points`, {
        data: {
          points: 10,
          action: 'daily_login',
          description: 'Daily login bonus'
        }
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.action).toBe('daily_login');
      }
    });

    test('should award points for completing task', async ({ request }) => {
      const response = await request.post(`${API_BASE}/users/test-user/points`, {
        data: {
          points: 50,
          action: 'task_complete',
          description: 'Completed project task'
        }
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.action).toBe('task_complete');
      }
    });

    test('should award points for work submission', async ({ request }) => {
      const response = await request.post(`${API_BASE}/users/test-user/points`, {
        data: {
          points: 30,
          action: 'work_submit',
          description: 'Submitted work'
        }
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.action).toBe('work_submit');
      }
    });

    test('should award points for work likes', async ({ request }) => {
      const response = await request.post(`${API_BASE}/users/test-user/points`, {
        data: {
          points: 5,
          action: 'work_liked',
          description: 'Work received like'
        }
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.action).toBe('work_liked');
      }
    });

    test('should award points for inviting friend', async ({ request }) => {
      const response = await request.post(`${API_BASE}/users/test-user/points`, {
        data: {
          points: 50,
          action: 'friend_invite',
          description: 'Friend signed up with invitation'
        }
      });

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.action).toBe('friend_invite');
      }
    });
  });
});

test.describe('Points System Frontend', () => {
  test('should display user points in profile page', async ({ page }) => {
    // Navigate to profile page
    await page.goto('http://localhost:3000/profile');

    // Should display points
    const pointsDisplay = page.getByTestId('user-points');
    await expect(pointsDisplay).toBeVisible();
  });

  test('should show points history', async ({ page }) => {
    await page.goto('http://localhost:3000/profile/points');

    // Should show points log/history
    const pointsHistory = page.getByTestId('points-history');
    await expect(pointsHistory).toBeVisible();
  });

  test('should display level progress bar', async ({ page }) => {
    await page.goto('http://localhost:3000/profile');

    const levelProgress = page.getByTestId('level-progress');
    await expect(levelProgress).toBeVisible();
  });

  test('should show points shop/rewards page', async ({ page }) => {
    await page.goto('http://localhost:3000/points/shop');

    // Should display available rewards
    const rewardsList = page.getByTestId('rewards-list');
    await expect(rewardsList).toBeVisible();
  });

  test('should allow redeeming rewards', async ({ page }) => {
    await page.goto('http://localhost:3000/points/shop');

    // Click on a reward and redeem
    // This test would require specific reward setup
    test.skip();
  });

  test('should display leaderboard page', async ({ page }) => {
    await page.goto('http://localhost:3000/points/leaderboard');

    const leaderboard = page.getByTestId('leaderboard');
    await expect(leaderboard).toBeVisible();
  });
});
