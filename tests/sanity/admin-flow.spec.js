import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth.js';
import { pageUrls } from '../fixtures/test-data.js';

test.describe('Admin Dashboard Navigation', () => {
  // Before each test, login as admin
  test.beforeEach(async ({ page }) => {
    // Skip all tests in this describe block if no credentials
    if (!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD) {
      test.skip('Test credentials not configured');
      return;
    }

    await loginAsAdmin(page);
  });

  test('admin can view dashboard overview', async ({ page }) => {
    // Navigate to overview if not already there
    await page.goto('/admin/overview');

    // Verify we're on the overview page
    expect(page.url()).toContain('/admin/overview');

    // Check for dashboard elements (stats, charts, etc.)
    // The overview page should have some content visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Look for typical dashboard elements
    const dashboardContent = page.locator('h1, h2, .card, [class*="stat"], [class*="overview"]').first();
    await expect(dashboardContent).toBeVisible({ timeout: 10000 });
  });

  test('admin can navigate to users page', async ({ page }) => {
    // Click on Users nav link
    const usersLink = page.locator('nav a:has-text("Users"), nav li:has-text("Users") a');
    await expect(usersLink).toBeVisible();
    await usersLink.click();

    // Verify navigation
    await page.waitForURL(/\/admin\/users/);
    expect(page.url()).toContain('/admin/users');

    // Verify users page content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('admin can navigate to contributions page', async ({ page }) => {
    // Click on Contributions nav link
    const contributionsLink = page.locator('nav a:has-text("Contributions"), nav li:has-text("Contributions") a');
    await expect(contributionsLink).toBeVisible();
    await contributionsLink.click();

    // Verify navigation
    await page.waitForURL(/\/admin\/contributions/);
    expect(page.url()).toContain('/admin/contributions');

    // Verify contributions page content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('admin can navigate to expenses page', async ({ page }) => {
    // Click on Expenses nav link
    const expensesLink = page.locator('nav a:has-text("Expenses"), nav li:has-text("Expenses") a');
    await expect(expensesLink).toBeVisible();
    await expensesLink.click();

    // Verify navigation
    await page.waitForURL(/\/admin\/expenses/);
    expect(page.url()).toContain('/admin/expenses');

    // Verify expenses page content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('admin can navigate to meetings page', async ({ page }) => {
    // Click on Meetings nav link
    const meetingsLink = page.locator('nav a:has-text("Meetings"), nav li:has-text("Meetings") a');
    await expect(meetingsLink).toBeVisible();
    await meetingsLink.click();

    // Verify navigation
    await page.waitForURL(/\/admin\/meetings/);
    expect(page.url()).toContain('/admin/meetings');

    // Verify meetings page content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('admin can navigate to events page', async ({ page }) => {
    // Click on Events nav link
    const eventsLink = page.locator('nav a:has-text("Events"), nav li:has-text("Events") a');
    await expect(eventsLink).toBeVisible();
    await eventsLink.click();

    // Verify navigation
    await page.waitForURL(/\/admin\/events/);
    expect(page.url()).toContain('/admin/events');

    // Verify events page content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('admin can navigate to alumni directory page', async ({ page }) => {
    // Click on Alumni Directory nav link
    const directoryLink = page.locator('nav a:has-text("Alumni Directory"), nav li:has-text("Alumni Directory") a');
    await expect(directoryLink).toBeVisible();
    await directoryLink.click();

    // Verify navigation
    await page.waitForURL(/\/admin\/directory/);
    expect(page.url()).toContain('/admin/directory');

    // Verify directory page content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('admin sidebar shows all navigation links', async ({ page }) => {
    await page.goto('/admin/overview');

    // Check for all expected navigation links
    const expectedLinks = [
      'Overview',
      'Users',
      'Alumni Directory',
      'Contributions',
      'Events',
      'Expenses',
      'Meetings',
      'Change Password',
    ];

    for (const linkText of expectedLinks) {
      const link = page.locator(`nav a:has-text("${linkText}"), nav li:has-text("${linkText}")`);
      await expect(link).toBeVisible();
    }
  });

  test('admin header shows user welcome message', async ({ page }) => {
    await page.goto('/admin/overview');

    // Look for welcome message in header
    const welcomeText = page.locator('header:has-text("Welcome")');
    await expect(welcomeText).toBeVisible();
  });

  test('admin can see logout button', async ({ page }) => {
    await page.goto('/admin/overview');

    // Look for logout button
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();
  });
});
