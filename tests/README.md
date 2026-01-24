# LIFT Project Test Framework

Complete Playwright test framework for the LIFT Alumni Contribution Management System.

## Test Structure

```
tests/
├── api/                    # API-level tests
│   ├── auth.spec.js       # Authentication API tests
│   ├── users.spec.js      # User management API tests
│   ├── contributions.spec.js # Contribution API tests
│   └── expenses.spec.js   # Expense API tests
├── sanity/                # End-to-end (E2E) tests
│   ├── health.spec.js     # Health check tests
│   ├── auth.spec.js       # Authentication E2E tests
│   ├── admin-flow.spec.js # Admin navigation tests
│   ├── contribution.spec.js # Contribution management tests
│   ├── expense.spec.js    # Expense management tests
│   ├── announcement.spec.js # Announcement tests
│   ├── alumni-dashboard.spec.js # Alumni dashboard tests
│   └── reports.spec.js    # Reports tests
├── fixtures/              # Test data and fixtures
│   └── test-data.js       # Test data constants
└── utils/                 # Test utilities
    ├── auth.js            # Authentication helpers
    ├── api.js             # API request helpers
    └── database.js        # Database setup/teardown helpers
```

## Setup

### 1. Install Dependencies

```bash
# From project root
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Test Environment

Copy the example environment file and configure:

```bash
cp .env.test.example .env.test
```

Edit `.env.test` with your test credentials:

```env
API_URL=http://localhost:4000/api
APP_URL=http://localhost:3000
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=testpassword123
TEST_ALUMNI_EMAIL=alumni@test.com
TEST_ALUMNI_PASSWORD=testpassword123
```

### 3. Create Test Users

Create test users in your development database:

```bash
# Option 1: Using Node script
cd backend
node -e "
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('./src/utils/auth');
const prisma = new PrismaClient();

async function createTestUsers() {
  const adminHash = hashPassword('testpassword123');
  const alumniHash = hashPassword('testpassword123');

  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      name: 'Test Admin',
      email: 'admin@test.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      active: true
    }
  });

  await prisma.user.upsert({
    where: { email: 'alumni@test.com' },
    update: {},
    create: {
      name: 'Test Alumni',
      email: 'alumni@test.com',
      passwordHash: alumniHash,
      role: 'ALUMNI',
      active: true
    }
  });

  await prisma.\$disconnect();
  console.log('Test users created!');
}

createTestUsers().catch(console.error);
"
```

Or use Prisma Studio:
```bash
cd backend
npx prisma studio
# Navigate to User table and create users manually
```

### 4. Install Playwright Browsers

```bash
npx playwright install --with-deps chromium
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Files

```bash
# Run only sanity tests
npm run test:sanity

# Run specific test file
npx playwright test tests/sanity/auth.spec.js

# Run tests matching a pattern
npx playwright test --grep "Authentication"
```

### Run Tests in Different Modes

```bash
# Run tests with visible browser (headed mode)
npm run test:headed

# Run tests with Playwright UI
npm run test:ui

# Run tests and show report
npm run test:report
```

### Run Tests for Specific Browsers

```bash
# Run on Chromium (default)
npx playwright test --project=chromium

# Run on Firefox (add to playwright.config.js first)
npx playwright test --project=firefox
```

## Test Configuration

The `playwright.config.js` file configures:

- **Test Directory**: `./tests`
- **Base URL**: `http://localhost:3000` (configurable via `APP_URL`)
- **Web Servers**: Automatically starts backend and frontend servers
- **Browser**: Chromium (can add Firefox, WebKit)
- **Timeouts**: 30s test timeout, 5s assertion timeout
- **Retries**: 2 retries on CI, 0 locally
- **Reporters**: HTML report (opens on failure locally)

## Writing Tests

### E2E Tests (Page-based)

```javascript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../utils/auth.js';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('does something', async ({ page }) => {
    await page.goto('/my-page');

    await expect(page.locator('h1')).toHaveText('My Page');
  });
});
```

### API Tests

```javascript
import { test, expect } from '@playwright/test';
import { createAdminAPI, assertAPIResponse } from '../utils/api.js';

test('API endpoint works', async ({ request }) => {
  const api = await createAdminAPI(request);

  const response = await api.get('/admin/users');
  const body = await assertAPIResponse(response, 200);

  expect(Array.isArray(body.data)).toBeTruthy();
});
```

### Using Test Data

```javascript
import { basicContribution, testExpense } from '../fixtures/test-data.js';

test('uses test data', async ({ page }) => {
  // Use predefined test data
  console.log(basicContribution.amount); // 1000
  console.log(testExpense.category); // ADMINISTRATIVE
});
```

### Database Helpers

```javascript
import { setupTestScenario, cleanDatabase } from '../utils/database.js';

test.beforeEach(async () => {
  // Setup fresh test data
  await setupTestScenario();
});

test.afterEach(async () => {
  // Clean up test data
  await cleanDatabase();
});
```

## Best Practices

1. **Use test.skip() for conditional tests**: Skip tests when credentials aren't configured
2. **Don't rely on hardcoded IDs**: Use selectors that are resilient to changes
3. **Wait for elements**: Use `waitForSelector()` or `waitForTimeout()` when needed
4. **Clean up test data**: Use database helpers to clean up after tests
5. **Use page objects**: For complex pages, consider creating page object models
6. **Run tests locally first**: Before pushing, run tests locally to catch issues early

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

See `.github/workflows/tests.yml` for CI configuration.

## Troubleshooting

### Tests fail with "Server not starting"

Increase the timeout in `playwright.config.js`:

```javascript
webServer: [
  {
    command: 'cd backend && npm run dev',
    timeout: 180000, // Increase from 120000
  }
]
```

### Tests fail with "Test credentials not configured"

Make sure you've created `.env.test` and created the test users in the database.

### Tests timeout waiting for elements

- Increase the timeout: `await expect(locator).toBeVisible({ timeout: 10000 })`
- Or use `waitForTimeout`: `await page.waitForTimeout(1000)`

### Port already in use

Stop any running backend/frontend servers before running tests, or enable `reuseExistingServer` in the config.

## Adding New Tests

1. Create a new `.spec.js` file in the appropriate directory
2. Import necessary utilities from `utils/` and fixtures from `fixtures/`
3. Write tests using the patterns shown in existing test files
4. Run tests locally to verify they work
5. Commit and push

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
