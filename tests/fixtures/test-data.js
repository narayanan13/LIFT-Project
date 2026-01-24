/**
 * Test data fixtures for Playwright tests
 *
 * Note: Test credentials should be set via environment variables.
 * See .env.test.example for required variables.
 */

/**
 * Test admin credentials from environment variables
 */
export const adminCredentials = {
  get email() {
    return process.env.TEST_ADMIN_EMAIL || 'admin@test.com';
  },
  get password() {
    return process.env.TEST_ADMIN_PASSWORD || 'testpassword123';
  },
};

/**
 * Test alumni credentials from environment variables
 */
export const alumniCredentials = {
  get email() {
    return process.env.TEST_ALUMNI_EMAIL || 'alumni@test.com';
  },
  get password() {
    return process.env.TEST_ALUMNI_PASSWORD || 'testpassword123';
  },
};

/**
 * API endpoints
 */
export const apiEndpoints = {
  baseUrl: process.env.API_URL || 'http://localhost:4000/api',
  health: '/api/health',
  login: '/api/auth/login',
  admin: {
    users: '/api/admin/users',
    contributions: '/api/admin/contributions',
    expenses: '/api/admin/expenses',
    announcements: '/api/admin/announcements',
    reports: '/api/admin/reports',
  },
  alumni: {
    contributions: '/api/alumni/contributions',
    announcements: '/api/alumni/announcements',
    reports: '/api/alumni/reports',
  },
};

/**
 * Test contribution data for BASIC type
 * BASIC contributions are automatically split: 70% General Fund, 30% Project Fund
 */
export const basicContribution = {
  type: 'BASIC',
  amount: 1000,
  paymentDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  paymentMethod: 'CASH',
  notes: 'Test basic contribution',
  // Expected split calculation
  expectedGeneralFundAmount: 700, // 70% of 1000
  expectedProjectFundAmount: 300, // 30% of 1000
};

/**
 * Test contribution data for ADDITIONAL type with bucket selection
 * ADDITIONAL contributions can specify a target bucket
 */
export const additionalContribution = {
  type: 'ADDITIONAL',
  amount: 500,
  bucket: 'SPECIAL_PROJECT', // Can be: GENERAL_FUND, PROJECT_FUND, SPECIAL_PROJECT
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'BANK_TRANSFER',
  notes: 'Test additional contribution for special project',
};

/**
 * Test expense data
 */
export const testExpense = {
  amount: 250,
  category: 'ADMINISTRATIVE',
  purpose: 'Test expense for office supplies',
  event: '',
  expenseDate: new Date().toISOString().split('T')[0],
  notes: 'Test expense entry',
};

/**
 * Test announcement data
 */
export const testAnnouncement = {
  title: 'Test Announcement',
  content: 'This is a test announcement for Playwright tests.',
};

/**
 * Page URLs
 */
export const pageUrls = {
  home: '/',
  login: '/login',
  admin: {
    overview: '/admin/overview',
    users: '/admin/users',
    contributions: '/admin/contributions',
    expenses: '/admin/expenses',
    announcements: '/admin/announcements',
    reports: '/admin/reports',
    settings: '/admin/settings',
    meetings: '/admin/meetings',
    events: '/admin/events',
  },
  alumni: {
    dashboard: '/alumni/dashboard',
    contributions: '/alumni/contributions',
    announcements: '/alumni/announcements',
  },
};
