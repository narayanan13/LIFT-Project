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
router.post('/contributions', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { userId, amount, date, notes } = req.body;
  if (!userId || !amount || !date) return res.status(400).json({ error: 'Missing fields' });
  if (isNaN(amount) || Number(amount) <= 0) return res.status(400).json({ error: 'Negative values are not allowed' });
  try {
    const c = await prisma.contribution.create({
      data: {
        userId,
        amount: Number(amount),
        date: new Date(date),
        notes,
        status: 'APPROVED',
        createdBy: req.user.id,
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      include: { user: true }
    });
    res.json(c);
  } catch (e) {
    res.status(500).json({ error: 'Failed to record contribution', detail: e.message });
  }
});

router.get('/contributions', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { status } = req.query;
  const where = status ? { status } : {};
  const list = await prisma.contribution.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(list);
});

router.put('/contributions/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { amount, date, notes, status } = req.body;

  try {
    const updateData = {};
    if (amount !== undefined) {
      if (isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      updateData.amount = Number(amount);
    }
    if (date !== undefined) updateData.date = new Date(date);
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'APPROVED' || status === 'REJECTED') {
        updateData.approvedBy = req.user.id;
        updateData.approvedAt = new Date();
      }
    }

    const contribution = await prisma.contribution.update({
      where: { id },
      data: updateData,
      include: { user: true }
    });
    res.json(contribution);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update contribution', detail: e.message });
  }
});

router.put('/contributions/:id/approve', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const contribution = await prisma.contribution.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      include: { user: true }
    });
    res.json(contribution);
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve contribution', detail: e.message });
  }
});

router.put('/contributions/:id/reject', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const contribution = await prisma.contribution.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      include: { user: true }
    });
    res.json(contribution);
  } catch (e) {
    res.status(500).json({ error: 'Failed to reject contribution', detail: e.message });
  }
});

router.get('/contributions/pending/count', authRequired, requireRole('ADMIN'), async (req, res) => {
  const count = await prisma.contribution.count({ where: { status: 'PENDING' } });
  res.json({ count });
});

// Events/Groups
router.post('/events', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { name, description, date } = req.body;
  if (!name) return res.status(400).json({ error: 'Event name is required' });
  try {
    const event = await prisma.event.create({ data: { name, description, date: date ? new Date(date) : null } });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event', detail: err.message });
  }
});

router.get('/events', authRequired, requireRole('ADMIN'), async (req, res) => {
  try {
    const events = await prisma.event.findMany({ include: { expenses: true }, orderBy: { date: 'desc' } });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events', detail: err.message });
  }
});

router.get('/events/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const event = await prisma.event.findUnique({ where: { id }, include: { expenses: true } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event', detail: err.message });
  }
});

router.put('/events/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { name, description, date } = req.body;
  try {
    const event = await prisma.event.update({ where: { id }, data: { name, description, date: date ? new Date(date) : undefined } });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event', detail: err.message });
  }
});

router.delete('/events/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    // Remove event association from expenses
    await prisma.expense.updateMany({ where: { eventId: id }, data: { eventId: null } });
    // Delete the event
    const event = await prisma.event.delete({ where: { id } });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event', detail: err.message });
  }
});

// Expenses
router.post('/expenses', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { amount, purpose, description, date, category, eventId } = req.body;
  if (!amount || !purpose || !date || !category) return res.status(400).json({ error: 'Missing required fields' });
  if (isNaN(amount) || Number(amount) <= 0) return res.status(400).json({ error: 'Negative values are not allowed' });
  try {
    const e = await prisma.expense.create({ data: { amount: Number(amount), purpose, description, date: new Date(date), category, eventId: eventId || null } });
    res.json(e);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add expense', detail: err.message });
  }
});

router.post('/expenses/bulk', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { expenses } = req.body;
  if (!Array.isArray(expenses) || expenses.length === 0) return res.status(400).json({ error: 'Expenses array is required' });
  
  try {
    const createdExpenses = await Promise.all(
      expenses.map(exp => 
        prisma.expense.create({
          data: {
            amount: Number(exp.amount),
            purpose: exp.purpose,
            description: exp.description,
            date: new Date(exp.date),
            category: exp.category,
            eventId: exp.eventId || null
          }
        })
      )
    );
    res.json(createdExpenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add expenses', detail: err.message });
  }
});

router.get('/expenses', authRequired, requireRole('ADMIN'), async (req, res) => {
  try {
    const list = await prisma.expense.findMany({ include: { event: true }, orderBy: { date: 'desc' } });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses', detail: err.message });
  }
});

router.get('/expenses/event/:eventId', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { eventId } = req.params;
  try {
    const expenses = await prisma.expense.findMany({ where: { eventId }, include: { event: true }, orderBy: { date: 'desc' } });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses', detail: err.message });
  }
});

router.delete('/expenses/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await prisma.expense.delete({ where: { id } });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense', detail: err.message });
  }
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
router.get('/report/budget', authRequired, requireRole('ADMIN'), async (req, res) => {
  const totalContrib = await prisma.contribution.aggregate({
    where: { status: 'APPROVED' },
    _sum: { amount: true }
  });
  const totalExpenses = await prisma.expense.aggregate({ _sum: { amount: true } });
  const byCategory = await prisma.expense.groupBy({ by: ['category'], _sum: { amount: true } });
  res.json({
    totalContrib: totalContrib._sum.amount || 0,
    totalExpenses: totalExpenses._sum.amount || 0,
    remaining: (totalContrib._sum.amount || 0) - (totalExpenses._sum.amount || 0),
    byCategory
  });
});

export default router;
