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

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        entityType: 'CONTRIBUTION',
        entityId: id,
        action: 'APPROVED',
        userId: req.user.id,
        notes: `Contribution approved by ${req.user.name}`
      }
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

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        entityType: 'CONTRIBUTION',
        entityId: id,
        action: 'REJECTED',
        userId: req.user.id,
        notes: `Contribution rejected by ${req.user.name}`
      }
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
  const { amount, vendor, purpose, description, date, category, eventId } = req.body;
  if (!amount || !purpose || !date || !category) return res.status(400).json({ error: 'Missing required fields' });
  if (isNaN(amount) || Number(amount) <= 0) return res.status(400).json({ error: 'Negative values are not allowed' });
  try {
    const e = await prisma.expense.create({
      data: {
        amount: Number(amount),
        vendor,
        purpose,
        description,
        date: new Date(date),
        category,
        eventId: eventId || null,
        status: 'APPROVED',
        submittedBy: req.user.id,
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      include: { event: true, submitter: { select: { id: true, name: true, email: true } } }
    });
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
            vendor: exp.vendor,
            purpose: exp.purpose,
            description: exp.description,
            date: new Date(exp.date),
            category: exp.category,
            eventId: exp.eventId || null,
            status: 'APPROVED',
            submittedBy: req.user.id,
            approvedBy: req.user.id,
            approvedAt: new Date()
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
  const { status } = req.query;
  const where = status ? { status } : {};
  try {
    const list = await prisma.expense.findMany({
      where,
      include: {
        event: true,
        submitter: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
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

router.put('/expenses/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { amount, vendor, purpose, description, date, category, eventId } = req.body;

  try {
    const updateData = {};
    if (amount !== undefined) {
      if (isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      updateData.amount = Number(amount);
    }
    if (vendor !== undefined) updateData.vendor = vendor;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    if (category !== undefined) updateData.category = category;
    if (eventId !== undefined) updateData.eventId = eventId || null;

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        event: true,
        submitter: { select: { id: true, name: true, email: true } }
      }
    });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expense', detail: err.message });
  }
});

router.put('/expenses/:id/approve', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      include: {
        event: true,
        submitter: { select: { id: true, name: true, email: true } }
      }
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        entityType: 'EXPENSE',
        entityId: id,
        action: 'APPROVED',
        userId: req.user.id,
        notes: `Expense approved by ${req.user.name}`
      }
    });

    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve expense', detail: err.message });
  }
});

router.put('/expenses/:id/reject', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      include: {
        event: true,
        submitter: { select: { id: true, name: true, email: true } }
      }
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        entityType: 'EXPENSE',
        entityId: id,
        action: 'REJECTED',
        userId: req.user.id,
        notes: `Expense rejected by ${req.user.name}`
      }
    });

    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject expense', detail: err.message });
  }
});

router.get('/expenses/pending/count', authRequired, requireRole('ADMIN'), async (req, res) => {
  const count = await prisma.expense.count({ where: { status: 'PENDING' } });
  res.json({ count });
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

// Meetings
const createMeetingSchema = Joi.object({
  title: Joi.string().allow('', null).optional(),
  date: Joi.date().required(),
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  location: Joi.string().required(),
  notes: Joi.string().allow('', null).optional(),
  participantIds: Joi.array().items(Joi.string()).optional(),
  actionItems: Joi.array().items(Joi.object({
    description: Joi.string().required(),
    targetDate: Joi.date().required(),
    assigneeIds: Joi.array().items(Joi.string()).min(1).required()
  })).optional()
});

router.post('/meetings', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { error, value } = createMeetingSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { title, date, startTime, endTime, location, notes, participantIds, actionItems } = value;

  try {
    // Create meeting first
    const meeting = await prisma.meeting.create({
      data: {
        title,
        date: new Date(date),
        startTime,
        endTime,
        location,
        notes,
        createdBy: req.user.id,
        participants: participantIds?.length ? {
          create: participantIds.map(userId => ({ userId }))
        } : undefined
      }
    });

    // Create action items with multiple assignees
    if (actionItems?.length) {
      for (const item of actionItems) {
        const actionItem = await prisma.actionItem.create({
          data: {
            meetingId: meeting.id,
            description: item.description,
            targetDate: new Date(item.targetDate),
            assignees: {
              create: item.assigneeIds.map(userId => ({ userId }))
            }
          }
        });
      }
    }

    // Fetch complete meeting with relations
    const completeMeeting = await prisma.meeting.findUnique({
      where: { id: meeting.id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
        actionItems: { include: { assignees: { include: { user: { select: { id: true, name: true, email: true } } } } } }
      }
    });
    res.status(201).json(completeMeeting);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create meeting', detail: err.message });
  }
});

router.get('/meetings', authRequired, requireRole('ADMIN'), async (req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      include: {
        creator: { select: { id: true, name: true, email: true } },
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
        actionItems: { include: { assignees: { include: { user: { select: { id: true, name: true, email: true } } } } } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch meetings', detail: err.message });
  }
});

router.get('/meetings/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
        actionItems: { include: { assignees: { include: { user: { select: { id: true, name: true, email: true } } } } } }
      }
    });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch meeting', detail: err.message });
  }
});

router.put('/meetings/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { title, date, startTime, endTime, location, notes, participantIds, actionItems } = req.body;

  try {
    // Update meeting basic fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (date !== undefined) updateData.date = new Date(date);
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;

    // Handle participants update
    if (participantIds !== undefined) {
      await prisma.meetingParticipant.deleteMany({ where: { meetingId: id } });
      if (participantIds.length > 0) {
        await prisma.meetingParticipant.createMany({
          data: participantIds.map(userId => ({ meetingId: id, userId }))
        });
      }
    }

    // Handle action items update with multiple assignees
    if (actionItems !== undefined) {
      await prisma.actionItem.deleteMany({ where: { meetingId: id } });
      for (const item of actionItems) {
        await prisma.actionItem.create({
          data: {
            meetingId: id,
            description: item.description,
            targetDate: new Date(item.targetDate),
            status: item.status || 'PENDING',
            completedAt: item.status === 'COMPLETED' ? new Date() : null,
            assignees: {
              create: (item.assigneeIds || []).map(userId => ({ userId }))
            }
          }
        });
      }
    }

    const meeting = await prisma.meeting.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
        actionItems: { include: { assignees: { include: { user: { select: { id: true, name: true, email: true } } } } } }
      }
    });
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update meeting', detail: err.message });
  }
});

router.delete('/meetings/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.meeting.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete meeting', detail: err.message });
  }
});

// Action Items management
router.post('/meetings/:id/action-items', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { description, targetDate, assigneeIds } = req.body;

  if (!description || !targetDate || !assigneeIds || !assigneeIds.length) {
    return res.status(400).json({ error: 'Missing required fields: description, targetDate, assigneeIds' });
  }

  try {
    const actionItem = await prisma.actionItem.create({
      data: {
        meetingId: id,
        description,
        targetDate: new Date(targetDate),
        assignees: {
          create: assigneeIds.map(userId => ({ userId }))
        }
      },
      include: { assignees: { include: { user: { select: { id: true, name: true, email: true } } } } }
    });
    res.status(201).json(actionItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create action item', detail: err.message });
  }
});

router.put('/action-items/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { description, targetDate, assigneeIds, status } = req.body;

  try {
    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (targetDate !== undefined) updateData.targetDate = new Date(targetDate);
    if (status !== undefined) {
      updateData.status = status;
      updateData.completedAt = status === 'COMPLETED' ? new Date() : null;
    }

    // Handle assignees update
    if (assigneeIds !== undefined) {
      await prisma.actionItemAssignee.deleteMany({ where: { actionItemId: id } });
      if (assigneeIds.length > 0) {
        await prisma.actionItemAssignee.createMany({
          data: assigneeIds.map(userId => ({ actionItemId: id, userId }))
        });
      }
    }

    const actionItem = await prisma.actionItem.update({
      where: { id },
      data: updateData,
      include: { assignees: { include: { user: { select: { id: true, name: true, email: true } } } } }
    });
    res.json(actionItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update action item', detail: err.message });
  }
});

router.delete('/action-items/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.actionItem.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete action item', detail: err.message });
  }
});

// Budget report
router.get('/report/budget', authRequired, requireRole('ADMIN'), async (req, res) => {
  const totalContrib = await prisma.contribution.aggregate({
    where: { status: 'APPROVED' },
    _sum: { amount: true }
  });
  const totalExpenses = await prisma.expense.aggregate({
    where: { status: 'APPROVED' },
    _sum: { amount: true }
  });
  const byCategory = await prisma.expense.groupBy({
    by: ['category'],
    where: { status: 'APPROVED' },
    _sum: { amount: true }
  });
  res.json({
    totalContrib: totalContrib._sum.amount || 0,
    totalExpenses: totalExpenses._sum.amount || 0,
    remaining: (totalContrib._sum.amount || 0) - (totalExpenses._sum.amount || 0),
    byCategory
  });
});

// Audit log endpoints
router.get('/expenses/:id/audit-logs', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'EXPENSE',
        entityId: id
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { timestamp: 'desc' }
    });
    res.json(auditLogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expense audit logs', detail: err.message });
  }
});

router.get('/contributions/:id/audit-logs', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'CONTRIBUTION',
        entityId: id
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { timestamp: 'desc' }
    });
    res.json(auditLogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contribution audit logs', detail: err.message });
  }
});

export default router;
