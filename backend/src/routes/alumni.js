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
  const contributions = await prisma.contribution.findMany({
    where: { userId: req.user.id },
    orderBy: { date: 'desc' }
  });

  // Calculate totals based on status
  const approvedTotal = contributions
    .filter(c => c.status === 'APPROVED')
    .reduce((s, c) => s + c.amount, 0);

  const pendingTotal = contributions
    .filter(c => c.status === 'PENDING')
    .reduce((s, c) => s + c.amount, 0);

  res.json({
    total: approvedTotal,
    pendingTotal,
    contributions
  });
});

// Add contribution (requires admin approval)
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
        date: contributionDate,
        status: 'PENDING',
        createdBy: req.user.id
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

// Expenses
router.post('/expenses', async (req, res) => {
  const { amount, vendor, purpose, description, date, category, eventId } = req.body;
  if (!amount || !purpose || !date || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  try {
    const expense = await prisma.expense.create({
      data: {
        amount: Number(amount),
        vendor,
        purpose,
        description,
        date: new Date(date),
        category,
        eventId: eventId || null,
        status: 'PENDING',
        submittedBy: req.user.id
      },
      include: { event: true }
    });
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to submit expense' });
  }
});

router.get('/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { submittedBy: req.user.id },
      include: { event: true },
      orderBy: { createdAt: 'desc' }
    });

    const approvedTotal = expenses
      .filter(e => e.status === 'APPROVED')
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingTotal = expenses
      .filter(e => e.status === 'PENDING')
      .reduce((sum, e) => sum + e.amount, 0);

    const rejectedTotal = expenses
      .filter(e => e.status === 'REJECTED')
      .reduce((sum, e) => sum + e.amount, 0);

    res.json({
      expenses,
      approvedTotal,
      pendingTotal,
      rejectedTotal
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.put('/expenses/:id', async (req, res) => {
  const { id } = req.params;
  const { amount, vendor, purpose, description, date, category, eventId } = req.body;

  try {
    // First, verify the expense belongs to this user and is still pending
    const existingExpense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (existingExpense.submittedBy !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own expenses' });
    }

    if (existingExpense.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending expenses can be edited' });
    }

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
      include: { event: true }
    });
    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Meetings - Alumni can create and manage their own meetings
router.post('/meetings', async (req, res) => {
  const { title, date, startTime, endTime, location, notes, participantIds, actionItems } = req.body;

  if (!date || !startTime || !endTime || !location) {
    return res.status(400).json({ error: 'Missing required fields: date, startTime, endTime, location' });
  }

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
        await prisma.actionItem.create({
          data: {
            meetingId: meeting.id,
            description: item.description,
            targetDate: new Date(item.targetDate),
            assignees: {
              create: (item.assigneeIds || []).map(userId => ({ userId }))
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
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

router.get('/meetings', async (req, res) => {
  try {
    // Get all meetings - visible to all users
    const meetings = await prisma.meeting.findMany({
      include: {
        creator: { select: { id: true, name: true, email: true } },
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
        actionItems: { include: { assignees: { include: { user: { select: { id: true, name: true, email: true } } } } } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

router.get('/meetings/:id', async (req, res) => {
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

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // All users can view any meeting
    res.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

router.put('/meetings/:id', async (req, res) => {
  const { id } = req.params;
  const { title, date, startTime, endTime, location, notes, participantIds, actionItems } = req.body;

  try {
    // Verify ownership
    const existing = await prisma.meeting.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    if (existing.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own meetings' });
    }

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
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

router.delete('/meetings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Verify ownership
    const existing = await prisma.meeting.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    if (existing.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own meetings' });
    }

    await prisma.meeting.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// Add action item to own meeting
router.post('/meetings/:id/action-items', async (req, res) => {
  const { id } = req.params;
  const { description, targetDate, assigneeIds } = req.body;

  if (!description || !targetDate || !assigneeIds || !assigneeIds.length) {
    return res.status(400).json({ error: 'Missing required fields: description, targetDate, assigneeIds' });
  }

  try {
    // Verify ownership
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    if (meeting.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'You can only add action items to your own meetings' });
    }

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
  } catch (error) {
    console.error('Error creating action item:', error);
    res.status(500).json({ error: 'Failed to create action item' });
  }
});

// Get assigned action items
router.get('/action-items', async (req, res) => {
  try {
    const actionItems = await prisma.actionItem.findMany({
      where: { assignees: { some: { userId: req.user.id } } },
      include: {
        meeting: {
          select: { id: true, title: true, date: true, location: true }
        },
        assignees: { include: { user: { select: { id: true, name: true, email: true } } } }
      },
      orderBy: { targetDate: 'asc' }
    });
    res.json(actionItems);
  } catch (error) {
    console.error('Error fetching action items:', error);
    res.status(500).json({ error: 'Failed to fetch action items' });
  }
});

// Mark action item as completed
router.put('/action-items/:id/complete', async (req, res) => {
  const { id } = req.params;
  try {
    // Verify user is one of the assignees
    const existing = await prisma.actionItem.findUnique({
      where: { id },
      include: { assignees: true }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Action item not found' });
    }
    const isAssignee = existing.assignees.some(a => a.userId === req.user.id);
    if (!isAssignee) {
      return res.status(403).json({ error: 'You can only complete action items assigned to you' });
    }

    const actionItem = await prisma.actionItem.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        meeting: { select: { id: true, title: true, date: true } },
        assignees: { include: { user: { select: { id: true, name: true, email: true } } } }
      }
    });
    res.json(actionItem);
  } catch (error) {
    console.error('Error completing action item:', error);
    res.status(500).json({ error: 'Failed to complete action item' });
  }
});

// Get all users for participant selection
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
