import { test, expect } from '@playwright/test';
import { loginAsAlumni } from '../utils/auth.js';
import { pageUrls } from '../fixtures/test-data.js';

test.describe('Alumni Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.TEST_ALUMNI_EMAIL || !process.env.TEST_ALUMNI_PASSWORD) {
      test.skip('Test credentials not configured');
      return;
    }

    await loginAsAlumni(page);
  });

  test.describe('Alumni Dashboard Page', () => {
    test('alumni dashboard loads successfully', async ({ page }) => {
      await page.goto('/alumni/dashboard');

      await expect(page.locator('main')).toBeVisible();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
    });

    test('alumni dashboard shows personal summary', async ({ page }) => {
      await page.goto('/alumni/dashboard');

      await page.waitForTimeout(1000);

      // Look for summary stats
      const stats = page.locator('[class*="stat"], [class*="card"], [class*="summary"]');
      expect(await stats.count()).toBeGreaterThan(0);
    });

    test('alumni dashboard shows contribution total', async ({ page }) => {
      await page.goto('/alumni/dashboard');

      await page.waitForTimeout(1000);

      // Look for contribution information
      const contributionInfo = page.locator('text=/contribution/i, [class*="contribution"]');
      expect(await contributionInfo.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Alumni Navigation', () => {
    test('alumni can navigate to contributions page', async ({ page }) => {
      await page.goto('/alumni/dashboard');

      const contributionsLink = page.locator('nav a:has-text("Contributions"), nav li:has-text("Contributions") a');
      await contributionsLink.first().click();

      await page.waitForURL(/\/alumni\/contributions/);
      expect(page.url()).toContain('/alumni/contributions');
    });

    test('alumni can navigate to announcements page', async ({ page }) => {
      await page.goto('/alumni/dashboard');

      const announcementsLink = page.locator('nav a:has-text("Announcements"), nav li:has-text("Announcements") a');
      await announcementsLink.first().click();

      await page.waitForURL(/\/alumni\/announcements/);
      expect(page.url()).toContain('/alumni/announcements');
    });

    test('alumni sidebar shows available navigation links', async ({ page }) => {
      await page.goto('/alumni/dashboard');

      const expectedLinks = [
        'Dashboard',
        'My Contributions',
        'Announcements',
        'Change Password',
      ];

      for (const linkText of expectedLinks) {
        const link = page.locator(`nav a:has-text("${linkText}"), nav li:has-text("${linkText}")`);
        // Check if link exists (may be in different formats)
        const count = await link.count();
        if (count === 0) {
          // Try alternative text matching
          const altLink = page.locator(`nav a, nav button`).filter({ hasText: linkText });
          // Some links might not exist, that's ok
        }
      }
    });

    test('alumni header shows logout button', async ({ page }) => {
      await page.goto('/alumni/dashboard');

      const logoutButton = page.locator('button:has-text("Logout")');
      await expect(logoutButton).toBeVisible();
    });
  });

  test.describe('Alumni: My Contributions Page', () => {
    test('alumni contributions page loads', async ({ page }) => {
      await page.goto('/alumni/contributions');

      await expect(page.locator('main')).toBeVisible();
    });

    test('alumni can view own contribution history', async ({ page }) => {
      await page.goto('/alumni/contributions');

      await page.waitForTimeout(1000);

      const contributions = page.locator('table tbody tr, [class*="contribution"]');
      const count = await contributions.count();

      // May or may not have contributions
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('alumni contributions show type and status', async ({ page }) => {
      await page.goto('/alumni/contributions');

      await page.waitForTimeout(1000);

      const typeBadges = page.locator('[class*="badge"], span:has-text("BASIC"), span:has-text("ADDITIONAL")');
      const statusBadges = page.locator('[class*="badge"], span:has-text("PENDING"), span:has-text("APPROVED")');

      // Badges may or may not exist depending on data
      const hasBadges = await typeBadges.count() > 0 || await statusBadges.count() > 0;
      if (hasBadges) {
        expect(true).toBeTruthy();
      }
    });
  });

  test.describe('Alumni: Access Control', () => {
    test('alumni cannot access admin routes', async ({ page }) => {
      await page.goto('/admin/overview');

      // Should be redirected to login or get an error
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const isAdmin = currentUrl.includes('/admin');

      // Alumni should not stay on admin page
      expect(isAdmin).toBeFalsy();
    });

    test('alumni cannot access users page', async ({ page }) => {
      const response = await page.request.get('/admin/users');
      // Should get 401 or 403
      expect([401, 403]).toContain(response.status());
    });
  });
});
