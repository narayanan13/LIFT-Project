import { verifyJwt } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log('Auth header:', authHeader ? 'present' : 'missing');
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });
  const parts = authHeader.split(' ');
  console.log('Auth parts:', parts.length, parts[0]);
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid authorization format' });
  const payload = verifyJwt(parts[1]);
  console.log('JWT payload:', payload ? 'valid' : 'invalid/expired');
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  // load user from DB
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    console.log('User found:', user ? 'yes' : 'no', user ? `active: ${user.active}, role: ${user.role}` : '');
    if (!user || !user.active) return res.status(401).json({ error: 'User not found or inactive' });
    req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch (err) {
    console.error('auth middleware error', err);
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
