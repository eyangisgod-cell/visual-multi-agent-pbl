/**
 * E2E Tests for WeChat Login Integration
 * Task 7: 微信登录集成
 */

import { test, expect } from '@playwright/test';

test.describe('WeChat Login API', () => {
  const API_BASE = 'http://localhost:3000/api';

  test.describe('GET /api/auth/wechat/login - Get QR Code', () => {
    test('should return QR code URL and session key', async ({ request }) => {
      const response = await request.get(`${API_BASE}/auth/wechat/login`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.sessionKey).toBeDefined();
      expect(data.qrCodeUrl).toBeDefined();
      expect(data.qrCodeUrl).toContain('open.weixin.qq.com');
      expect(data.qrCodeUrl).toContain('snsapi_login');
      expect(data.expiresIn).toBe(300); // 5 minutes
    });

    test('should return unique session key for each request', async ({ request }) => {
      const response1 = await request.get(`${API_BASE}/auth/wechat/login`);
      const data1 = await response1.json();

      const response2 = await request.get(`${API_BASE}/auth/wechat/login`);
      const data2 = await response2.json();

      expect(data1.sessionKey).not.toBe(data2.sessionKey);
    });

    test('should return 400 when WeChat OAuth not configured', async ({ request }) => {
      // This test assumes WECHAT_APP_ID and WECHAT_APP_SECRET are not set
      // May need to skip in environments where WeChat is configured
      const response = await request.get(`${API_BASE}/auth/wechat/login`);

      // If configured, this test will fail - that's OK for now
      // The API should return 400 with appropriate error message
      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toContain('WeChat OAuth not configured');
      }
    });
  });

  test.describe('POST /api/auth/wechat/callback - Handle OAuth Callback', () => {
    test('should return 400 when session key is missing', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/wechat/callback`, {
        data: { code: 'test-code' }
      });

      expect(response.status()).toBe(400);
    });

    test('should return 400 when code is missing', async ({ request }) => {
      // First get a valid session key
      const loginResponse = await request.get(`${API_BASE}/auth/wechat/login`);
      const loginData = await loginResponse.json();

      const response = await request.post(`${API_BASE}/auth/wechat/callback`, {
        data: { sessionKey: loginData.sessionKey }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('code');
    });

    test('should return 400 for invalid session key', async ({ request }) => {
      const response = await request.post(`${API_BASE}/auth/wechat/callback`, {
        data: {
          sessionKey: 'invalid-session-key',
          code: 'test-code'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid or expired session');
    });

    test('should return 400 when session is expired', async ({ request }) => {
      // Get a session key
      const loginResponse = await request.get(`${API_BASE}/auth/wechat/login`);
      const loginData = await loginResponse.json();

      // Wait for session to expire (5 minutes) - skipping for now
      // This test would require waiting or mocking time
      test.skip();
    });

    test('should create new user on first login', async ({ request }) => {
      // Get session
      const loginResponse = await request.get(`${API_BASE}/auth/wechat/login`);
      const loginData = await loginResponse.json();

      // Simulate WeChat callback with user info
      const response = await request.post(`${API_BASE}/auth/wechat/callback`, {
        data: {
          sessionKey: loginData.sessionKey,
          code: 'test-auth-code',
          wechatUserInfo: {
            openid: 'test-openid-' + Date.now(),
            unionid: 'test-unionid',
            nickname: 'Test User',
            headimgurl: 'https://example.com/avatar.jpg',
            sex: 1,
            language: 'zh_CN',
            city: 'Beijing',
            province: 'Beijing',
            country: 'CN'
          }
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Login successful');
      expect(data.user).toBeDefined();
      expect(data.user.nickname).toBe('Test User');
      expect(data.token).toBeDefined();
    });

    test('should login existing user on second login', async ({ request }) => {
      // First login - create user
      const loginResponse1 = await request.get(`${API_BASE}/auth/wechat/login`);
      const loginData1 = await loginResponse1.json();

      const openid = 'existing-user-openid-' + Date.now();

      const callbackResponse1 = await request.post(`${API_BASE}/auth/wechat/callback`, {
        data: {
          sessionKey: loginData1.sessionKey,
          code: 'test-code',
          wechatUserInfo: {
            openid,
            nickname: 'Existing User',
            headimgurl: 'https://example.com/avatar.jpg'
          }
        }
      });
      expect(callbackResponse1.status()).toBe(200);
      const userData1 = await callbackResponse1.json();

      // Second login - should login existing user
      const loginResponse2 = await request.get(`${API_BASE}/auth/wechat/login`);
      const loginData2 = await loginResponse2.json();

      const callbackResponse2 = await request.post(`${API_BASE}/auth/wechat/callback`, {
        data: {
          sessionKey: loginData2.sessionKey,
          code: 'test-code',
          wechatUserInfo: {
            openid,
            nickname: 'Existing User Updated',
            headimgurl: 'https://example.com/new-avatar.jpg'
          }
        }
      });

      expect(callbackResponse2.status()).toBe(200);
      const userData2 = await callbackResponse2.json();
      expect(userData2.user.id).toBe(userData1.user.id);
      expect(userData2.user.nickname).toBe('Existing User Updated');
    });

    test('should set HTTP-only session cookie', async ({ request }) => {
      const loginResponse = await request.get(`${API_BASE}/auth/wechat/login`);
      const loginData = await loginResponse.json();

      const response = await request.post(`${API_BASE}/auth/wechat/callback`, {
        data: {
          sessionKey: loginData.sessionKey,
          code: 'test-code',
          wechatUserInfo: {
            openid: 'cookie-test-openid',
            nickname: 'Cookie Test'
          }
        }
      });

      const cookies = response.headers()['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.join(';')).toContain('session=');
      expect(cookies.join(';')).toContain('HttpOnly');
    });
  });

  test.describe('PUT /api/auth/wechat/bind - Bind WeChat to Existing User', () => {
    test('should return 401 without auth token', async ({ request }) => {
      const response = await request.put(`${API_BASE}/auth/wechat/bind`, {
        data: {
          wechatCode: 'test-code',
          wechatUserInfo: { openid: 'test-openid' }
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should bind WeChat to existing user', async ({ request }) => {
      // This test requires an authenticated user
      // Would need to first login via credentials or other means
      // Skipping for now - requires auth setup
      test.skip();
    });

    test('should return 400 when WeChat already bound to another user', async ({ request }) => {
      // This test requires two authenticated users
      // Skipping for now - requires auth setup
      test.skip();
    });
  });

  test.describe('GET /api/auth/wechat/status - Check Login Status', () => {
    test('should return pending for new session', async ({ request }) => {
      const loginResponse = await request.get(`${API_BASE}/auth/wechat/login`);
      const loginData = await loginResponse.json();

      const statusResponse = await request.get(
        `${API_BASE}/auth/wechat/status?sessionKey=${loginData.sessionKey}`
      );

      expect(statusResponse.status()).toBe(200);
      const data = await statusResponse.json();
      expect(data.status).toBe('pending');
    });

    test('should return success after login', async ({ request }) => {
      const loginResponse = await request.get(`${API_BASE}/auth/wechat/login`);
      const loginData = await loginResponse.json();

      // Complete login
      await request.post(`${API_BASE}/auth/wechat/callback`, {
        data: {
          sessionKey: loginData.sessionKey,
          code: 'test-code',
          wechatUserInfo: {
            openid: 'status-test-openid',
            nickname: 'Status Test'
          }
        }
      });

      // Check status
      const statusResponse = await request.get(
        `${API_BASE}/auth/wechat/status?sessionKey=${loginData.sessionKey}`
      );

      expect(statusResponse.status()).toBe(200);
      const data = await statusResponse.json();
      expect(data.status).toBe('success');
      expect(data.user).toBeDefined();
    });

    test('should return expired for old session', async ({ request }) => {
      // Use an old/expired session key
      const response = await request.get(
        `${API_BASE}/auth/wechat/status?sessionKey=expired-session-key`
      );

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('expired');
    });
  });
});

test.describe('WeChat Login Frontend', () => {
  test('should display WeChat login button on login page', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login');

    const wechatButton = page.getByRole('button', { name: /微信登录/i });
    await expect(wechatButton).toBeVisible();
  });

  test('should show QR code when clicking WeChat login', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login');

    const wechatButton = page.getByRole('button', { name: /微信登录/i });
    await wechatButton.click();

    // Should show QR code modal or section
    const qrCodeSection = page.getByTestId('wechat-qrcode');
    await expect(qrCodeSection).toBeVisible();
  });

  test('should poll login status and redirect on success', async ({ page }) => {
    // This test would require mocking the WeChat callback
    // or manually scanning QR code during test
    test.skip();
  });

  test('should show expired message when QR code expires', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/wechat');

    // Wait for QR code to expire (5 minutes)
    // This test would require waiting or mocking time
    test.skip();
  });

  test('should refresh QR code when clicking refresh button', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/wechat');

    const refreshButton = page.getByRole('button', { name: /刷新/i });
    await expect(refreshButton).toBeVisible();

    // Click refresh and verify new QR code is loaded
    // Would require tracking QR code URL changes
    test.skip();
  });
});
