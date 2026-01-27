import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authRequired middleware to all routes
router.use(authRequired);

// Overview stats endpoint - returns aggregated stats based on filters
// Works for both ADMIN and ALUMNI users
router.get('/overview', async (req, res) => {
  const { status, type, bucket, eventId, startDate, endDate } = req.query;
  const user = req.user;

  try {
    // Determine if user is admin or alumni
    const isAdmin = user.role === 'ADMIN';
    const isAlumni = user.role === 'ALUMNI';

    // Build contribution where clause
    const contribWhere = {};

    // Alumni can only see their own contributions
    if (isAlumni) {
      contribWhere.userId = user.id;
    }

    // Status filter
    if (status && status !== 'all') {
      contribWhere.status = status;
    } else if (!status) {
      contribWhere.status = 'APPROVED'; // Default to APPROVED
    }

    // Type filter
    if (type && type !== 'all') {
      contribWhere.type = type;
    }

    // Bucket filter
    if (bucket && bucket !== 'ALL') {
      contribWhere.bucket = bucket;
    }

    // Date range filter
    if (startDate || endDate) {
      contribWhere.date = {};
      if (startDate) contribWhere.date.gte = new Date(startDate);
      if (endDate) contribWhere.date.lte = new Date(endDate);
    }

    // Build expense where clause
    const expenseWhere = {};

    // Alumni can only see their own submitted expenses
    if (isAlumni) {
      expenseWhere.submittedBy = user.id;
    }

    // Status filter
    if (status && status !== 'all') {
      expenseWhere.status = status;
    } else if (!status) {
      expenseWhere.status = 'APPROVED'; // Default to APPROVED
    }

    // Bucket filter
    if (bucket && bucket !== 'ALL') {
      expenseWhere.bucket = bucket;
    }

    // Event filter
    if (eventId === 'none' || eventId === 'null') {
      expenseWhere.eventId = null;
    } else if (eventId && eventId !== 'all') {
      expenseWhere.eventId = eventId;
    }

    // Date range filter
    if (startDate || endDate) {
      expenseWhere.date = {};
      if (startDate) expenseWhere.date.gte = new Date(startDate);
      if (endDate) expenseWhere.date.lte = new Date(endDate);
    }

    // Calculate overall totals (filtered by bucket if specified)
    const totalContrib = await prisma.contribution.aggregate({
      where: contribWhere,
      _sum: { amount: true, liftAmount: true, aaAmount: true },
      _count: true
    });

    const totalExpenses = await prisma.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
      _count: true
    });

    // Calculate bucket-wise stats (always from all data, not filtered by bucket)
    // This ensures the bucket summary cards always show complete data
    const bucketContribWhere = {};
    if (isAlumni) {
      bucketContribWhere.userId = user.id;
    }
    if (status && status !== 'all') {
      bucketContribWhere.status = status;
    } else if (!status) {
      bucketContribWhere.status = 'APPROVED';
    }
    if (type && type !== 'all') {
      bucketContribWhere.type = type;
    }
    if (startDate || endDate) {
      bucketContribWhere.date = {};
      if (startDate) bucketContribWhere.date.gte = new Date(startDate);
      if (endDate) bucketContribWhere.date.lte = new Date(endDate);
    }

    const bucketExpenseWhere = {};
    if (isAlumni) {
      bucketExpenseWhere.submittedBy = user.id;
    }
    if (status && status !== 'all') {
      bucketExpenseWhere.status = status;
    } else if (!status) {
      bucketExpenseWhere.status = 'APPROVED';
    }
    if (eventId === 'none' || eventId === 'null') {
      bucketExpenseWhere.eventId = null;
    } else if (eventId && eventId !== 'all') {
      bucketExpenseWhere.eventId = eventId;
    }
    if (startDate || endDate) {
      bucketExpenseWhere.date = {};
      if (startDate) bucketExpenseWhere.date.gte = new Date(startDate);
      if (endDate) bucketExpenseWhere.date.lte = new Date(endDate);
    }

    // Calculate bucket-wise contributions (from all data)
    const liftContribs = await prisma.contribution.aggregate({
      where: { ...bucketContribWhere, bucket: 'LIFT' },
      _sum: { liftAmount: true }
    });
    const aaContribs = await prisma.contribution.aggregate({
      where: { ...bucketContribWhere, bucket: 'ALUMNI_ASSOCIATION' },
      _sum: { aaAmount: true }
    });

    // For BASIC contributions, use liftAmount and aaAmount
    const liftTotal = liftContribs._sum.liftAmount || 0;
    const aaTotal = aaContribs._sum.aaAmount || 0;

    // Calculate bucket-wise expenses (from all data)
    const liftExpenses = await prisma.expense.aggregate({
      where: { ...bucketExpenseWhere, bucket: 'LIFT' },
      _sum: { amount: true }
    });
    const aaExpenses = await prisma.expense.aggregate({
      where: { ...bucketExpenseWhere, bucket: 'ALUMNI_ASSOCIATION' },
      _sum: { amount: true }
    });

    const totalContribAmount = totalContrib._sum.amount || 0;
    const totalExpensesAmount = totalExpenses._sum.amount || 0;

    res.json({
      totalContributions: totalContribAmount,
      totalExpenses: totalExpensesAmount,
      remaining: totalContribAmount - totalExpensesAmount,
      contributionCount: totalContrib._count,
      expenseCount: totalExpenses._count,
      buckets: {
        LIFT: {
          contributions: liftTotal,
          expenses: liftExpenses._sum.amount || 0,
          balance: liftTotal - (liftExpenses._sum.amount || 0)
        },
        ALUMNI_ASSOCIATION: {
          contributions: aaTotal,
          expenses: aaExpenses._sum.amount || 0,
          balance: aaTotal - (aaExpenses._sum.amount || 0)
        }
      }
    });
  } catch (err) {
    console.error('Error fetching overview stats:', err);
    res.status(500).json({ error: 'Failed to fetch overview stats', detail: err.message });
  }
});

export default router;
