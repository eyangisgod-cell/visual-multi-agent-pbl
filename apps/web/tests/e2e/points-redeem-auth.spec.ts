import { test, expect } from '@playwright/test';

/**
 * 积分兑换 API 认证测试
 */

test.describe('积分兑换 API 认证', () => {
  const API_BASE = 'http://localhost:3000/api';

  test('应该拒绝未授权用户的兑换请求', async ({ page }) => {
    // 访问积分兑换 API（不带认证）
    const response = await page.request.post(`${API_BASE}/points/redeem`, {
      data: {
        rewardId: 'test-reward-id',
        quantity: 1,
      },
    });

    // 应该返回 401（未授权）
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('Authentication required');
  });
});
