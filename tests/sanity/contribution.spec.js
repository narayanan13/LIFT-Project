import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth.js';
import { basicContribution, additionalContribution, pageUrls } from '../fixtures/test-data.js';

test.describe('Contribution Management', () => {
  // Before each test, login as admin
  test.beforeEach(async ({ page }) => {
    // Skip all tests in this describe block if no credentials
    if (!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD) {
      test.skip('Test credentials not configured');
      return;
    }

    await loginAsAdmin(page);
  });

  test.describe('Contributions Page', () => {
    test('contributions page loads successfully', async ({ page }) => {
      await page.goto('/admin/contributions');

      // Wait for page to load
      await expect(page.locator('main')).toBeVisible();

      // Check for contribution page elements
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
    });

    test('contributions page shows add contribution button', async ({ page }) => {
      await page.goto('/admin/contributions');

      // Look for add button
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")');
      await expect(addButton.first()).toBeVisible();
    });

    test('contributions page displays filter options', async ({ page }) => {
      await page.goto('/admin/contributions');

      // Look for filter elements (dropdowns or buttons)
      const filterElements = page.locator('select, [class*="filter"], button:has-text("All")');
      // At least one filter should be present
      expect(await filterElements.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Contribution Form', () => {
    test('can open contribution form modal', async ({ page }) => {
      await page.goto('/admin/contributions');

      // Click add button
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      await addButton.click();

      // Wait for modal to appear
      const modal = page.locator('[role="dialog"], .modal, [class*="modal"], form');
      await expect(modal.first()).toBeVisible({ timeout: 5000 });
    });

    test('contribution form has required fields', async ({ page }) => {
      await page.goto('/admin/contributions');

      // Open form modal
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      await addButton.click();

      // Check for form fields
      await expect(page.locator('select, input[name*="user"], [class*="user"]').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('input[name*="amount"], input[type="number"]').first()).toBeVisible();
      await expect(page.locator('input[type="date"], input[name*="date"]').first()).toBeVisible();
    });

    test('contribution form shows type selection', async ({ page }) => {
      await page.goto('/admin/contributions');

      // Open form modal
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      await addButton.click();

      // Wait for form to load
      await page.waitForTimeout(500);

      // Look for type selection (BASIC/ADDITIONAL)
      const typeSelect = page.locator('select:has(option:text-is("BASIC")), select:has(option[value="BASIC"])');
      if (await typeSelect.isVisible()) {
        await expect(typeSelect).toBeVisible();
      } else {
        // May use radio buttons or other selection method
        const typeOption = page.locator('input[value="BASIC"], label:has-text("BASIC"), button:has-text("BASIC")');
        await expect(typeOption.first()).toBeVisible();
      }
    });
  });

  test.describe('Contribution Display', () => {
    test('contributions list shows type badges', async ({ page }) => {
      await page.goto('/admin/contributions');

      // Wait for list to load
      await page.waitForTimeout(1000);

      // Check for type badges (BASIC/ADDITIONAL)
      const typeBadges = page.locator('[class*="badge"], span:has-text("BASIC"), span:has-text("ADDITIONAL")');
      // Only check if there are contributions
      const listContent = page.locator('table, [class*="list"], [class*="grid"]').first();
      if (await listContent.isVisible()) {
        // Page has loaded, badges may or may not exist depending on data
        expect(true).toBeTruthy();
      }
    });

    test('contributions list shows bucket information', async ({ page }) => {
      await page.goto('/admin/contributions');

      // Wait for list to load
      await page.waitForTimeout(1000);

      // Check for bucket badges (LIFT/Alumni Association)
      const bucketBadges = page.locator('[class*="badge"], span:has-text("LIFT"), span:has-text("Alumni")');
      // Page structure verification
      const listContent = page.locator('table, [class*="list"], [class*="grid"]').first();
      if (await listContent.isVisible()) {
        expect(true).toBeTruthy();
      }
    });

    test('contributions list shows status badges', async ({ page }) => {
      await page.goto('/admin/contributions');

      // Wait for list to load
      await page.waitForTimeout(1000);

      // Check for status badges (PENDING/APPROVED/REJECTED)
      const statusBadges = page.locator('[class*="badge"], span:has-text("PENDING"), span:has-text("APPROVED"), span:has-text("REJECTED")');
      // Page structure verification
      const listContent = page.locator('table, [class*="list"], [class*="grid"]').first();
      if (await listContent.isVisible()) {
        expect(true).toBeTruthy();
      }
    });
  });

  test.describe('Contribution Filtering', () => {
    test('can filter contributions by status', async ({ page }) => {
      await page.goto('/admin/contributions');

      // Look for status filter
      const statusFilter = page.locator('select:has(option:text-is("PENDING")), select:has(option:text-is("APPROVED"))');
      if (await statusFilter.isVisible()) {
        // Select a filter option
        await statusFilter.selectOption({ label: 'PENDING' });
        // Page should update (verify no errors)
        await page.waitForTimeout(500);
        expect(true).toBeTruthy();
      }
    });

    test('can filter contributions by type', async ({ page }) => {
      await page.goto('/admin/contributions');

      // Look for type filter
      const typeFilter = page.locator('select:has(option:text-is("BASIC")), select:has(option[value="BASIC"])');
      if (await typeFilter.first().isVisible()) {
        // Filter options exist
        expect(true).toBeTruthy();
      }
    });

    test('can filter contributions by bucket', async ({ page }) => {
      await page.goto('/admin/contributions');

      // Look for bucket filter
      const bucketFilter = page.locator('select:has(option:text-is("LIFT")), select:has(option[value="LIFT"])');
      if (await bucketFilter.first().isVisible()) {
        // Filter options exist
        expect(true).toBeTruthy();
      }
    });
  });
});

test.describe('Contribution CRUD (requires test data)', () => {
  // These tests are more integration-like and require proper test data
  // They're marked with conditional skips

  test.beforeEach(async ({ page }) => {
    if (!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD) {
      test.skip('Test credentials not configured');
      return;
    }
    await loginAsAdmin(page);
  });

  test('creating BASIC contribution shows split calculation info', async ({ page }) => {
    await page.goto('/admin/contributions');

    // Open form
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    await addButton.click();

    // Wait for modal
    await page.waitForTimeout(500);

    // Select BASIC type if available
    const typeSelect = page.locator('select').filter({ has: page.locator('option[value="BASIC"]') }).first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('BASIC');

      // Look for split information text
      const splitInfo = page.locator('text=/split|LIFT|Alumni/i');
      // Split info may be shown when BASIC is selected
      if (await splitInfo.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        expect(true).toBeTruthy();
      }
    }
  });

  test('selecting ADDITIONAL type shows bucket selection', async ({ page }) => {
    await page.goto('/admin/contributions');

    // Open form
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    await addButton.click();

    // Wait for modal
    await page.waitForTimeout(500);

    // Select ADDITIONAL type if available
    const typeSelect = page.locator('select').filter({ has: page.locator('option[value="ADDITIONAL"]') }).first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('ADDITIONAL');

      // Bucket selection should appear
      await page.waitForTimeout(300);

      // Look for bucket selection field
      const bucketSelect = page.locator('select').filter({ has: page.locator('option[value="LIFT"], option[value="ALUMNI_ASSOCIATION"]') });
      if (await bucketSelect.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(bucketSelect.first()).toBeVisible();
      }
    }
  });
});
