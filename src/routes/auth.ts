import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { sign, requireAuth } from '../middleware/auth.js';

const router = Router();

const publicUser = {
  id: true, email: true, name: true, avatarUrl: true, isHost: true, hostSince: true, bio: true,
} satisfies Prisma.UserSelect;

router.post('/register', async (req, res, next) => {
  try {
    const body = z.object({
      email: z.string().email(),
      password: z.string().min(8, 'Use at least 8 characters'),
      name: z.string().min(2),
    }).parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) { res.status(409).json({ error: 'That email already has an account' }); return; }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        password: await bcrypt.hash(body.password, 10),
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(body.name)}`,
      },
      select: publicUser,
    });
    res.status(201).json({ user, token: sign(user) });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.password))) {
      res.status(401).json({ error: 'Email or password is incorrect' });
      return;
    }
    const { password, ...safe } = user;
    res.json({ user: safe, token: sign(user) });
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    res.json(await prisma.user.findUnique({ where: { id: req.userId as string }, select: publicUser }));
  } catch (e) { next(e); }
});

export default router;
