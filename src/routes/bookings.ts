import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { quote } from '../lib/pricing.js';
import { stripe } from '../lib/stripe.js';
import { httpError } from '../lib/http-error.js';

const router = Router();

const bookingInput = z.object({
  listingId: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number().int().positive(),
});

/** POST /api/bookings — reserve. Overlap is re-checked inside a transaction. */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = bookingInput.parse(req.body);
    const userId = req.userId as string;

    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);
    if (checkIn < new Date(new Date().toDateString())) {
      res.status(400).json({ error: 'Pick a check-in date that has not passed' });
      return;
    }

    const booking = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id: body.listingId } });
      if (!listing) throw httpError('This place is no longer listed', 404);
      if (listing.hostId === userId) throw httpError('You cannot book your own place', 400);
      if (body.guests > listing.guests) throw httpError(`This place sleeps ${listing.guests}`, 400);

      const clash = await tx.booking.findFirst({
        where: {
          listingId: listing.id, status: 'CONFIRMED',
          checkIn: { lt: checkOut }, checkOut: { gt: checkIn },
        },
      });
      if (clash) throw httpError('Those dates were just taken. Pick another window.', 409);

      const priced = quote(listing, checkIn, checkOut);
      return tx.booking.create({
        data: { ...priced, listingId: listing.id, userId, guests: body.guests, checkIn, checkOut },
        include: { listing: { include: { images: { take: 1, orderBy: { position: 'asc' } } } } },
      });
    });

    res.status(201).json(booking);
  } catch (e) { next(e); }
});

/**
 * POST /api/bookings/checkout — start a Stripe Checkout session for a stay.
 * No booking is created here; the booking is only created once Stripe
 * confirms the payment (see /confirm below). That keeps a card decline or an
 * abandoned checkout from ever reserving dates nobody paid for.
 */
router.post('/checkout', requireAuth, async (req, res, next) => {
  try {
    if (!stripe) {
      res.status(501).json({
        error: 'Payments are not configured on this server yet.',
        code: 'STRIPE_DISABLED',
      });
      return;
    }

    const body = bookingInput.parse(req.body);
    const userId = req.userId as string;

    const listing = await prisma.listing.findUnique({
      where: { id: body.listingId },
      include: { images: { take: 1, orderBy: { position: 'asc' } } },
    });
    if (!listing) { res.status(404).json({ error: 'This place is no longer listed' }); return; }
    if (listing.hostId === userId) { res.status(400).json({ error: 'You cannot book your own place' }); return; }
    if (body.guests > listing.guests) { res.status(400).json({ error: `This place sleeps ${listing.guests}` }); return; }

    const checkIn = new Date(body.checkIn), checkOut = new Date(body.checkOut);
    const clash = await prisma.booking.findFirst({
      where: { listingId: listing.id, status: 'CONFIRMED', checkIn: { lt: checkOut }, checkOut: { gt: checkIn } },
    });
    if (clash) { res.status(409).json({ error: 'Those dates were just taken. Pick another window.' }); return; }

    const priced = quote(listing, checkIn, checkOut);
    const nightLabel = `${priced.nights} night${priced.nights > 1 ? 's' : ''} \u00b7 ${body.checkIn} \u2192 ${body.checkOut}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: listing.currency.toLowerCase(),
          unit_amount: priced.total * 100, // Stripe wants the smallest currency unit
          product_data: {
            name: listing.title,
            description: nightLabel,
            images: listing.images[0] ? [listing.images[0].url] : undefined,
          },
        },
        quantity: 1,
      }],
      metadata: {
        listingId: listing.id,
        userId,
        guests: String(body.guests),
        checkIn: body.checkIn,
        checkOut: body.checkOut,
      },
      success_url: `${process.env.CLIENT_ORIGIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_ORIGIN}/rooms/${listing.id}`,
    });

    res.json({ url: session.url });
  } catch (e) { next(e); }
});

/**
 * GET /api/bookings/confirm — called by the success page after Stripe
 * redirects back. Verifies the session actually paid, then creates the
 * booking. Keyed on stripeSessionId so a page refresh or double-call is a
 * no-op instead of a duplicate reservation.
 */
router.get('/confirm', requireAuth, async (req, res, next) => {
  try {
    if (!stripe) { res.status(501).json({ error: 'Payments are not configured on this server yet.' }); return; }
    const sessionId = z.string().min(1).parse(req.query.session_id);
    const userId = req.userId as string;

    const already = await prisma.booking.findUnique({
      where: { stripeSessionId: sessionId },
      include: { listing: { include: { images: { take: 1, orderBy: { position: 'asc' } } } } },
    });
    if (already) { res.json(already); return; }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') { res.status(402).json({ error: 'Payment was not completed' }); return; }
    if (!session.metadata || session.metadata.userId !== userId) {
      res.status(403).json({ error: 'This checkout session does not belong to your account' });
      return;
    }

    const { listingId, checkIn, checkOut, guests } = session.metadata;

    const booking = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id: listingId } });
      if (!listing) throw httpError('This place is no longer listed', 404);

      const clash = await tx.booking.findFirst({
        where: {
          listingId, status: 'CONFIRMED',
          checkIn: { lt: new Date(checkOut) }, checkOut: { gt: new Date(checkIn) },
        },
      });
      if (clash) {
        // Extremely rare: someone else booked the same window while this
        // payment was processing. The card has already been charged, so this
        // is flagged for a refund rather than silently failing.
        throw httpError('Those dates were taken while your payment was processing. Contact support for a refund.', 409);
      }

      const priced = quote(listing, checkIn, checkOut);
      return tx.booking.create({
        data: {
          ...priced, listingId, userId,
          guests: Number(guests), checkIn: new Date(checkIn), checkOut: new Date(checkOut),
          stripeSessionId: sessionId,
        },
        include: { listing: { include: { images: { take: 1, orderBy: { position: 'asc' } } } } },
      });
    });

    res.status(201).json(booking);
  } catch (e) { next(e); }
});

/** GET /api/bookings — trips, split into upcoming and past */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const all = await prisma.booking.findMany({
      where: { userId: req.userId as string },
      orderBy: { checkIn: 'desc' },
      include: {
        listing: { include: { images: { take: 1, orderBy: { position: 'asc' } } } },
        review: { select: { id: true } },
      },
    });
    const today = new Date(new Date().toDateString());
    res.json({
      upcoming: all.filter((b) => b.checkOut >= today && b.status === 'CONFIRMED'),
      past: all.filter((b) => b.checkOut < today || b.status !== 'CONFIRMED'),
    });
  } catch (e) { next(e); }
});

/** GET /api/bookings/host — the reservations on places you own */
router.get('/host', requireAuth, async (req, res, next) => {
  try {
    res.json(await prisma.booking.findMany({
      where: { listing: { hostId: req.userId as string } },
      orderBy: { checkIn: 'asc' },
      include: {
        listing: { select: { id: true, title: true, city: true } },
        user: { select: { name: true, avatarUrl: true } },
      },
    }));
  } catch (e) { next(e); }
});

router.patch('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking || booking.userId !== req.userId) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    if (booking.status !== 'CONFIRMED') { res.status(400).json({ error: 'This booking is already closed' }); return; }
    res.json(await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } }));
  } catch (e) { next(e); }
});

export default router;
