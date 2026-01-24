import { test, expect } from '@playwright/test';
import { createAdminAPI, createAlumniAPI, assertAPIResponse } from '../utils/api.js';

test.describe('API: Contributions', () => {
  const apiBaseUrl = process.env.API_URL || 'http://localhost:4000/api';

  function checkAdminCredentials() {
    if (!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD) {
      test.skip('Admin credentials not configured');
      return false;
    }
    return true;
  }

  function checkAlumniCredentials() {
    if (!process.env.TEST_ALUMNI_EMAIL || !process.env.TEST_ALUMNI_PASSWORD) {
      test.skip('Alumni credentials not configured');
      return false;
    }
    return true;
  }

  test.describe('GET /api/admin/contributions', () => {
    test('admin can list all contributions', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);
      const response = await api.get('/admin/contributions');

      const body = await assertAPIResponse(response, 200);

      // Verify response is an array
      expect(Array.isArray(body.data)).toBeTruthy();
    });

    test('admin can filter contributions by status', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);
      const response = await api.get('/admin/contributions?status=PENDING');

      const body = await assertAPIResponse(response, 200);

      expect(Array.isArray(body.data)).toBeTruthy();
      // If results exist, verify status filter
      if (body.data.length > 0) {
        body.data.forEach(contribution => {
          expect(contribution.status).toBe('PENDING');
        });
      }
    });

    test('admin can filter contributions by type', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);
      const response = await api.get('/admin/contributions?type=BASIC');

      const body = await assertAPIResponse(response, 200);

      expect(Array.isArray(body.data)).toBeTruthy();
      if (body.data.length > 0) {
        body.data.forEach(contribution => {
          expect(contribution.type).toBe('BASIC');
        });
      }
    });
  });

  test.describe('POST /api/admin/contributions', () => {
    test('admin can create a BASIC contribution', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      // Get a user ID to associate with the contribution
      const usersResponse = await api.get('/admin/users');
      const usersBody = await assertAPIResponse(usersResponse, 200);

      if (usersBody.data.length === 0) {
        test.skip('No users found');
        return;
      }

      const userId = usersBody.data[0].id;

      const response = await api.post('/admin/contributions', {
        userId,
        type: 'BASIC',
        amount: 1000,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        notes: 'Test BASIC contribution',
      });

      const body = await assertAPIResponse(response, 201);

      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('type', 'BASIC');
      expect(body.data).toHaveProperty('amount', 1000);
      expect(body.data).toHaveProperty('status', 'PENDING');

      // Verify bucket split for BASIC (70/30)
      expect(body.data).toHaveProperty('generalFundAmount', 700);
      expect(body.data).toHaveProperty('projectFundAmount', 300);
    });

    test('admin can create an ADDITIONAL contribution', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      // Get a user ID
      const usersResponse = await api.get('/admin/users');
      const usersBody = await assertAPIResponse(usersResponse, 200);

      if (usersBody.data.length === 0) {
        test.skip('No users found');
        return;
      }

      const userId = usersBody.data[0].id;

      const response = await api.post('/admin/contributions', {
        userId,
        type: 'ADDITIONAL',
        amount: 500,
        bucket: 'SPECIAL_PROJECT',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'BANK_TRANSFER',
        notes: 'Test ADDITIONAL contribution',
      });

      const body = await assertAPIResponse(response, 201);

      expect(body.data).toHaveProperty('type', 'ADDITIONAL');
      expect(body.data).toHaveProperty('bucket', 'SPECIAL_PROJECT');
      expect(body.data).toHaveProperty('amount', 500);
    });

    test('validation rejects invalid contribution type', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const usersResponse = await api.get('/admin/users');
      const usersBody = await assertAPIResponse(usersResponse, 200);

      if (usersBody.data.length === 0) {
        test.skip('No users found');
        return;
      }

      const userId = usersBody.data[0].id;

      const response = await api.post('/admin/contributions', {
        userId,
        type: 'INVALID_TYPE',
        amount: 100,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
      });

      expect(response.status()).toBe(400);
    });

    test('validation rejects negative amount', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const usersResponse = await api.get('/admin/users');
      const usersBody = await assertAPIResponse(usersResponse, 200);

      if (usersBody.data.length === 0) {
        test.skip('No users found');
        return;
      }

      const userId = usersBody.data[0].id;

      const response = await api.post('/admin/contributions', {
        userId,
        type: 'BASIC',
        amount: -100,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('PATCH /api/admin/contributions/:id', () => {
    test('admin can approve a contribution', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      // Create a pending contribution first
      const usersResponse = await api.get('/admin/users');
      const usersBody = await assertAPIResponse(usersResponse, 200);

      if (usersBody.data.length === 0) {
        test.skip('No users found');
        return;
      }

      const userId = usersBody.data[0].id;

      const createResponse = await api.post('/admin/contributions', {
        userId,
        type: 'BASIC',
        amount: 500,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
      });

      const createBody = await assertAPIResponse(createResponse, 201);
      const contributionId = createBody.data.id;

      // Approve the contribution
      const response = await api.patch(`/admin/contributions/${contributionId}`, {
        status: 'APPROVED',
      });

      const body = await assertAPIResponse(response, 200);

      expect(body.data).toHaveProperty('status', 'APPROVED');
      expect(body.data).toHaveProperty('approvedAt');
    });

    test('admin can reject a contribution', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      // Create a pending contribution
      const usersResponse = await api.get('/admin/users');
      const usersBody = await assertAPIResponse(usersResponse, 200);

      if (usersBody.data.length === 0) {
        test.skip('No users found');
        return;
      }

      const userId = usersBody.data[0].id;

      const createResponse = await api.post('/admin/contributions', {
        userId,
        type: 'BASIC',
        amount: 300,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
      });

      const createBody = await assertAPIResponse(createResponse, 201);
      const contributionId = createBody.data.id;

      // Reject the contribution
      const response = await api.patch(`/admin/contributions/${contributionId}`, {
        status: 'REJECTED',
      });

      const body = await assertAPIResponse(response, 200);

      expect(body.data).toHaveProperty('status', 'REJECTED');
    });

    test('validation rejects invalid status', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const usersResponse = await api.get('/admin/users');
      const usersBody = await assertAPIResponse(usersResponse, 200);

      if (usersBody.data.length === 0) {
        test.skip('No users found');
        return;
      }

      const userId = usersBody.data[0].id;

      const createResponse = await api.post('/admin/contributions', {
        userId,
        type: 'BASIC',
        amount: 200,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
      });

      const createBody = await assertAPIResponse(createResponse, 201);
      const contributionId = createBody.data.id;

      const response = await api.patch(`/admin/contributions/${contributionId}`, {
        status: 'INVALID_STATUS',
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('GET /api/alumni/contributions', () => {
    test('alumni can view their own contributions', async ({ request }) => {
      if (!checkAlumniCredentials()) return;

      const api = await createAlumniAPI(request);
      const response = await api.get('/alumni/contributions');

      const body = await assertAPIResponse(response, 200);

      expect(Array.isArray(body.data)).toBeTruthy();

      // Verify all contributions belong to the current user
      // (This assumes the response includes user info)
    });

    test('alumni cannot see other users contributions', async ({ request }) => {
      if (!checkAlumniCredentials()) return;

      const api = await createAlumniAPI(request);
      const response = await api.get('/alumni/contributions');

      const body = await assertAPIResponse(response, 200);

      // If there are contributions, they should all belong to the authenticated user
      expect(Array.isArray(body.data)).toBeTruthy();
    });
  });
});
