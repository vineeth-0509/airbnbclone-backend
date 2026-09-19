import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const score = z.number().int().min(1).max(5);

/** POST /api/reviews — only after a stay you actually completed */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = z.object({
      bookingId: z.string(),
      body: z.string().min(10, 'Tell future guests a little more'),
      cleanliness: score, accuracy: score, checkin: score,
      communication: score, location: score, value: score,
    }).parse(req.body);
    const userId = req.userId as string;

    const booking = await prisma.booking.findUnique({ where: { id: body.bookingId } });
    if (!booking || booking.userId !== userId) { res.status(404).json({ error: 'Booking not found' }); return; }
    if (booking.checkOut > new Date()) { res.status(400).json({ error: 'You can review after checkout' }); return; }

    const overall = (body.cleanliness + body.accuracy + body.checkin + body.communication + body.location + body.value) / 6;
    const review = await prisma.review.create({
      data: {
        ...body, overall,
        userId,
        listingId: booking.listingId,
      },
      include: { user: { select: { name: true, avatarUrl: true } } },
    });
    res.status(201).json(review);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      res.status(409).json({ error: 'You already reviewed this stay' });
      return;
    }
    next(e);
  }
});

/** GET /api/reviews/featured — top-rated reviews across all listings, for the home page carousel */
router.get('/featured', async (_req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: [{ overall: 'desc' }, { createdAt: 'desc' }],
      take: 10,
      include: {
        user: { select: { name: true, avatarUrl: true } },
        listing: { select: { id: true, title: true, city: true, country: true } },
      },
    });
    res.json(reviews);
  } catch (e) { next(e); }
});

export default router;
