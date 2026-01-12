import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authRequired } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authRequired middleware to all routes in this router
router.use(authRequired);

router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { contributions: true } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active });
});

router.get('/contributions', async (req, res) => {
  const contributions = await prisma.contribution.findMany({ where: { userId: req.user.id }, orderBy: { date: 'desc' } });
  const total = contributions.reduce((s, c) => s + c.amount, 0);
  res.json({ total, contributions });
});

// New route to add contribution
router.post('/contributions', async (req, res) => {
  const { amount, date } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  let contributionDate = new Date();
  if (date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    contributionDate = parsedDate;
  }
  try {
    const contribution = await prisma.contribution.create({
      data: {
        userId: req.user.id,
        amount: Number(amount),
        date: contributionDate
      }
    });
    res.status(201).json(contribution);
  } catch (error) {
    console.error('Error creating contribution:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/announcements', async (req, res) => {
  const list = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(list);
});

router.get('/budget/summary', async (req, res) => {
  const totalContrib = await prisma.contribution.aggregate({ _sum: { amount: true } });
  const totalExpenses = await prisma.expense.aggregate({ _sum: { amount: true } });
  const byCategory = await prisma.expense.groupBy({ by: ['category'], _sum: { amount: true } });
  res.json({ totalContrib: totalContrib._sum.amount || 0, totalExpenses: totalExpenses._sum.amount || 0, remaining: (totalContrib._sum.amount || 0) - (totalExpenses._sum.amount || 0), byCategory });
});

export default router;
