/**
 * Database utilities for Playwright tests
 * Provides helpers for test data setup and cleanup
 */

import { PrismaClient } from '@prisma/client';

// Test Prisma client instance
let prisma = null;

/**
 * Get or create Prisma client for testing
 * @returns {PrismaClient}
 */
export function getTestPrismaClient() {
  if (!prisma) {
    // Check if we should use test database URL
    const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl,
        },
      },
    });
  }
  return prisma;
}

/**
 * Clean all test data from database
 * Use with caution - this deletes ALL data
 * @param {PrismaClient} client - Prisma client instance
 */
export async function cleanDatabase(client = null) {
  const prismaClient = client || getTestPrismaClient();

  // Delete in order to respect foreign key constraints
  await prismaClient.contribution.deleteMany({});
  await prismaClient.expense.deleteMany({});
  await prismaClient.announcement.deleteMany({});
  await prismaClient.user.deleteMany({});
}

/**
 * Create a test admin user
 * @param {object} data - User data
 * @returns {Promise<object>} Created user
 */
export async function createTestAdmin(data = {}) {
  const prismaClient = getTestPrismaClient();

  const { hashPassword } = await import('../../backend/src/utils/auth.js');

  const defaultData = {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'testpassword123',
    role: 'ADMIN',
    active: true,
  };

  const userData = { ...defaultData, ...data };
  const passwordHash = hashPassword(userData.password);

  return prismaClient.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      passwordHash,
      role: userData.role,
      active: userData.active,
    },
  });
}

/**
 * Create a test alumni user
 * @param {object} data - User data
 * @returns {Promise<object>} Created user
 */
export async function createTestAlumni(data = {}) {
  const prismaClient = getTestPrismaClient();

  const { hashPassword } = await import('../../backend/src/utils/auth.js');

  const defaultData = {
    name: 'Test Alumni',
    email: 'alumni@test.com',
    password: 'testpassword123',
    role: 'ALUMNI',
    active: true,
  };

  const userData = { ...defaultData, ...data };
  const passwordHash = hashPassword(userData.password);

  return prismaClient.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      passwordHash,
      role: userData.role,
      active: userData.active,
    },
  });
}

/**
 * Create a test contribution
 * @param {object} data - Contribution data
 * @returns {Promise<object>} Created contribution
 */
export async function createTestContribution(data = {}) {
  const prismaClient = getTestPrismaClient();

  const defaultData = {
    type: 'BASIC',
    amount: 1000,
    paymentMethod: 'CASH',
    paymentDate: new Date(),
    status: 'PENDING',
    notes: 'Test contribution',
  };

  const contributionData = { ...defaultData, ...data };

  return prismaClient.contribution.create({
    data: contributionData,
  });
}

/**
 * Create a test expense
 * @param {object} data - Expense data
 * @returns {Promise<object>} Created expense
 */
export async function createTestExpense(data = {}) {
  const prismaClient = getTestPrismaClient();

  const defaultData = {
    amount: 500,
    category: 'ADMINISTRATIVE',
    purpose: 'Test expense',
    event: null,
    expenseDate: new Date(),
    notes: 'Test expense notes',
  };

  const expenseData = { ...defaultData, ...data };

  return prismaClient.expense.create({
    data: expenseData,
  });
}

/**
 * Create a test announcement
 * @param {object} data - Announcement data
 * @returns {Promise<object>} Created announcement
 */
export async function createTestAnnouncement(data = {}) {
  const prismaClient = getTestPrismaClient();

  const defaultData = {
    title: 'Test Announcement',
    content: 'This is a test announcement',
    active: true,
  };

  const announcementData = { ...defaultData, ...data };

  return prismaClient.announcement.create({
    data: announcementData,
  });
}

/**
 * Setup test data for a complete test scenario
 * Creates admin, alumni users, and sample data
 * @returns {Promise<object>} Created test data
 */
export async function setupTestScenario() {
  const prismaClient = getTestPrismaClient();

  // Clean existing data
  await cleanDatabase(prismaClient);

  // Create test users
  const admin = await createTestAdmin({
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
  });

  const alumni = await createTestAlumni({
    email: process.env.TEST_ALUMNI_EMAIL || 'alumni@test.com',
  });

  // Create sample contributions
  const pendingContribution = await createTestContribution({
    userId: admin.id,
    type: 'BASIC',
    amount: 1000,
    status: 'PENDING',
  });

  const approvedContribution = await createTestContribution({
    userId: alumni.id,
    type: 'ADDITIONAL',
    amount: 500,
    bucket: 'SPECIAL_PROJECT',
    status: 'APPROVED',
  });

  // Create sample expense
  const expense = await createTestExpense({
    amount: 250,
    category: 'ADMINISTRATIVE',
  });

  // Create announcement
  const announcement = await createTestAnnouncement({
    title: 'Welcome to LIFT',
    content: 'This is a test announcement for the LIFT platform',
  });

  return {
    admin,
    alumni,
    pendingContribution,
    approvedContribution,
    expense,
    announcement,
  };
}

/**
 * Disconnect Prisma client
 * Call this in test teardown or global teardown
 */
export async function disconnectTestDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Get database statistics (useful for test assertions)
 * @returns {Promise<object>} Database stats
 */
export async function getDatabaseStats() {
  const prismaClient = getTestPrismaClient();

  const [userCount, contributionCount, expenseCount, announcementCount] = await Promise.all([
    prismaClient.user.count(),
    prismaClient.contribution.count(),
    prismaClient.expense.count(),
    prismaClient.announcement.count(),
  ]);

  return {
    users: userCount,
    contributions: contributionCount,
    expenses: expenseCount,
    announcements: announcementCount,
  };
}
