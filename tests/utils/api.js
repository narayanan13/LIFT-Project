/**
 * API utility functions for Playwright API testing
 * Provides helpers for making authenticated API requests
 */

/**
 * Get authentication token for admin user
 * @param {import('@playwright/test').APIRequestContext} request - Playwright API request context
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<string>} JWT token
 */
export async function getAdminToken(request, email, password) {
  const apiBaseUrl = process.env.API_URL || 'http://localhost:4000/api';

  const response = await request.post(`${apiBaseUrl}/auth/login`, {
    data: {
      email,
      password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to get admin token: ${response.status()}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Get authentication token for alumni user
 * @param {import('@playwright/test').APIRequestContext} request - Playwright API request context
 * @param {string} email - Alumni email
 * @param {string} password - Alumni password
 * @returns {Promise<string>} JWT token
 */
export async function getAlumniToken(request, email, password) {
  const apiBaseUrl = process.env.API_URL || 'http://localhost:4000/api';

  const response = await request.post(`${apiBaseUrl}/auth/login`, {
    data: {
      email,
      password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to get alumni token: ${response.status()}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Create an authenticated API request helper
 * @param {import('@playwright/test').APIRequestContext} request - Playwright API request context
 * @param {string} token - JWT token
 * @returns {object} API helper with methods for common requests
 */
export function createAuthenticatedAPI(request, token) {
  const apiBaseUrl = process.env.API_URL || 'http://localhost:4000/api';

  return {
    /**
     * Make a GET request with auth header
     * @param {string} endpoint - API endpoint (e.g., '/admin/users')
     * @param {object} options - Additional fetch options
     */
    async get(endpoint, options = {}) {
      return request.get(`${apiBaseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });
    },

    /**
     * Make a POST request with auth header
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body data
     * @param {object} options - Additional fetch options
     */
    async post(endpoint, data, options = {}) {
      return request.post(`${apiBaseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        data,
        ...options,
      });
    },

    /**
     * Make a PUT request with auth header
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body data
     * @param {object} options - Additional fetch options
     */
    async put(endpoint, data, options = {}) {
      return request.put(`${apiBaseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        data,
        ...options,
      });
    },

    /**
     * Make a PATCH request with auth header
     * @param {string} endpoint - API endpoint
     * @param {object} data - Request body data
     * @param {object} options - Additional fetch options
     */
    async patch(endpoint, data, options = {}) {
      return request.patch(`${apiBaseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        data,
        ...options,
      });
    },

    /**
     * Make a DELETE request with auth header
     * @param {string} endpoint - API endpoint
     * @param {object} options - Additional fetch options
     */
    async delete(endpoint, options = {}) {
      return request.delete(`${apiBaseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });
    },
  };
}

/**
 * Create an authenticated admin API client
 * @param {import('@playwright/test').APIRequestContext} request - Playwright API request context
 * @returns {Promise<object>} Admin API helper
 */
export async function createAdminAPI(request) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be set');
  }

  const token = await getAdminToken(request, email, password);
  return createAuthenticatedAPI(request, token);
}

/**
 * Create an authenticated alumni API client
 * @param {import('@playwright/test').APIRequestContext} request - Playwright API request context
 * @returns {Promise<object>} Alumni API helper
 */
export async function createAlumniAPI(request) {
  const email = process.env.TEST_ALUMNI_EMAIL;
  const password = process.env.TEST_ALUMNI_PASSWORD;

  if (!email || !password) {
    throw new Error('TEST_ALUMNI_EMAIL and TEST_ALUMNI_PASSWORD must be set');
  }

  const token = await getAlumniToken(request, email, password);
  return createAuthenticatedAPI(request, token);
}

/**
 * Assert API response has expected status and structure
 * @param {import('@playwright/test').APIResponse} response - API response
 * @param {number} expectedStatus - Expected HTTP status
 * @param {object} options - Additional assertions
 */
export async function assertAPIResponse(response, expectedStatus, options = {}) {
  const { hasData = true, hasMessage = false } = options;

  // Check status
  expect(response.status()).toBe(expectedStatus);

  // Parse body
  const body = await response.json();

  // Check for data property if expected
  if (hasData) {
    expect(body).toHaveProperty('data');
  }

  // Check for message property if expected
  if (hasMessage) {
    expect(body).toHaveProperty('message');
  }

  return body;
}
