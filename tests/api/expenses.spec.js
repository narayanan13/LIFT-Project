import { test, expect } from '@playwright/test';
import { createAdminAPI, assertAPIResponse } from '../utils/api.js';

test.describe('API: Expenses', () => {
  const apiBaseUrl = process.env.API_URL || 'http://localhost:4000/api';

  function checkAdminCredentials() {
    if (!process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD) {
      test.skip('Admin credentials not configured');
      return false;
    }
    return true;
  }

  test.describe('GET /api/admin/expenses', () => {
    test('admin can list all expenses', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);
      const response = await api.get('/admin/expenses');

      const body = await assertAPIResponse(response, 200);

      expect(Array.isArray(body.data)).toBeTruthy();
    });

    test('admin can filter expenses by category', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);
      const response = await api.get('/admin/expenses?category=ADMINISTRATIVE');

      const body = await assertAPIResponse(response, 200);

      expect(Array.isArray(body.data)).toBeTruthy();
      if (body.data.length > 0) {
        body.data.forEach(expense => {
          expect(expense.category).toBe('ADMINISTRATIVE');
        });
      }
    });

    test('admin can filter expenses by date range', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/admin/expenses?startDate=${today}&endDate=${today}`);

      const body = await assertAPIResponse(response, 200);

      expect(Array.isArray(body.data)).toBeTruthy();
    });
  });

  test.describe('POST /api/admin/expenses', () => {
    test('admin can create an expense', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const response = await api.post('/admin/expenses', {
        amount: 250.50,
        category: 'ADMINISTRATIVE',
        purpose: 'Office supplies for testing',
        event: null,
        expenseDate: new Date().toISOString().split('T')[0],
        notes: 'Test expense',
      });

      const body = await assertAPIResponse(response, 201);

      expect(body.data).toHaveProperty('id');
      expect(body.data).toHaveProperty('amount', 250.50);
      expect(body.data).toHaveProperty('category', 'ADMINISTRATIVE');
      expect(body.data).toHaveProperty('purpose', 'Office supplies for testing');
      expect(body.data).toHaveProperty('status', 'PENDING');
    });

    test('admin can create an event expense', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const response = await api.post('/admin/expenses', {
        amount: 500,
        category: 'EVENT',
        purpose: 'Test event expense',
        event: 'Annual Meeting 2024',
        expenseDate: new Date().toISOString().split('T')[0],
        notes: 'Event related expense',
      });

      const body = await assertAPIResponse(response, 201);

      expect(body.data).toHaveProperty('category', 'EVENT');
      expect(body.data).toHaveProperty('event', 'Annual Meeting 2024');
    });

    test('validation rejects invalid category', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const response = await api.post('/admin/expenses', {
        amount: 100,
        category: 'INVALID_CATEGORY',
        purpose: 'Test',
        expenseDate: new Date().toISOString().split('T')[0],
      });

      expect(response.status()).toBe(400);
    });

    test('validation rejects negative amount', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const response = await api.post('/admin/expenses', {
        amount: -50,
        category: 'ADMINISTRATIVE',
        purpose: 'Test',
        expenseDate: new Date().toISOString().split('T')[0],
      });

      expect(response.status()).toBe(400);
    });

    test('validation requires purpose field', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const response = await api.post('/admin/expenses', {
        amount: 100,
        category: 'ADMINISTRATIVE',
        expenseDate: new Date().toISOString().split('T')[0],
      });

      expect(response.status()).toBe(400);
    });

    test('event category requires event field', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const response = await api.post('/admin/expenses', {
        amount: 100,
        category: 'EVENT',
        purpose: 'Test event',
        expenseDate: new Date().toISOString().split('T')[0],
      });

      // Should require event field when category is EVENT
      expect(response.status()).toBe(400);
    });
  });

  test.describe('PATCH /api/admin/expenses/:id', () => {
    test('admin can approve an expense', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      // Create a pending expense first
      const createResponse = await api.post('/admin/expenses', {
        amount: 150,
        category: 'ADMINISTRATIVE',
        purpose: 'Test expense for approval',
        expenseDate: new Date().toISOString().split('T')[0],
      });

      const createBody = await assertAPIResponse(createResponse, 201);
      const expenseId = createBody.data.id;

      // Approve the expense
      const response = await api.patch(`/admin/expenses/${expenseId}`, {
        status: 'APPROVED',
      });

      const body = await assertAPIResponse(response, 200);

      expect(body.data).toHaveProperty('status', 'APPROVED');
      expect(body.data).toHaveProperty('approvedAt');
    });

    test('admin can reject an expense', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const createResponse = await api.post('/admin/expenses', {
        amount: 75,
        category: 'PROGRAM',
        purpose: 'Test expense for rejection',
        expenseDate: new Date().toISOString().split('T')[0],
      });

      const createBody = await assertAPIResponse(createResponse, 201);
      const expenseId = createBody.data.id;

      const response = await api.patch(`/admin/expenses/${expenseId}`, {
        status: 'REJECTED',
      });

      const body = await assertAPIResponse(response, 200);

      expect(body.data).toHaveProperty('status', 'REJECTED');
    });

    test('admin can update expense details', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const createResponse = await api.post('/admin/expenses', {
        amount: 200,
        category: 'ADMINISTRATIVE',
        purpose: 'Original purpose',
        expenseDate: new Date().toISOString().split('T')[0],
      });

      const createBody = await assertAPIResponse(createResponse, 201);
      const expenseId = createBody.data.id;

      const response = await api.patch(`/admin/expenses/${expenseId}`, {
        amount: 250,
        purpose: 'Updated purpose',
      });

      const body = await assertAPIResponse(response, 200);

      expect(body.data).toHaveProperty('amount', 250);
      expect(body.data).toHaveProperty('purpose', 'Updated purpose');
    });
  });

  test.describe('DELETE /api/admin/expenses/:id', () => {
    test('admin can delete an expense', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const createResponse = await api.post('/admin/expenses', {
        amount: 100,
        category: 'ADMINISTRATIVE',
        purpose: 'Expense to delete',
        expenseDate: new Date().toISOString().split('T')[0],
      });

      const createBody = await assertAPIResponse(createResponse, 201);
      const expenseId = createBody.data.id;

      const deleteResponse = await api.delete(`/admin/expenses/${expenseId}`);

      expect(deleteResponse.status()).toBe(204);

      // Verify it's deleted
      const getResponse = await api.get(`/admin/expenses/${expenseId}`);
      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('GET /api/admin/expenses/:id', () => {
    test('admin can get a specific expense', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const createResponse = await api.post('/admin/expenses', {
        amount: 300,
        category: 'PROGRAM',
        purpose: 'Get specific expense test',
        expenseDate: new Date().toISOString().split('T')[0],
      });

      const createBody = await assertAPIResponse(createResponse, 201);
      const expenseId = createBody.data.id;

      const response = await api.get(`/admin/expenses/${expenseId}`);

      const body = await assertAPIResponse(response, 200);

      expect(body.data).toHaveProperty('id', expenseId);
      expect(body.data).toHaveProperty('amount', 300);
    });

    test('returns 404 for non-existent expense', async ({ request }) => {
      if (!checkAdminCredentials()) return;

      const api = await createAdminAPI(request);

      const fakeId = 'clx0000000000000000000000';

      const response = await api.get(`/admin/expenses/${fakeId}`);

      expect(response.status()).toBe(404);
    });
  });
});
