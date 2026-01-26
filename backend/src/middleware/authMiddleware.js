import { verifyJwt } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization format' });
  }

  const payload = verifyJwt(parts[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });

  // Load user from database
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    req.user = { id: user.id, role: user.role, email: user.email, name: user.name, officePosition: user.officePosition };
    next();
  } catch (err) {
    // Log error without exposing sensitive details
    console.error('Authentication error');
    return res.status(500).json({ error: 'Internal auth error' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Missing user' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export function requirePosition(...positions) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Missing user' });
    if (!req.user.officePosition || !positions.includes(req.user.officePosition)) {
      return res.status(403).json({ error: 'This action requires treasurer privileges' });
    }
    next();
  };
}
