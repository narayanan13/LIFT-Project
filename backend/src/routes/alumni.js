import express from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';
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

// ============ PROFILE ENDPOINTS ============

// Get own profile with job history
router.get('/profile', async (req, res) => {
  try {
    const profile = await prisma.alumniProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        jobHistory: { orderBy: { startDate: 'desc' } }
      }
    });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found', hasProfile: false });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create profile (first-time setup)
router.post('/profile', async (req, res) => {
  const { degree, institution, graduationYear, dateOfBirth, contactNumber, shareContactNumber, currentResidence, profession, linkedinProfile } = req.body;

  // Validate required fields
  if (!degree || !degree.trim()) {
    return res.status(400).json({ error: 'Degree is required' });
  }
  if (!institution || !institution.trim()) {
    return res.status(400).json({ error: 'Institution is required' });
  }
  if (!graduationYear || isNaN(graduationYear)) {
    return res.status(400).json({ error: 'Valid graduation year is required' });
  }
  const year = parseInt(graduationYear);
  const currentYear = new Date().getFullYear();
  if (year < 1950 || year > currentYear + 5) {
    return res.status(400).json({ error: 'Graduation year must be between 1950 and ' + (currentYear + 5) });
  }
  if (!dateOfBirth) {
    return res.status(400).json({ error: 'Date of birth is required' });
  }
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime()) || dob >= new Date()) {
    return res.status(400).json({ error: 'Valid date of birth in the past is required' });
  }

  // Validate LinkedIn URL if provided
  if (linkedinProfile && linkedinProfile.trim()) {
    try {
      new URL(linkedinProfile);
    } catch {
      return res.status(400).json({ error: 'Invalid LinkedIn profile URL' });
    }
  }

  try {
    // Check if profile already exists
    const existing = await prisma.alumniProfile.findUnique({ where: { userId: req.user.id } });
    if (existing) {
      return res.status(400).json({ error: 'Profile already exists. Use PUT to update.' });
    }

    const profile = await prisma.alumniProfile.create({
      data: {
        userId: req.user.id,
        degree: degree.trim(),
        institution: institution.trim(),
        graduationYear: year,
        dateOfBirth: dob,
        contactNumber: contactNumber?.trim() || null,
        shareContactNumber: shareContactNumber !== undefined ? Boolean(shareContactNumber) : true,
        currentResidence: currentResidence?.trim() || null,
        profession: profession?.trim() || null,
        linkedinProfile: linkedinProfile?.trim() || null
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        jobHistory: true
      }
    });
    res.status(201).json(profile);
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// Update own profile
router.put('/profile', async (req, res) => {
  const { degree, institution, graduationYear, dateOfBirth, contactNumber, shareContactNumber, currentResidence, profession, linkedinProfile } = req.body;

  try {
    const existing = await prisma.alumniProfile.findUnique({ where: { userId: req.user.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Profile not found. Create one first.' });
    }

    const updateData = {};

    if (degree !== undefined) {
      if (!degree.trim()) return res.status(400).json({ error: 'Degree cannot be empty' });
      updateData.degree = degree.trim();
    }
    if (institution !== undefined) {
      if (!institution.trim()) return res.status(400).json({ error: 'Institution cannot be empty' });
      updateData.institution = institution.trim();
    }
    if (graduationYear !== undefined) {
      const year = parseInt(graduationYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1950 || year > currentYear + 5) {
        return res.status(400).json({ error: 'Valid graduation year required' });
      }
      updateData.graduationYear = year;
    }
    if (dateOfBirth !== undefined) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime()) || dob >= new Date()) {
        return res.status(400).json({ error: 'Valid date of birth in the past is required' });
      }
      updateData.dateOfBirth = dob;
    }
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber?.trim() || null;
    if (shareContactNumber !== undefined) updateData.shareContactNumber = Boolean(shareContactNumber);
    if (currentResidence !== undefined) updateData.currentResidence = currentResidence?.trim() || null;
    if (profession !== undefined) updateData.profession = profession?.trim() || null;
    if (linkedinProfile !== undefined) {
      if (linkedinProfile && linkedinProfile.trim()) {
        try {
          new URL(linkedinProfile);
        } catch {
          return res.status(400).json({ error: 'Invalid LinkedIn profile URL' });
        }
        updateData.linkedinProfile = linkedinProfile.trim();
      } else {
        updateData.linkedinProfile = null;
      }
    }

    const profile = await prisma.alumniProfile.update({
      where: { userId: req.user.id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        jobHistory: { orderBy: { startDate: 'desc' } }
      }
    });
    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// List all alumni profiles (directory)
router.get('/profiles', async (req, res) => {
  try {
    const profiles = await prisma.alumniProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        jobHistory: {
          where: { endDate: null },
          take: 1,
          orderBy: { startDate: 'desc' }
        }
      },
      orderBy: { user: { name: 'asc' } }
    });

    // Hide contact number for profiles that don't share it
    const sanitizedProfiles = profiles.map(profile => {
      if (!profile.shareContactNumber && profile.userId !== req.user.id) {
        return {
          ...profile,
          contactNumber: null
        };
      }
      return profile;
    });

    res.json(sanitizedProfiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// View specific alumni's profile
router.get('/profiles/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const profile = await prisma.alumniProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        jobHistory: { orderBy: { startDate: 'desc' } }
      }
    });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Hide contact number if user doesn't share it and it's not their own profile
    const sanitizedProfile = {
      ...profile,
      contactNumber: (!profile.shareContactNumber && profile.userId !== req.user.id) ? null : profile.contactNumber
    };

    res.json(sanitizedProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ============ JOB HISTORY ENDPOINTS ============

// Add job to history
router.post('/profile/jobs', async (req, res) => {
  const { companyName, role, startDate, companyWebsite, endDate } = req.body;

  // Validate required fields
  if (!companyName || !companyName.trim()) {
    return res.status(400).json({ error: 'Company name is required' });
  }
  if (!role || !role.trim()) {
    return res.status(400).json({ error: 'Role is required' });
  }
  if (!startDate) {
    return res.status(400).json({ error: 'Start date is required' });
  }
  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return res.status(400).json({ error: 'Invalid start date' });
  }

  let end = null;
  if (endDate) {
    end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid end date' });
    }
    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }
  }

  // Validate website URL if provided
  if (companyWebsite && companyWebsite.trim()) {
    try {
      new URL(companyWebsite);
    } catch {
      return res.status(400).json({ error: 'Invalid company website URL' });
    }
  }

  try {
    // Check if user has a profile
    const profile = await prisma.alumniProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) {
      return res.status(400).json({ error: 'Create a profile first before adding job history' });
    }

    const job = await prisma.jobHistory.create({
      data: {
        profileId: profile.id,
        companyName: companyName.trim(),
        role: role.trim(),
        startDate: start,
        companyWebsite: companyWebsite?.trim() || null,
        endDate: end
      }
    });
    res.status(201).json(job);
  } catch (error) {
    console.error('Error adding job:', error);
    res.status(500).json({ error: 'Failed to add job' });
  }
});

// Update job entry
router.put('/profile/jobs/:id', async (req, res) => {
  const { id } = req.params;
  const { companyName, role, startDate, companyWebsite, endDate } = req.body;

  try {
    // Verify ownership
    const existing = await prisma.jobHistory.findUnique({
      where: { id },
      include: { profile: true }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Job entry not found' });
    }
    if (existing.profile.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own job history' });
    }

    const updateData = {};

    if (companyName !== undefined) {
      if (!companyName.trim()) return res.status(400).json({ error: 'Company name cannot be empty' });
      updateData.companyName = companyName.trim();
    }
    if (role !== undefined) {
      if (!role.trim()) return res.status(400).json({ error: 'Role cannot be empty' });
      updateData.role = role.trim();
    }
    if (startDate !== undefined) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) return res.status(400).json({ error: 'Invalid start date' });
      updateData.startDate = start;
    }
    if (companyWebsite !== undefined) {
      if (companyWebsite && companyWebsite.trim()) {
        try {
          new URL(companyWebsite);
        } catch {
          return res.status(400).json({ error: 'Invalid company website URL' });
        }
        updateData.companyWebsite = companyWebsite.trim();
      } else {
        updateData.companyWebsite = null;
      }
    }
    if (endDate !== undefined) {
      if (endDate === null) {
        updateData.endDate = null;
      } else {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) return res.status(400).json({ error: 'Invalid end date' });
        const startToCheck = updateData.startDate || existing.startDate;
        if (end <= startToCheck) return res.status(400).json({ error: 'End date must be after start date' });
        updateData.endDate = end;
      }
    }

    const job = await prisma.jobHistory.update({
      where: { id },
      data: updateData
    });
    res.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job entry
router.delete('/profile/jobs/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Verify ownership
    const existing = await prisma.jobHistory.findUnique({
      where: { id },
      include: { profile: true }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Job entry not found' });
    }
    if (existing.profile.userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own job history' });
    }

    await prisma.jobHistory.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

router.get('/contributions', async (req, res) => {
  const { type, bucket } = req.query;
  const where = { userId: req.user.id };
  if (type) where.type = type;
  if (bucket) where.bucket = bucket;

  const contributions = await prisma.contribution.findMany({
    where,
    orderBy: { date: 'desc' }
  });

  // Calculate totals based on status
  const approvedTotal = contributions
    .filter(c => c.status === 'APPROVED')
    .reduce((s, c) => s + c.amount, 0);

  const pendingTotal = contributions
    .filter(c => c.status === 'PENDING')
    .reduce((s, c) => s + c.amount, 0);

  // Calculate bucket totals for approved contributions
  const liftTotal = contributions
    .filter(c => c.status === 'APPROVED')
    .reduce((s, c) => s + (c.liftAmount || 0), 0);

  const aaTotal = contributions
    .filter(c => c.status === 'APPROVED')
    .reduce((s, c) => s + (c.aaAmount || 0), 0);

  res.json({
    total: approvedTotal,
    pendingTotal,
    liftTotal,
    aaTotal,
    contributions
  });
});

// Add contribution (requires admin approval)
const alumniContributionSchema = Joi.object({
  amount: Joi.number().positive().required(),
  date: Joi.date().optional(),
  notes: Joi.string().allow('', null).optional(),
  type: Joi.string().valid('BASIC', 'ADDITIONAL').required(),
  bucket: Joi.string().valid('LIFT', 'ALUMNI_ASSOCIATION').when('type', {
    is: 'ADDITIONAL',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

router.post('/contributions', async (req, res) => {
  const { error, value } = alumniContributionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { amount, date, notes, type, bucket } = value;

  let contributionDate = new Date();
  if (date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    contributionDate = parsedDate;
  }

  try {
    let contributionData = {
      userId: req.user.id,
      amount: Number(amount),
      date: contributionDate,
      notes,
      type,
      status: 'PENDING',
      createdBy: req.user.id
    };

    if (type === 'BASIC') {
      // Get split percentage from settings
      const splitSetting = await prisma.settings.findUnique({
        where: { key: 'basic_contribution_split_lift' }
      });
      const splitPercentage = splitSetting ? parseFloat(splitSetting.value) : 50;
      const liftAmount = (amount * splitPercentage) / 100;
      const aaAmount = amount - liftAmount;

      contributionData.bucket = 'LIFT'; // BASIC contributions are tracked under LIFT but split across both
      contributionData.liftAmount = liftAmount;
      contributionData.aaAmount = aaAmount;
      contributionData.splitPercentage = splitPercentage;
    } else {
      // ADDITIONAL contributions go to specified bucket
      contributionData.bucket = bucket;
      contributionData.liftAmount = bucket === 'LIFT' ? amount : 0;
      contributionData.aaAmount = bucket === 'ALUMNI_ASSOCIATION' ? amount : 0;
    }

    const contribution = await prisma.contribution.create({
      data: contributionData
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
  // Overall totals
  const totalContrib = await prisma.contribution.aggregate({
    where: { status: 'APPROVED' },
    _sum: { amount: true, liftAmount: true, aaAmount: true }
  });
  const totalExpenses = await prisma.expense.aggregate({
    where: { status: 'APPROVED' },
    _sum: { amount: true }
  });

  // Contribution totals by bucket
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

  const byCategory = await prisma.expense.groupBy({
    by: ['category'],
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
    byCategory
  });
});

// Expenses
const alumniExpenseSchema = Joi.object({
  amount: Joi.number().positive().required(),
  vendor: Joi.string().allow('', null).optional(),
  purpose: Joi.string().required(),
  description: Joi.string().allow('', null).optional(),
  date: Joi.date().required(),
  category: Joi.string().required(),
  bucket: Joi.string().valid('LIFT', 'ALUMNI_ASSOCIATION').required(),
  eventId: Joi.string().allow('', null).optional()
});

router.post('/expenses', async (req, res) => {
  const { error, value } = alumniExpenseSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { amount, vendor, purpose, description, date, category, bucket, eventId } = value;

  try {
    const expense = await prisma.expense.create({
      data: {
        amount: Number(amount),
        vendor,
        purpose,
        description,
        date: new Date(date),
        category,
        bucket,
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
  const { bucket } = req.query;
  const where = { submittedBy: req.user.id };
  if (bucket) where.bucket = bucket;

  try {
    const expenses = await prisma.expense.findMany({
      where,
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

    // Calculate bucket totals for approved expenses
    const liftTotal = expenses
      .filter(e => e.status === 'APPROVED' && e.bucket === 'LIFT')
      .reduce((sum, e) => sum + e.amount, 0);

    const aaTotal = expenses
      .filter(e => e.status === 'APPROVED' && e.bucket === 'ALUMNI_ASSOCIATION')
      .reduce((sum, e) => sum + e.amount, 0);

    res.json({
      expenses,
      approvedTotal,
      pendingTotal,
      rejectedTotal,
      liftTotal,
      aaTotal
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
const createAlumniActionItemSchema = Joi.object({
  description: Joi.string().required(),
  targetDate: Joi.date().required(),
  assigneeIds: Joi.array().items(Joi.string()).min(1).required()
});

router.post('/meetings/:id/action-items', async (req, res) => {
  const { error, value } = createAlumniActionItemSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { id } = req.params;
  const { description, targetDate, assigneeIds } = value;

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
