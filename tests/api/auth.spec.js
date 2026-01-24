import { test, expect } from '@playwright/test';
import { getAdminToken, getAlumniToken, assertAPIResponse } from '../utils/api.js';

test.describe('API: Authentication', () => {
  const apiBaseUrl = process.env.API_URL || 'http://localhost:4000/api';

  test.describe('POST /api/auth/login', () => {
    test('admin can login with valid credentials', async ({ request }) => {
      const email = process.env.TEST_ADMIN_EMAIL;
      const password = process.env.TEST_ADMIN_PASSWORD;

      if (!email || !password) {
        test.skip('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD not configured');
        return;
      }

      const response = await request.post(`${apiBaseUrl}/auth/login`, {
        data: { email, password },
      });

      const body = await assertAPIResponse(response, 200);

      // Verify response structure
      expect(body.data).toHaveProperty('token');
      expect(body.data).toHaveProperty('user');
      expect(body.data.user).toHaveProperty('id');
      expect(body.data.user).toHaveProperty('email', email);
      expect(body.data.user).toHaveProperty('role', 'ADMIN');
      expect(body.data.token).toBeTruthy();
    });

    test('alumni can login with valid credentials', async ({ request }) => {
      const email = process.env.TEST_ALUMNI_EMAIL;
      const password = process.env.TEST_ALUMNI_PASSWORD;

      if (!email || !password) {
        test.skip('TEST_ALUMNI_EMAIL and TEST_ALUMNI_PASSWORD not configured');
        return;
      }

      const response = await request.post(`${apiBaseUrl}/auth/login`, {
        data: { email, password },
      });

      const body = await assertAPIResponse(response, 200);

      // Verify response structure
      expect(body.data).toHaveProperty('token');
      expect(body.data).toHaveProperty('user');
      expect(body.data.user).toHaveProperty('role', 'ALUMNI');
    });

    test('login fails with invalid email', async ({ request }) => {
      const response = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty('error');
    });

    test('login fails with invalid password', async ({ request }) => {
      const email = process.env.TEST_ADMIN_EMAIL;

      if (!email) {
        test.skip('TEST_ADMIN_EMAIL not configured');
        return;
      }

      const response = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email,
          password: 'wrongpassword',
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty('error');
    });

    test('login fails with missing email', async ({ request }) => {
      const response = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          password: 'password123',
        },
      });

      expect(response.status()).toBe(400);
    });

    test('login fails with missing password', async ({ request }) => {
      const email = process.env.TEST_ADMIN_EMAIL;

      if (!email) {
        test.skip('TEST_ADMIN_EMAIL not configured');
        return;
      }

      const response = await request.post(`${apiBaseUrl}/auth/login`, {
        data: {
          email,
        },
      });

      expect(response.status()).toBe(400);
    });

    test('login fails with inactive user account', async ({ request }) => {
      // This test requires setting up an inactive user first
      // For now, we'll skip if no test user setup is available
      test.skip('Requires test database setup with inactive user');
    });
  });
});
