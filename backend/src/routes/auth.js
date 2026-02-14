import express from 'express';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { verifyPassword, hashPassword } from '../utils/auth.js';
import Joi from 'joi';
import { signJwt } from '../utils/jwt.js';
import { authRequired } from '../middleware/authMiddleware.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();
const prisma = new PrismaClient();

// Login schema: only validate email format, password length is not validated
// Existing users may have shorter passwords created before the new policy
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required() // No min length - let hash verification handle auth
});

router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  const { email, password } = value;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });

  // Check if user has a password (might only have Google auth)
  if (!user.passwordHash) {
    return res.status(401).json({ error: 'Please sign in with Google' });
  }

  const ok = verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signJwt({ id: user.id, role: user.role, email: user.email, name: user.name, officePosition: user.officePosition });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, officePosition: user.officePosition, hasGoogleId: !!user.googleId }, token });
});

// Google OAuth login
const googleAuthSchema = Joi.object({
  credential: Joi.string().required()
});

router.post('/google', async (req, res) => {
  const { error, value } = googleAuthSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: value.credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const googleId = payload.sub; // Google's unique user ID

    if (!payload.email_verified) {
      return res.status(401).json({ error: 'Google email not verified' });
    }

    // Find existing user by email
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email. Please contact an administrator.' });
    }

    if (!user.active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Link Google ID if not already linked
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId }
      });
    } else if (user.googleId !== googleId) {
      // Google ID mismatch - email might have been reused by different Google account
      return res.status(401).json({ error: 'This email is linked to a different Google account' });
    }

    // Generate JWT token
    const token = signJwt({ id: user.id, role: user.role, email: user.email, name: user.name, officePosition: user.officePosition });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, officePosition: user.officePosition, hasGoogleId: true }, token });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(12)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    })
});

router.put('/change-password', authRequired, async (req, res) => {
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { currentPassword, newPassword } = value;

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if user has a password (might only have Google auth)
    if (!user.passwordHash) {
      return res.status(400).json({ error: 'Cannot change password for Google-only accounts' });
    }

    const isValid = verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Current password is incorrect' });

    const newPasswordHash = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Get own profile info (any authenticated user)
router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, officePosition: user.officePosition, hasGoogleId: !!user.googleId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update own profile (any authenticated user)
const updateProfileSchema = Joi.object({
  name: Joi.string().min(1).optional(),
  email: Joi.string().email().optional()
}).min(1);

router.put('/profile', authRequired, async (req, res) => {
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, email } = value;

  try {
    // If email is being changed, check it's not already taken
    if (email && email !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ error: 'Email is already in use' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData
    });

    // Return updated user info (same shape as login response)
    const updatedToken = signJwt({ id: user.id, role: user.role, email: user.email, name: user.name, officePosition: user.officePosition });
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, officePosition: user.officePosition, hasGoogleId: !!user.googleId },
      token: updatedToken
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
