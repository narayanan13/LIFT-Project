import { test, expect } from '@playwright/test';
import { apiEndpoints } from '../fixtures/test-data.js';

test.describe('Health Checks', () => {
  test('backend health endpoint returns 200', async ({ request }) => {
    const apiBaseUrl = process.env.API_URL || 'http://localhost:4000';
    const response = await request.get(`${apiBaseUrl}/api/health`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('ok', true);
  });

  test('frontend loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads and has the expected title or content
    await expect(page).toHaveTitle(/LIFT/i);

    // Verify key elements are present on the landing page
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('frontend login page is accessible', async ({ page }) => {
    await page.goto('/login');

    // Verify login form elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
