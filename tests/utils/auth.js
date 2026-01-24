/**
 * Authentication utilities for Playwright tests
 */

/**
 * Login as admin user
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} email - Admin email (defaults to TEST_ADMIN_EMAIL env var)
 * @param {string} password - Admin password (defaults to TEST_ADMIN_PASSWORD env var)
 */
export async function loginAsAdmin(page, email = null, password = null) {
  const adminEmail = email || process.env.TEST_ADMIN_EMAIL;
  const adminPassword = password || process.env.TEST_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Admin credentials not provided. Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables or pass credentials directly.'
    );
  }

  await page.goto('/login');
  await page.waitForSelector('input[type="email"], input[name="email"]');

  // Fill login form
  await page.fill('input[type="email"], input[name="email"]', adminEmail);
  await page.fill('input[type="password"], input[name="password"]', adminPassword);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation to admin dashboard
  await page.waitForURL(/\/admin/);
}

/**
 * Login as alumni user
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} email - Alumni email (defaults to TEST_ALUMNI_EMAIL env var)
 * @param {string} password - Alumni password (defaults to TEST_ALUMNI_PASSWORD env var)
 */
export async function loginAsAlumni(page, email = null, password = null) {
  const alumniEmail = email || process.env.TEST_ALUMNI_EMAIL;
  const alumniPassword = password || process.env.TEST_ALUMNI_PASSWORD;

  if (!alumniEmail || !alumniPassword) {
    throw new Error(
      'Alumni credentials not provided. Set TEST_ALUMNI_EMAIL and TEST_ALUMNI_PASSWORD environment variables or pass credentials directly.'
    );
  }

  await page.goto('/login');
  await page.waitForSelector('input[type="email"], input[name="email"]');

  // Fill login form
  await page.fill('input[type="email"], input[name="email"]', alumniEmail);
  await page.fill('input[type="password"], input[name="password"]', alumniPassword);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation to alumni dashboard
  await page.waitForURL(/\/alumni/);
}

/**
 * Logout the current user
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function logout(page) {
  // Look for logout button or link
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Log out"), a:has-text("Log out")');

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    // Wait for redirect to login or home page
    await page.waitForURL(/\/(login)?$/);
  } else {
    // Fallback: clear localStorage and navigate to login
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('/login');
  }
}

/**
 * Check if user is logged in
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<boolean>}
 */
export async function isLoggedIn(page) {
  const hasToken = await page.evaluate(() => {
    return localStorage.getItem('token') !== null || localStorage.getItem('user') !== null;
  });
  return hasToken;
}

/**
 * Get current user from localStorage
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser(page) {
  const user = await page.evaluate(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });
  return user;
}
