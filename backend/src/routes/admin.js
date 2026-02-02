import express from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth.js';
import { authRequired, requireRole, requirePosition } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Manage users
import Joi from 'joi';

const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(12)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    }),
  role: Joi.string().valid('ADMIN','ALUMNI').required(),
  officePosition: Joi.string().valid('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'JOINT_SECRETARY', 'TREASURER', '').optional().allow(null)
});

const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid('ADMIN','ALUMNI').optional(),
  officePosition: Joi.string().valid('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'JOINT_SECRETARY', 'TREASURER', '').optional().allow(null),
  active: Joi.boolean().optional()
}).min(1); // At least one field must be provided

router.post('/users', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { error, value } = createUserSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  const { name, email, password, role, officePosition } = value;

  try {
    const data = { name, email, role };
    // Only hash and set password if provided
    if (password) {
      data.passwordHash = hashPassword(password);
    }
    // Only set officePosition for ADMIN users
    if (role === 'ADMIN' && officePosition) {
      data.officePosition = officePosition;
    }
    const user = await prisma.user.create({ data });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create user', detail: e.message });
  }
});

router.put('/users/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { error, value } = updateUserSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { id } = req.params;
  const { name, email, role, active, officePosition } = value;
  try {
    const data = { name, email, role, active };
    // Handle officePosition - set to null if role is not ADMIN or if empty string
    if (role === 'ALUMNI') {
      data.officePosition = null;
    } else if (officePosition !== undefined) {
      data.officePosition = officePosition || null;
    }
    const user = await prisma.user.update({ where: { id }, data });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.get('/users', authRequired, requireRole('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users);
});

// Contributions
const createContributionSchema = Joi.object({
  userId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  date: Joi.date().required(),
  notes: Joi.string().allow('', null).optional(),
  type: Joi.string().valid('BASIC', 'ADDITIONAL').required(),
  liftPercentage: Joi.number().min(0).max(100).optional(),
  aaPercentage: Joi.number().min(0).max(100).optional()
}).custom((value, helpers) => {
  // For ADDITIONAL, validate percentages are provided and sum to 100
  if (value.type === 'ADDITIONAL') {
    if (value.liftPercentage === undefined || value.aaPercentage === undefined) {
      return helpers.error('any.required');
    }
    if (Math.abs((value.liftPercentage || 0) + (value.aaPercentage || 0) - 100) > 0.01) {
      return helpers.error('any.invalid');
    }
  }
  // For BASIC, percentages are not required (will use system default)
  return value;
});

router.post('/contributions', authRequired, requireRole('ADMIN'), requirePosition('TREASURER'), async (req, res) => {
  const { error, value } = createContributionSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { userId, amount, date, notes, type, liftPercentage, aaPercentage } = value;

  try {
    let effectiveLiftPct, effectiveAaPct;

    if (type === 'BASIC') {
      // For BASIC, fetch system default split from settings
      const splitSetting = await prisma.settings.findUnique({
        where: { key: 'basic_contribution_split_lift' }
      });
      effectiveLiftPct = splitSetting ? parseFloat(splitSetting.value) : 50;
      effectiveAaPct = 100 - effectiveLiftPct;
    } else {
      // For ADDITIONAL, use provided percentages
      effectiveLiftPct = liftPercentage;
      effectiveAaPct = aaPercentage;
    }

    const liftAmount = (Number(amount) * effectiveLiftPct) / 100;
    const aaAmount = (Number(amount) * effectiveAaPct) / 100;

    const contributionData = {
      userId,
      amount: Number(amount),
      date: new Date(date),
      notes,
      type,
      status: 'APPROVED',
      bucket: null,
      liftAmount,
      aaAmount,
      liftPercentage: effectiveLiftPct,
      aaPercentage: effectiveAaPct,
      splitPercentage: effectiveLiftPct, // Keep for backward compatibility
      createdBy: req.user.id,
      approvedBy: req.user.id,
      approvedAt: new Date()
    };

    const c = await prisma.contribution.create({
      data: contributionData,
      include: { user: true }
    });
    res.json(c);
  } catch (e) {
    res.status(500).json({ error: 'Failed to record contribution', detail: e.message });
  }
});

router.get('/contributions', authRequired, requireRole('ADMIN'), requirePosition('TREASURER'), async (req, res) => {
  const { status, type, bucket, startDate, endDate } = req.query;
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (bucket) where.bucket = bucket;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const list = await prisma.contribution.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(list);
});

router.put('/contributions/:id', authRequired, requireRole('ADMIN'), requirePosition('TREASURER'), async (req, res) => {
  const { id } = req.params;
  const { amount, date, notes, status, type, liftPercentage, aaPercentage } = req.body;

  try {
    // Get existing contribution
    const existing = await prisma.contribution.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Contribution not found' });

    const updateData = {};
    const effectiveType = type !== undefined ? type : existing.type;
    const effectiveAmount = amount !== undefined ? Number(amount) : existing.amount;

    // Determine percentages based on type
    let effectiveLiftPct, effectiveAaPct;

    if (effectiveType === 'BASIC') {
      // For BASIC, always use system default (ignore provided percentages)
      const splitSetting = await prisma.settings.findUnique({
        where: { key: 'basic_contribution_split_lift' }
      });
      effectiveLiftPct = splitSetting ? parseFloat(splitSetting.value) : 50;
      effectiveAaPct = 100 - effectiveLiftPct;
    } else {
      // For ADDITIONAL, use provided percentages or keep existing
      effectiveLiftPct = liftPercentage !== undefined ? Number(liftPercentage) : (existing.liftPercentage || 50);
      effectiveAaPct = aaPercentage !== undefined ? Number(aaPercentage) : (existing.aaPercentage || 50);

      // Validate percentages only for ADDITIONAL when provided
      if ((liftPercentage !== undefined || aaPercentage !== undefined)) {
        if (Math.abs(effectiveLiftPct + effectiveAaPct - 100) > 0.01) {
          return res.status(400).json({ error: 'LIFT and AA percentages must sum to 100' });
        }
      }
    }

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
    if (type !== undefined) updateData.type = type;

    // Recalculate split amounts if amount or type changed (or percentages for ADDITIONAL)
    const needsRecalculation = amount !== undefined || type !== undefined ||
      (effectiveType === 'ADDITIONAL' && (liftPercentage !== undefined || aaPercentage !== undefined));

    if (needsRecalculation) {
      updateData.liftAmount = (effectiveAmount * effectiveLiftPct) / 100;
      updateData.aaAmount = (effectiveAmount * effectiveAaPct) / 100;
      updateData.liftPercentage = effectiveLiftPct;
      updateData.aaPercentage = effectiveAaPct;
      updateData.splitPercentage = effectiveLiftPct; // Keep for backward compatibility
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

router.put('/contributions/:id/approve', authRequired, requireRole('ADMIN'), requirePosition('TREASURER'), async (req, res) => {
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

router.put('/contributions/:id/reject', authRequired, requireRole('ADMIN'), requirePosition('TREASURER'), async (req, res) => {
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

router.get('/contributions/pending/count', authRequired, requireRole('ADMIN'), requirePosition('TREASURER'), async (req, res) => {
  const count = await prisma.contribution.count({ where: { status: 'PENDING' } });
  res.json({ count });
});

// Events/Groups
const createEventSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
  date: Joi.date().optional()
});

const updateEventSchema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().allow('', null).optional(),
  date: Joi.date().optional()
}).min(1);

router.post('/events', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { error, value } = createEventSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, description, date } = value;
  try {
    const event = await prisma.event.create({ data: { name, description, date: date ? new Date(date) : null } });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.get('/events', authRequired, requireRole('ADMIN'), async (req, res) => {
  try {
    const events = await prisma.event.findMany({ include: { expenses: true }, orderBy: { date: 'desc' } });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/events/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const event = await prisma.event.findUnique({ where: { id }, include: { expenses: true } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

router.put('/events/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { error, value } = updateEventSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { id } = req.params;
  const { name, description, date } = value;
  try {
    const event = await prisma.event.update({ where: { id }, data: { name, description, date: date ? new Date(date) : undefined } });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
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
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Expenses
const createExpenseSchema = Joi.object({
  amount: Joi.number().positive().required(),
  vendor: Joi.string().allow('', null).optional(),
  purpose: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
  date: Joi.date().required(),
  category: Joi.string().required(),
  bucket: Joi.string().valid('LIFT', 'ALUMNI_ASSOCIATION').required(),
  eventId: Joi.string().allow('', null).optional()
});

router.post('/expenses', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { error, value } = createExpenseSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { amount, vendor, purpose, description, date, category, bucket, eventId } = value;

  try {
    const e = await prisma.expense.create({
      data: {
        amount: Number(amount),
        vendor,
        purpose,
        description,
        date: new Date(date),
        category,
        bucket,
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

  // Validate each expense has a bucket
  for (const exp of expenses) {
    if (!exp.bucket || !['LIFT', 'ALUMNI_ASSOCIATION'].includes(exp.bucket)) {
      return res.status(400).json({ error: 'Each expense must have a valid bucket (LIFT or ALUMNI_ASSOCIATION)' });
    }
  }

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
            bucket: exp.bucket,
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
  const { status, bucket, startDate, endDate } = req.query;
  const where = {};
  if (status) where.status = status;
  if (bucket) where.bucket = bucket;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

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
  const { amount, vendor, purpose, description, date, category, bucket, eventId } = req.body;

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
    if (bucket !== undefined) {
      if (!['LIFT', 'ALUMNI_ASSOCIATION'].includes(bucket)) {
        return res.status(400).json({ error: 'Invalid bucket' });
      }
      updateData.bucket = bucket;
    }
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

router.put('/expenses/:id/approve', authRequired, requireRole('ADMIN'), requirePosition('TREASURER'), async (req, res) => {
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

router.put('/expenses/:id/reject', authRequired, requireRole('ADMIN'), requirePosition('TREASURER'), async (req, res) => {
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
const createAnnouncementSchema = Joi.object({
  title: Joi.string().required(),
  message: Joi.string().required()
});

router.post('/announcements', async (req, res) => {
  const { error, value } = createAnnouncementSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { title, message } = value;
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

const updateMeetingSchema = Joi.object({
  title: Joi.string().allow('', null).optional(),
  date: Joi.date().optional(),
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  location: Joi.string().optional(),
  notes: Joi.string().allow('', null).optional(),
  participantIds: Joi.array().items(Joi.string()).optional(),
  actionItems: Joi.array().items(Joi.object({
    description: Joi.string().required(),
    targetDate: Joi.date().required(),
    assigneeIds: Joi.array().items(Joi.string()).min(1).required(),
    status: Joi.string().valid('PENDING', 'COMPLETED').optional()
  })).optional()
}).min(1);

router.put('/meetings/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { error, value } = updateMeetingSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { id } = req.params;
  const { title, date, startTime, endTime, location, notes, participantIds, actionItems } = value;

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
    res.status(500).json({ error: 'Failed to update meeting' });
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
const createActionItemSchema = Joi.object({
  description: Joi.string().required(),
  targetDate: Joi.date().required(),
  assigneeIds: Joi.array().items(Joi.string()).min(1).required()
});

const updateActionItemSchema = Joi.object({
  description: Joi.string().optional(),
  targetDate: Joi.date().optional(),
  assigneeIds: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('PENDING', 'COMPLETED').optional()
}).min(1);

router.post('/meetings/:id/action-items', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { error, value } = createActionItemSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { id } = req.params;
  const { description, targetDate, assigneeIds } = value;

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
    res.status(500).json({ error: 'Failed to create action item' });
  }
});

router.put('/action-items/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { error, value } = updateActionItemSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { id } = req.params;
  const { description, targetDate, assigneeIds, status } = value;

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
    res.status(500).json({ error: 'Failed to update action item' });
  }
});

router.delete('/action-items/:id', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.actionItem.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete action item' });
  }
});

// Budget report
router.get('/report/budget', authRequired, requireRole('ADMIN'), async (req, res) => {
  // Overall totals
  const totalContrib = await prisma.contribution.aggregate({
    where: { status: 'APPROVED' },
    _sum: { amount: true, liftAmount: true, aaAmount: true }
  });
  const totalExpenses = await prisma.expense.aggregate({
    where: { status: 'APPROVED' },
    _sum: { amount: true }
  });

  // Contribution totals by bucket (using liftAmount and aaAmount)
  const liftContributions = totalContrib._sum.liftAmount || 0;
  const aaContributions = totalContrib._sum.aaAmount || 0;

  // Expense totals by bucket
  const liftExpenses = await prisma.expense.aggregate({
    where: { status: 'APPROVED', bucket: 'LIFT' },
    _sum: { amount: true }
  });
  const aaExpenses = await prisma.expense.aggregate({
    where: { status: 'APPROVED', bucket: 'ALUMNI_ASSOCIATION' },
    _sum: { amount: true }
  });

  // Contribution type breakdown
  const basicContrib = await prisma.contribution.aggregate({
    where: { status: 'APPROVED', type: 'BASIC' },
    _sum: { amount: true }
  });
  const additionalContrib = await prisma.contribution.aggregate({
    where: { status: 'APPROVED', type: 'ADDITIONAL' },
    _sum: { amount: true }
  });

  // Expenses by category
  const byCategory = await prisma.expense.groupBy({
    by: ['category'],
    where: { status: 'APPROVED' },
    _sum: { amount: true }
  });

  // Expenses by category and bucket
  const byCategoryAndBucket = await prisma.expense.groupBy({
    by: ['category', 'bucket'],
    where: { status: 'APPROVED' },
    _sum: { amount: true }
  });

  res.json({
    totalContrib: totalContrib._sum.amount || 0,
    totalExpenses: totalExpenses._sum.amount || 0,
    remaining: (totalContrib._sum.amount || 0) - (totalExpenses._sum.amount || 0),
    buckets: {
      LIFT: {
        contributions: liftContributions,
        expenses: liftExpenses._sum.amount || 0,
        balance: liftContributions - (liftExpenses._sum.amount || 0)
      },
      ALUMNI_ASSOCIATION: {
        contributions: aaContributions,
        expenses: aaExpenses._sum.amount || 0,
        balance: aaContributions - (aaExpenses._sum.amount || 0)
      }
    },
    byContributionType: {
      BASIC: basicContrib._sum.amount || 0,
      ADDITIONAL: additionalContrib._sum.amount || 0
    },
    byCategory,
    byCategoryAndBucket
  });
});

// Overview stats endpoint - returns aggregated stats based on filters
router.get('/report/overview-stats', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { status, type, bucket, eventId, startDate, endDate } = req.query;

  // Build contribution where clause
  const contribWhere = { status: status || 'APPROVED' };
  if (status && status !== 'all') contribWhere.status = status;
  if (type && type !== 'all') contribWhere.type = type;
  if (bucket && bucket !== 'ALL') contribWhere.bucket = bucket;
  if (startDate || endDate) {
    contribWhere.date = {};
    if (startDate) contribWhere.date.gte = new Date(startDate);
    if (endDate) contribWhere.date.lte = new Date(endDate);
  }

  // Build expense where clause
  const expenseWhere = {};
  if (status && status !== 'all') expenseWhere.status = status;
  if (status && status === 'all') delete expenseWhere.status; // Show all statuses if 'all' is selected
  else expenseWhere.status = 'APPROVED'; // Default to APPROVED
  if (bucket && bucket !== 'ALL') expenseWhere.bucket = bucket;
  if (eventId === 'none' || eventId === 'null') {
    expenseWhere.eventId = null;
  } else if (eventId && eventId !== 'all') {
    expenseWhere.eventId = eventId;
  }
  if (startDate || endDate) {
    expenseWhere.date = {};
    if (startDate) expenseWhere.date.gte = new Date(startDate);
    if (endDate) expenseWhere.date.lte = new Date(endDate);
  }

  try {
    // Overall totals
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

    // Bucket-wise contributions
    const liftContribs = await prisma.contribution.aggregate({
      where: { ...contribWhere, bucket: 'LIFT' },
      _sum: { liftAmount: true }
    });
    const aaContribs = await prisma.contribution.aggregate({
      where: { ...contribWhere, bucket: 'ALUMNI_ASSOCIATION' },
      _sum: { aaAmount: true }
    });

    // For BASIC contributions, use liftAmount and aaAmount
    const liftTotal = liftContribs._sum.liftAmount || 0;
    const aaTotal = aaContribs._sum.aaAmount || 0;

    // Bucket-wise expenses
    const liftExpenses = await prisma.expense.aggregate({
      where: { ...expenseWhere, bucket: 'LIFT' },
      _sum: { amount: true }
    });
    const aaExpenses = await prisma.expense.aggregate({
      where: { ...expenseWhere, bucket: 'ALUMNI_ASSOCIATION' },
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
    res.status(500).json({ error: 'Failed to fetch overview stats', detail: err.message });
  }
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

router.get('/contributions/:id/audit-logs', authRequired, requireRole('ADMIN'), requirePosition('TREASURER'), async (req, res) => {
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

// Settings management
const settingKeySchema = Joi.object({
  key: Joi.string().pattern(/^[a-zA-Z0-9_-]+$/).required()
});

router.get('/settings', authRequired, requireRole('ADMIN'), async (req, res) => {
  try {
    const settings = await prisma.settings.findMany({
      orderBy: { key: 'asc' }
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.get('/settings/:key', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { error, value } = settingKeySchema.validate(req.params);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { key } = value;
  try {
    const setting = await prisma.settings.findUnique({ where: { key } });
    if (!setting) return res.status(404).json({ error: 'Setting not found' });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

const updateSettingSchema = Joi.object({
  value: Joi.string().required(),
  description: Joi.string().allow('', null).optional()
});

router.put('/settings/:key', authRequired, requireRole('ADMIN'), async (req, res) => {
  const { error: paramError } = settingKeySchema.validate(req.params);
  if (paramError) return res.status(400).json({ error: paramError.details[0].message });

  const { key } = req.params;
  const { error, value: validatedBody } = updateSettingSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { value, description } = validatedBody;

  // Validate specific settings
  if (key === 'basic_contribution_split_lift') {
    const splitValue = parseFloat(value);
    if (isNaN(splitValue) || splitValue < 0 || splitValue > 100) {
      return res.status(400).json({ error: 'Split percentage must be between 0 and 100' });
    }
  }

  try {
    const setting = await prisma.settings.upsert({
      where: { key },
      update: {
        value,
        description: description !== undefined ? description : undefined,
        updatedBy: req.user.id
      },
      create: {
        key,
        value,
        description,
        updatedBy: req.user.id
      }
    });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

export default router;
