import { test, expect } from '@playwright/test';
import { createAdminAPI, createAlumniAPI, assertAPIResponse } from '../utils/api.js';

test.describe('API: Users', () => {
  const apiBaseUrl = process.env.API_URL || 'http://localhost:4000/api';

  // Helper to check if test credentials are configured
  function checkCredentials() {
    if (!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD) {
      test.skip('Admin credentials not configured');
      return false;
    }
    return true;
  }

  test.describe('GET /api/admin/users', () => {
    test('admin can list all users', async ({ request }) => {
      if (!checkCredentials()) return;

      const api = await createAdminAPI(request);
      const response = await api.get('/admin/users');

      const body = await assertAPIResponse(response, 200);

      // Verify response is an array
      expect(Array.isArray(body.data)).toBeTruthy();
    });

    test('alumni cannot access admin users endpoint', async ({ request }) => {
      if (!process.env.TEST_ALUMNI_EMAIL || !process.env.TEST_ALUMNI_PASSWORD) {
        test.skip('Alumni credentials not configured');
        return;
      }

      const api = await createAlumniAPI(request);
      const response = await api.get('/admin/users');

      // Should be forbidden
      expect(response.status()).toBe(403);
    });

    test('unauthenticated request is rejected', async ({ request }) => {
      const response = await request.get(`${apiBaseUrl}/admin/users`);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/admin/users', () => {
    test('admin can create a new alumni user', async ({ request }) => {
      if (!checkCredentials()) return;

      const api = await createAdminAPI(request);

      // Generate unique email for this test
      const uniqueEmail = `test-${Date.now()}@example.com`;

      const response = await api.post('/admin/users', {
        name: 'Test Alumni User',
        email: uniqueEmail,
        password: 'testPassword123!',
        role: 'ALUMNI',
      });

      const body = await assertAPIResponse(response, 201);

      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('email', uniqueEmail);
      expect(body.data).toHaveProperty('role', 'ALUMNI');
      expect(body.data).not.toHaveProperty('password'); // Password should not be exposed
    });

    test('admin can create a new admin user', async ({ request }) => {
      if (!checkCredentials()) return;

      const api = await createAdminAPI(request);

      const uniqueEmail = `admin-${Date.now()}@example.com`;

      const response = await api.post('/admin/users', {
        name: 'Test Admin User',
        email: uniqueEmail,
        password: 'adminPassword123!',
        role: 'ADMIN',
      });

      const body = await assertAPIResponse(response, 201);

      expect(body.data).toHaveProperty('role', 'ADMIN');
    });

    test('validation rejects duplicate email', async ({ request }) => {
      if (!checkCredentials()) return;

      const api = await createAdminAPI(request);

      // Use existing admin email (should fail)
      const response = await api.post('/admin/users', {
        name: 'Duplicate User',
        email: process.env.TEST_ADMIN_EMAIL,
        password: 'password123',
        role: 'ALUMNI',
      });

      // Should return validation error
      expect(response.status()).toBe(400);
    });

    test('validation rejects invalid role', async ({ request }) => {
      if (!checkCredentials()) return;

      const api = await createAdminAPI(request);

      const response = await api.post('/admin/users', {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        role: 'INVALID_ROLE',
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /api/admin/users/:id', () => {
    test('admin can get user by ID', async ({ request }) => {
      if (!checkCredentials()) return;

      const api = await createAdminAPI(request);

      // First, get the list of users to find an ID
      const listResponse = await api.get('/admin/users');
      const listBody = await assertAPIResponse(listResponse, 200);

      if (listBody.data.length === 0) {
        test.skip('No users found in database');
        return;
      }

      const userId = listBody.data[0].id;

      // Get specific user
      const response = await api.get(`/admin/users/${userId}`);

      const body = await assertAPIResponse(response, 200);

      expect(body.data).toHaveProperty('id', userId);
    });

    test('returns 404 for non-existent user', async ({ request }) => {
      if (!checkCredentials()) return;

      const api = await createAdminAPI(request);

      const fakeId = 'clx0000000000000000000000'; // Invalid CUID format

      const response = await api.get(`/admin/users/${fakeId}`);

      expect(response.status()).toBe(404);
    });
  });

  test.describe('PATCH /api/admin/users/:id', () => {
    test('admin can update user information', async ({ request }) => {
      if (!checkCredentials()) return;

      const api = await createAdminAPI(request);

      // Get a user to update
      const listResponse = await api.get('/admin/users');
      const listBody = await assertAPIResponse(listResponse, 200);

      if (listBody.data.length === 0) {
        test.skip('No users found in database');
        return;
      }

      const userId = listBody.data[0].id;
      const originalName = listBody.data[0].name;

      // Update the user
      const response = await api.patch(`/admin/users/${userId}`, {
        name: `Updated ${originalName}`,
      });

      const body = await assertAPIResponse(response, 200);

      expect(body.data).toHaveProperty('id', userId);
      expect(body.data.name).toContain('Updated');
    });

    test('admin can deactivate user', async ({ request }) => {
      if (!checkCredentials()) return;

      const api = await createAdminAPI(request);

      // First create a user to deactivate
      const createResponse = await api.post('/admin/users', {
        name: 'User To Deactivate',
        email: `deactivate-${Date.now()}@example.com`,
        password: 'password123',
        role: 'ALUMNI',
      });

      const createBody = await assertAPIResponse(createResponse, 201);
      const userId = createBody.data.id;

      // Deactivate the user
      const response = await api.patch(`/admin/users/${userId}`, {
        active: false,
      });

      const body = await assertAPIResponse(response, 200);

      expect(body.data).toHaveProperty('active', false);
    });
  });
});
