import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyPassword } from '../utils/auth.js';
import Joi from 'joi';
import { signJwt } from '../utils/jwt.js';

const router = express.Router();
const prisma = new PrismaClient();

const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().min(4).required() });

router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  const { email, password } = value;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signJwt({ id: user.id, role: user.role, email: user.email, name: user.name });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
});

export default router;
