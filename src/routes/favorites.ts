import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.favorite.findMany({
      where: { userId: req.userId as string },
      orderBy: { createdAt: 'desc' },
      include: { listing: { include: { images: { orderBy: { position: 'asc' }, take: 5 }, reviews: { select: { overall: true } } } } },
    });
    res.json(rows.map(({ listing }) => {
      const r = listing.reviews.map((x) => x.overall);
      const { reviews, ...rest } = listing;
      return {
        ...rest, isFavorite: true, reviewCount: r.length,
        rating: r.length ? Number((r.reduce((a, b) => a + b, 0) / r.length).toFixed(2)) : null,
      };
    }));
  } catch (e) { next(e); }
});

/** POST /api/favorites/:listingId — toggle, returns the new state for the heart */
router.post('/:listingId', requireAuth, async (req, res, next) => {
  try {
    const key = { userId_listingId: { userId: req.userId as string, listingId: req.params.listingId } };
    const existing = await prisma.favorite.findUnique({ where: key });
    if (existing) {
      await prisma.favorite.delete({ where: key });
      res.json({ isFavorite: false });
      return;
    }
    await prisma.favorite.create({ data: { userId: req.userId as string, listingId: req.params.listingId } });
    res.json({ isFavorite: true });
  } catch (e) { next(e); }
});

export default router;
