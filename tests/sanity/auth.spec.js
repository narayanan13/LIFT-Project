import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, isLoggedIn } from '../utils/auth.js';
import { adminCredentials, pageUrls } from '../fixtures/test-data.js';

test.describe('Authentication', () => {
  test.describe('Admin Login', () => {
    test('admin can login with valid credentials', async ({ page }) => {
      // Skip if no test credentials are configured
      if (!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD) {
        test.skip('Test credentials not configured');
        return;
      }

      await page.goto('/login');

      // Fill in login form
      await page.fill('input[type="email"]', process.env.TEST_ADMIN_EMAIL);
      await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD);

      // Submit the form
      await page.click('button[type="submit"]');

      // Wait for navigation to admin area
      await page.waitForURL(/\/admin/, { timeout: 10000 });

      // Verify we're on the admin dashboard
      expect(page.url()).toContain('/admin');

      // Verify user is stored in localStorage
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBeTruthy();
    });

    test('login fails with invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // Fill in invalid credentials
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');

      // Submit the form
      await page.click('button[type="submit"]');

      // Wait for error message to appear
      const errorMessage = page.locator('.bg-red-50, [class*="error"], [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });

      // Verify we're still on the login page
      expect(page.url()).toContain('/login');
    });

    test('empty form shows validation', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // The form should not submit (HTML5 validation or stay on page)
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Logout', () => {
    test('user can logout successfully', async ({ page }) => {
      // Skip if no test credentials are configured
      if (!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD) {
        test.skip('Test credentials not configured');
        return;
      }

      // First login
      await loginAsAdmin(page);

      // Verify we're logged in
      expect(page.url()).toContain('/admin');

      // Click logout button
      const logoutButton = page.locator('button:has-text("Logout")');
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();

      // Verify redirect to login page
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');

      // Verify localStorage is cleared
      const loggedIn = await isLoggedIn(page);
      expect(loggedIn).toBeFalsy();
    });
  });

  test.describe('Protected Routes', () => {
    test('unauthenticated user is redirected from admin routes', async ({ page }) => {
      // Clear any existing auth state
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
      });

      // Try to access admin page directly
      await page.goto('/admin/overview');

      // Should be redirected to login
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });

    test('unauthenticated user is redirected from alumni routes', async ({ page }) => {
      // Clear any existing auth state
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
      });

      // Try to access alumni page directly
      await page.goto('/alumni');

      // Should be redirected to login
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  });
});
