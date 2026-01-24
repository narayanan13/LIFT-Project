/**
 * Global test teardown for Playwright tests
 * Runs once after all tests
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🏁 All tests completed!');

  // You can add global teardown logic here, such as:
  // - Stopping test databases
  // - Cleaning up test data
  // - Closing resources

  // Example: Disconnect from test database if using database helpers
  // await disconnectTestDatabase();
}

export default globalTeardown;
