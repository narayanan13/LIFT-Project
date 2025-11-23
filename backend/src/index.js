import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import 'dotenv/config';
const prisma = new PrismaClient();

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import alumniRoutes from './routes/alumni.js';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alumni', alumniRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`LIFT backend running on http://localhost:${port}`);
});
