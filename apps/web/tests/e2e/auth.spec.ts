/**
 * Authentication E2E Tests
 *
 * Tests for user registration, login, logout functionality
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login and register links on home page', async ({ page }) => {
    await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-link"]')).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('[data-testid="register-link"]');
    await expect(page).toHaveURL('/auth/register');
    await expect(page.locator('h1')).toContainText('Register');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('[data-testid="login-link"]');
    await expect(page).toHaveURL('/auth/login');
    await expect(page.locator('h1')).toContainText('Login');
  });
});

test.describe('User Registration', () => {
  test('should register a new user successfully', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test_${timestamp}@example.com`;

    await page.goto('/auth/register');
    await page.fill('[data-testid="username"]', `testuser_${timestamp}`);
    await page.fill('[data-testid="email"]', email);
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    await page.click('[data-testid="submit"]');

    // Should redirect to login page after successful registration
    await expect(page).toHaveURL('/auth/login');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should show error for existing email', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="email"]', 'existing@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    await page.click('[data-testid="submit"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'different');
    await page.click('[data-testid="submit"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('password');
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="email"]', 'invalid-email');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    await page.click('[data-testid="submit"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('email');
  });
});

test.describe('User Login', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');

    // Should redirect to home page after successful login
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="submit"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid');
  });

  test('should show error for non-existent user', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'nonexistent@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should display validation error for empty fields', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('[data-testid="submit"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});

test.describe('User Logout', () => {
  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="login-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('should clear session after logout', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Try to access protected page
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
  });
});

test.describe('Session Management', () => {
  test('should maintain session after page refresh', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Refresh page
    await page.reload();

    // Should still be logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should redirect to login when accessing protected route unauthenticated', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/auth/login');
  });
});
