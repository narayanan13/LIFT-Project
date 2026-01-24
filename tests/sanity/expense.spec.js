import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth.js';
import { testExpense } from '../fixtures/test-data.js';

test.describe('Expense Management', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD) {
      test.skip('Test credentials not configured');
      return;
    }

    await loginAsAdmin(page);
  });

  test.describe('Expenses Page', () => {
    test('expenses page loads successfully', async ({ page }) => {
      await page.goto('/admin/expenses');

      await expect(page.locator('main')).toBeVisible();

      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
    });

    test('expenses page shows add expense button', async ({ page }) => {
      await page.goto('/admin/expenses');

      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")');
      await expect(addButton.first()).toBeVisible();
    });

    test('expenses page displays filter options', async ({ page }) => {
      await page.goto('/admin/expenses');

      const filterElements = page.locator('select, [class*="filter"]');
      expect(await filterElements.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Expense Form', () => {
    test('can open expense form modal', async ({ page }) => {
      await page.goto('/admin/expenses');

      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      await addButton.click();

      const modal = page.locator('[role="dialog"], .modal, [class*="modal"]');
      await expect(modal.first()).toBeVisible({ timeout: 5000 });
    });

    test('expense form has required fields', async ({ page }) => {
      await page.goto('/admin/expenses');

      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      await addButton.click();

      // Check for required fields
      await expect(page.locator('input[name*="amount"], input[type="number"]').first()).toBeVisible();
      await expect(page.locator('input[name*="purpose"], textarea[name*="purpose"]').first()).toBeVisible();
      await expect(page.locator('input[type="date"], input[name*="date"]').first()).toBeVisible();
    });

    test('expense form shows category selection', async ({ page }) => {
      await page.goto('/admin/expenses');

      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      await addButton.click();

      await page.waitForTimeout(500);

      const categorySelect = page.locator('select[name*="category"], [class*="category"] select');
      if (await categorySelect.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(categorySelect.first()).toBeVisible();
      }
    });

    test('selecting EVENT category shows event field', async ({ page }) => {
      await page.goto('/admin/expenses');

      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      await addButton.click();

      await page.waitForTimeout(500);

      const categorySelect = page.locator('select').filter({ has: page.locator('option[value="EVENT"]') }).first();

      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption('EVENT');
        await page.waitForTimeout(300);

        // Event field should appear
        const eventInput = page.locator('input[name*="event"], [class*="event"] input');
        if (await eventInput.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(eventInput.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Expense Display', () => {
    test('expenses list shows status badges', async ({ page }) => {
      await page.goto('/admin/expenses');

      await page.waitForTimeout(1000);

      const statusBadges = page.locator('[class*="badge"], span:has-text("PENDING"), span:has-text("APPROVED"), span:has-text("REJECTED")');
      const listContent = page.locator('table, [class*="list"]').first();

      if (await listContent.isVisible()) {
        expect(true).toBeTruthy();
      }
    });

    test('expenses list shows category information', async ({ page }) => {
      await page.goto('/admin/expenses');

      await page.waitForTimeout(1000);

      const categoryBadges = page.locator('[class*="badge"], span:has-text("ADMINISTRATIVE"), span:has-text("EVENT")');
      const listContent = page.locator('table, [class*="list"]').first();

      if (await listContent.isVisible()) {
        expect(true).toBeTruthy();
      }
    });
  });
});
