/**
 * Global test setup for Playwright tests
 * Runs once before all tests
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright tests...');
  console.log(`📁 Test directory: ${config.projects?.[0]?.testDir || './tests'}`);
  console.log(`🌐 Base URL: ${config.projects?.[0]?.use?.baseURL || 'http://localhost:3000'}`);

  // You can add global setup logic here, such as:
  // - Starting test databases
  // - Seeding initial test data
  // - Setting up test fixtures

  // Example: Check if test credentials are configured
  const adminEmail = process.env.TEST_ADMIN_EMAIL;
  const alumniEmail = process.env.TEST_ALUMNI_EMAIL;

  if (!adminEmail || !alumniEmail) {
    console.warn('⚠️  Test credentials not configured. Some tests may be skipped.');
    console.warn('   Set TEST_ADMIN_EMAIL and TEST_ALUMNI_EMAIL environment variables.');
  } else {
    console.log(`✅ Test credentials configured for ${adminEmail} and ${alumniEmail}`);
  }
}

export default globalSetup;
