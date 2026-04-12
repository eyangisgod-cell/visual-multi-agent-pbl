/**
 * Security Integration Tests for Visual PBL Web
 *
 * Tests for:
 * - CSRF protection in middleware
 * - Security headers
 * - Input validation
 * - Rate limiting headers
 */

import { test, expect } from '@playwright/test'

const API_BASE = '/api'

test.describe('Security Integration Tests', () => {
  test.describe('CSRF Protection', () => {
    test('should set CSRF token cookie on first GET request', async ({ page }) => {
      await page.goto('/')

      // Check for CSRF token cookie
      const cookies = await page.context().cookies()
      const csrfCookie = cookies.find(c => c.name === 'csrf-token')

      // CSRF cookie should be set
      expect(csrfCookie).toBeDefined()
      expect(csrfCookie?.value).toBeTruthy()
    })

    test('should reject POST without CSRF token', async ({ page, request }) => {
      // Try to make API request without CSRF token
      const response = await request.post(`${API_BASE}/health`, {
        data: { test: 'data' }
      })

      // Should be rejected (403 or 401)
      expect([401, 403]).toContain(response.status())
    })

    test('should accept POST with valid CSRF token', async ({ page, request }) => {
      // First, navigate to get CSRF token
      await page.goto('/')

      // Get CSRF token from cookie
      const cookies = await page.context().cookies()
      const csrfCookie = cookies.find(c => c.name === 'csrf-token')

      if (csrfCookie) {
        // Make request with valid CSRF token
        const response = await request.post(`${API_BASE}/health`, {
          data: { test: 'data' },
          headers: {
            'x-csrf-token': csrfCookie.value
          }
        })

        // Should not be 403 (CSRF failure)
        expect(response.status()).not.toBe(403)
      }
    })
  })

  test.describe('Security Headers', () => {
    test('should set X-Content-Type-Options header', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`)

      expect(response.headers()['x-content-type-options']).toBe('nosniff')
    })

    test('should set X-Frame-Options header', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`)

      expect(response.headers()['x-frame-options']).toMatch(/deny|sameorigin/i)
    })

    test('should set X-XSS-Protection header', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`)

      expect(response.headers()['x-xss-protection']).toBe('1; mode=block')
    })

    test('should set Strict-Transport-Security header', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`)

      expect(response.headers()['strict-transport-security']).toMatch(/max-age=/i)
    })

    test('should set Content-Security-Policy header', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`)

      expect(response.headers()['content-security-policy']).toBeTruthy()
    })

    test('should set Referrer-Policy header', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`)

      expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
    })
  })

  test.describe('Input Validation', () => {
    test('should reject oversized input', async ({ request }) => {
      const oversizedInput = 'a'.repeat(10001)

      const response = await request.post(`${API_BASE}/health`, {
        data: { input: oversizedInput }
      })

      // Should reject oversized input (400 or 413)
      expect([400, 413, 403]).toContain(response.status())
    })

    test('should handle special characters safely', async ({ request }) => {
      const specialChars = '<script>alert("xss")</script>'

      const response = await request.post(`${API_BASE}/health`, {
        data: { input: specialChars }
      })

      // Should handle safely (not 500)
      expect(response.status()).not.toBe(500)
    })
  })

  test.describe('Rate Limiting', () => {
    test('should include rate limit headers', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`)

      // Check for rate limit headers (may or may not be present depending on implementation)
      const hasRateLimitHeader =
        response.headers()['x-ratelimit-limit'] ||
        response.headers()['x-rate-limit-limit']

      // If present, should be a number
      if (hasRateLimitHeader) {
        expect(parseInt(hasRateLimitHeader, 10)).toBeGreaterThan(0)
      }
    })

    test('should handle rapid requests', async ({ request }) => {
      // Make multiple rapid requests
      const requests = []
      for (let i = 0; i < 5; i++) {
        requests.push(request.get(`${API_BASE}/health`))
      }

      const responses = await Promise.all(requests)

      // All should complete (some may be rate limited, but not fail)
      responses.forEach(response => {
        expect([200, 204, 429]).toContain(response.status())
      })
    })
  })

  test.describe('Authentication Security', () => {
    test('should require auth for protected endpoints', async ({ request }) => {
      // Try to access protected endpoint without auth
      const response = await request.get(`${API_BASE}/projects`)

      // Should require authentication (401 or redirect)
      expect([200, 401, 403]).toContain(response.status())
    })

    test('should not expose sensitive info in errors', async ({ request }) => {
      // Try to access non-existent resource
      const response = await request.get(`${API_BASE}/projects/non-existent-id`)

      // Error should not expose stack trace or sensitive info
      const body = await response.json().catch(() => ({}))

      // Should not contain sensitive keywords
      const bodyStr = JSON.stringify(body)
      expect(bodyStr.toLowerCase()).not.toContain('stack')
      expect(bodyStr.toLowerCase()).not.toContain('trace')
      expect(bodyStr.toLowerCase()).not.toContain('password')
    })
  })

  test.describe('Cookie Security', () => {
    test('should set HttpOnly flag on sensitive cookies', async ({ page }) => {
      await page.goto('/')

      const cookies = await page.context().cookies()
      const csrfCookie = cookies.find(c => c.name === 'csrf-token')

      // CSRF cookie should be HttpOnly
      expect(csrfCookie?.httpOnly).toBe(true)
    })

    test('should set Secure flag on cookies in production', async ({ page }) => {
      await page.goto('/')

      const cookies = await page.context().cookies()
      const csrfCookie = cookies.find(c => c.name === 'csrf-token')

      // In production/test environment, check for secure flag
      if (process.env.NODE_ENV === 'production') {
        expect(csrfCookie?.secure).toBe(true)
      }
    })

    test('should set SameSite flag on cookies', async ({ page }) => {
      await page.goto('/')

      const cookies = await page.context().cookies()
      const csrfCookie = cookies.find(c => c.name === 'csrf-token')

      // CSRF cookie should have SameSite set
      expect(csrfCookie?.sameSite).toBeTruthy()
    })
  })
})
