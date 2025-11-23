import express from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';
import { authRequired, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Manage users
import Joi from 'joi';

const createUserSchema = Joi.object({ name: Joi.string().required(), email: Joi.string().email().required(), password: Joi.string().min(4).required(), role: Joi.string().valid('ADMIN','ALUMNI').required() });

router.post('/users', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { error, value } = createUserSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  const { name, email, password, role } = value;
  const passwordHash = hashPassword(password);
  try {
    const user = await prisma.user.create({ data: { name, email, passwordHash, role } });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create user', detail: e.message });
  }
});

router.put('/users/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { name, email, role, active } = req.body;
  try {
    const user = await prisma.user.update({ where: { id }, data: { name, email, role, active } });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user', detail: e.message });
  }
});

router.get('/users', authRequired, requireRole('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users);
});

// Contributions
router.post('/contributions', async (req, res) => {
  const { userId, amount, date, notes } = req.body;
  if (!userId || !amount || !date) return res.status(400).json({ error: 'Missing fields' });
  if (isNaN(amount) || Number(amount) <= 0) return res.status(400).json({ error: 'Negative values are not allowed' });
  try {
    const c = await prisma.contribution.create({ data: { userId, amount: Number(amount), date: new Date(date), notes } });
    res.json(c);
  } catch (e) {
    res.status(500).json({ error: 'Failed to record contribution', detail: e.message });
  }
});

router.get('/contributions', async (req, res) => {
  const list = await prisma.contribution.findMany({ include: { user: true }, orderBy: { date: 'desc' } });
  res.json(list);
});

// Expenses
router.post('/expenses', async (req, res) => {
  const { amount, purpose, description, date, category, event } = req.body;
  if (!amount || !purpose || !date || !category) return res.status(400).json({ error: 'Missing required fields' });
  if (isNaN(amount) || Number(amount) <= 0) return res.status(400).json({ error: 'Negative values are not allowed' });
  try {
    const e = await prisma.expense.create({ data: { amount: Number(amount), purpose, description, date: new Date(date), category, event } });
    res.json(e);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add expense', detail: err.message });
  }
});

router.get('/expenses', async (req, res) => {
  const list = await prisma.expense.findMany({ orderBy: { date: 'desc' } });
  res.json(list);
});

// Announcements
router.post('/announcements', async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Missing fields' });
  const a = await prisma.announcement.create({ data: { title, message } });
  res.json(a);
});

router.get('/announcements', async (req, res) => {
  const list = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(list);
});

// Budget report
router.get('/report/budget', async (req, res) => {
  const totalContrib = await prisma.contribution.aggregate({ _sum: { amount: true } });
  const totalExpenses = await prisma.expense.aggregate({ _sum: { amount: true } });
  const byCategory = await prisma.expense.groupBy({ by: ['category'], _sum: { amount: true } });
  res.json({ totalContrib: totalContrib._sum.amount || 0, totalExpenses: totalExpenses._sum.amount || 0, remaining: (totalContrib._sum.amount || 0) - (totalExpenses._sum.amount || 0), byCategory });
});

export default router;
