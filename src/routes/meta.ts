import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import type { Amenity } from '@prisma/client';

const router = Router();

router.get('/categories', async (_req, res, next) => {
  try { res.json(await prisma.category.findMany({ orderBy: { label: 'asc' } })); } catch (e) { next(e); }
});

router.get('/amenities', async (_req, res, next) => {
  try {
    const all = await prisma.amenity.findMany({ orderBy: [{ group: 'asc' }, { label: 'asc' }] });
    const grouped: Record<string, Amenity[]> = {};
    for (const a of all) (grouped[a.group] ??= []).push(a);
    res.json(grouped);
  } catch (e) { next(e); }
});

/** GET /api/stats — small aggregate numbers for the home page hero */
router.get('/stats', async (_req, res, next) => {
  try {
    const [listings, reviews, cities, avg] = await Promise.all([
      prisma.listing.count(),
      prisma.review.count(),
      prisma.listing.findMany({ distinct: ['city'], select: { city: true } }),
      prisma.review.aggregate({ _avg: { overall: true } }),
    ]);
    res.json({
      listings,
      reviews,
      cities: cities.length,
      avgRating: avg._avg.overall ? Number(avg._avg.overall.toFixed(2)) : null,
    });
  } catch (e) { next(e); }
});

export default router;
