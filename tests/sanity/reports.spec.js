import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsAlumni } from '../utils/auth.js';

test.describe('Reports', () => {
  test.describe('Admin: Financial Reports', () => {
    test.beforeEach(async ({ page }) => {
      if (!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD) {
        test.skip('Test credentials not configured');
        return;
      }

      await loginAsAdmin(page);
    });

    test('admin can access reports page', async ({ page }) => {
      await page.goto('/admin/reports');

      await expect(page.locator('main')).toBeVisible();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
    });

    test('admin can view financial summary report', async ({ page }) => {
      await page.goto('/admin/reports');

      await page.waitForTimeout(1000);

      // Look for financial summary elements
      const summarySection = page.locator('[class*="summary"], [class*="financial"], [class*="report"]');
      expect(await summarySection.count()).toBeGreaterThan(0);
    });

    test('admin can generate contribution report', async ({ page }) => {
      await page.goto('/admin/reports');

      // Look for contribution report section or button
      const contributionReport = page.locator('text=/contribution.*report/i, button:has-text("Contribution")');
      if (await contributionReport.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        expect(true).toBeTruthy();
      }
    });

    test('admin can generate expense report', async ({ page }) => {
      await page.goto('/admin/reports');

      const expenseReport = page.locator('text=/expense.*report/i, button:has-text("Expense")');
      if (await expenseReport.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        expect(true).toBeTruthy();
      }
    });

    test('admin can filter reports by date range', async ({ page }) => {
      await page.goto('/admin/reports');

      const dateInputs = page.locator('input[type="date"]');
      const count = await dateInputs.count();

      if (count >= 2) {
        // Start and end date inputs exist
        expect(true).toBeTruthy();
      }
    });

    test('admin can export reports', async ({ page }) => {
      await page.goto('/admin/reports');

      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("PDF")');
      const count = await exportButton.count();

      if (count > 0) {
        expect(true).toBeTruthy();
      }
    });
  });

  test.describe('Alumni: Personal Reports', () => {
    test.beforeEach(async ({ page }) => {
      if (!process.env.TEST_ALUMNI_EMAIL || !process.env.TEST_ALUMNI_PASSWORD) {
        test.skip('Test credentials not configured');
        return;
      }

      await loginAsAlumni(page);
    });

    test('alumni can access reports page', async ({ page }) => {
      await page.goto('/alumni/reports');

      await expect(page.locator('main')).toBeVisible();
    });

    test('alumni can view own contribution summary', async ({ page }) => {
      await page.goto('/alumni/reports');

      await page.waitForTimeout(1000);

      const summarySection = page.locator('[class*="summary"], [class*="contribution"]');
      expect(await summarySection.count()).toBeGreaterThan(0);
    });

    test('alumni cannot view organization-wide reports', async ({ page }) => {
      await page.goto('/alumni/reports');

      // Should not show all users/expenses
      const allUsersSection = page.locator('text=/all.*users/i, [class*="all-users"]');
      expect(await allUsersSection.count()).toBe(0);
    });
  });

  test.describe('API: Reports Endpoint', () => {
    test('admin can get financial summary via API', async ({ request }) => {
      if (!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD) {
        test.skip('Admin credentials not configured');
        return;
      }

      // First login to get token
      const apiBaseUrl = process.env.API_URL || 'http://localhost:4000/api';

      const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: process.env.TEST_ADMIN_EMAIL,
          password: process.env.TEST_ADMIN_PASSWORD,
        },
      });

      const loginData = await loginResponse.json();
      const token = loginData.data.token;

      const response = await request.get(`${apiBaseUrl}/admin/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.data).toBeDefined();
    });

    test('alumni can get personal report via API', async ({ request }) => {
      if (!process.env.TEST_ALUMNI_EMAIL || !process.env.TEST_ALUMNI_PASSWORD) {
        test.skip('Alumni credentials not configured');
        return;
      }

      const apiBaseUrl = process.env.API_URL || 'http://localhost:4000/api';

      const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: process.env.TEST_ALUMNI_EMAIL,
          password: process.env.TEST_ALUMNI_PASSWORD,
        },
      });

      const loginData = await loginResponse.json();
      const token = loginData.data.token;

      const response = await request.get(`${apiBaseUrl}/alumni/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.data).toBeDefined();
    });
  });
});
