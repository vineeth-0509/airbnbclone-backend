import { Router } from "express";
import { z } from "zod";
import { eachDayOfInterval, format } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { quote } from "../lib/pricing.js";

const router = Router();

const cardShape = {
  images: { orderBy: { position: "asc" }, take: 5 },
  category: true,
  reviews: { select: { overall: true } },
} satisfies Prisma.ListingInclude;

/** Anything with an id and an optional list of { overall } reviews can be decorated. */
type Decoratable = { id: string; reviews?: { overall: number }[] };

function decorate<T extends Decoratable>(
  listing: T,
  favouriteIds: Set<string> = new Set(),
) {
  const ratings = listing.reviews?.map((r) => r.overall) ?? [];
  const avg = ratings.length
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null;
  const { reviews, ...rest } = listing;
  return {
    ...rest,
    rating: avg ? Number(avg.toFixed(2)) : null,
    reviewCount: ratings.length,
    isFavorite: favouriteIds.has(listing.id),
  };
}

/** GET /api/listings — search: text, dates, guests, price, category, amenities */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const q = z
      .object({
        where: z.string().optional(),
        checkIn: z.string().optional(),
        checkOut: z.string().optional(),
        guests: z.coerce.number().int().min(1).optional(),
        minPrice: z.coerce.number().optional(),
        maxPrice: z.coerce.number().optional(),
        category: z.string().optional(),
        instantBook: z.coerce.boolean().optional(),
        amenities: z.string().optional(), // comma separated slugs
        sort: z
          .enum(["recommended", "price_asc", "price_desc", "rating"])
          .default("recommended"),
        take: z.coerce.number().int().max(48).default(24),
        skip: z.coerce.number().int().default(0),
      })
      .parse(req.query);

    const AND: Prisma.ListingWhereInput[] = [];
    if (q.where) {
      AND.push({
        OR: [
          { city: { contains: q.where, mode: "insensitive" } },
          { country: { contains: q.where, mode: "insensitive" } },
          { title: { contains: q.where, mode: "insensitive" } },
        ],
      });
    }
    if (q.guests) AND.push({ guests: { gte: q.guests } });
    if (q.minPrice) AND.push({ pricePerNight: { gte: q.minPrice } });
    if (q.maxPrice) AND.push({ pricePerNight: { lte: q.maxPrice } });
    if (q.category) AND.push({ category: { is: { slug: q.category } } });
    if (q.instantBook) AND.push({ instantBook: true });
    if (q.amenities) {
      for (const slug of q.amenities.split(",").filter(Boolean)) {
        AND.push({ amenities: { some: { amenity: { slug } } } });
      }
    }
    // Exclude anything already booked or blocked for the requested window.
    if (q.checkIn && q.checkOut) {
      const checkIn = new Date(q.checkIn),
        checkOut = new Date(q.checkOut);
      AND.push({
        bookings: {
          none: {
            status: "CONFIRMED",
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        },
        blockedDates: { none: { date: { gte: checkIn, lt: checkOut } } },
      });
    }

    const orderByOptions: Record<
      typeof q.sort,
      Prisma.ListingOrderByWithRelationInput
    > = {
      price_asc: { pricePerNight: "asc" },
      price_desc: { pricePerNight: "desc" },
      rating: { reviews: { _count: "desc" } },
      recommended: { createdAt: "desc" },
    };
    const orderBy = orderByOptions[q.sort];

    const [rows, total] = await Promise.all([
      prisma.listing.findMany({
        where: { AND },
        include: cardShape,
        orderBy,
        take: q.take,
        skip: q.skip,
      }),
      prisma.listing.count({ where: { AND } }),
    ]);

    let favs = new Set<string>();
    if (req.userId) {
      const f = await prisma.favorite.findMany({
        where: { userId: req.userId },
        select: { listingId: true },
      });
      favs = new Set(f.map((x) => x.listingId));
    }
    res.json({ total, results: rows.map((l) => decorate(l, favs)) });
  } catch (e) {
    next(e);
  }
});

/** GET /api/listings/:id — everything the detail page needs in one round trip */
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        images: { orderBy: { position: "asc" } },
        category: true,
        host: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            hostSince: true,
            bio: true,
          },
        },
        amenities: { include: { amenity: true } },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, avatarUrl: true, createdAt: true } },
          },
        },
      },
    });
    if (!listing) {
      res.status(404).json({ error: "This place is no longer listed" });
      return;
    }

    type ScoreKey =
      | "overall"
      | "cleanliness"
      | "accuracy"
      | "checkin"
      | "communication"
      | "location"
      | "value";
    const r = listing.reviews;
    const avgOf = (k: ScoreKey) =>
      r.length
        ? Number((r.reduce((a, x) => a + x[k], 0) / r.length).toFixed(2))
        : null;
    const breakdown = {
      overall: avgOf("overall"),
      cleanliness: avgOf("cleanliness"),
      accuracy: avgOf("accuracy"),
      checkin: avgOf("checkin"),
      communication: avgOf("communication"),
      location: avgOf("location"),
      value: avgOf("value"),
      distribution: [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: r.filter((x) => Math.round(x.overall) === star).length,
      })),
    };

    const isFavorite = req.userId
      ? Boolean(
          await prisma.favorite.findUnique({
            where: {
              userId_listingId: { userId: req.userId, listingId: listing.id },
            },
          }),
        )
      : false;

    res.json({
      ...listing,
      amenities: listing.amenities.map((a) => a.amenity),
      rating: breakdown.overall,
      reviewCount: r.length,
      breakdown,
      isFavorite,
    });
  } catch (e) {
    next(e);
  }
});

/** GET /api/listings/:id/availability?from=&to= — dates the calendar must disable */
router.get("/:id/availability", async (req, res, next) => {
  try {
    const q = z
      .object({ from: z.string().optional(), to: z.string().optional() })
      .parse(req.query);
    const from = new Date(q.from ?? Date.now());
    const to = new Date(q.to ?? Date.now() + 1000 * 60 * 60 * 24 * 365);

    const [bookings, blocked] = await Promise.all([
      prisma.booking.findMany({
        where: {
          listingId: req.params.id,
          status: "CONFIRMED",
          checkOut: { gt: from },
          checkIn: { lt: to },
        },
        select: { checkIn: true, checkOut: true },
      }),
      prisma.blockedDate.findMany({
        where: { listingId: req.params.id, date: { gte: from, lte: to } },
        select: { date: true },
      }),
    ]);

    const taken = new Set(blocked.map((b) => format(b.date, "yyyy-MM-dd")));
    for (const b of bookings) {
      // checkOut is a turnover day — the next guest may arrive on it.
      for (const d of eachDayOfInterval({
        start: b.checkIn,
        end: new Date(b.checkOut.getTime() - 86400000),
      })) {
        taken.add(format(d, "yyyy-MM-dd"));
      }
    }
    res.json({ unavailable: [...taken].sort() });
  } catch (e) {
    next(e);
  }
});

/** POST /api/listings/:id/quote — price preview, no booking created */
router.post("/:id/quote", async (req, res, next) => {
  try {
    const { checkIn, checkOut } = z
      .object({ checkIn: z.string(), checkOut: z.string() })
      .parse(req.body);
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
    });
    if (!listing) {
      res.status(404).json({ error: "This place is no longer listed" });
      return;
    }
    res.json({
      currency: listing.currency,
      pricePerNight: listing.pricePerNight,
      ...quote(listing, checkIn, checkOut),
    });
  } catch (e) {
    next(e);
  }
});

/** POST /api/listings — become a host */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(8),
        description: z.string().min(20),
        type: z.string(),
        city: z.string(),
        country: z.string(),
        lat: z.number(),
        lng: z.number(),
        pricePerNight: z.number().int().positive(),
        cleaningFee: z.number().int().nonnegative().default(0),
        guests: z.number().int().positive(),
        bedrooms: z.number().int().nonnegative(),
        beds: z.number().int().positive(),
        baths: z.number().positive(),
        categorySlug: z.string().optional(),
        images: z.array(z.string().url()).min(5, "Add at least five photos"),
        amenitySlugs: z.array(z.string()).default([]),
      })
      .parse(req.body);

    const { images, amenitySlugs, categorySlug, ...listingFields } = body;

    const listing = await prisma.listing.create({
      data: {
        ...listingFields,
        // hostId: req.userId as string,
        // category: categorySlug ? { connect: { slug: categorySlug } } : undefined,
        // images: { create: images.map((url, position) => ({ url, position })) },
        // amenities: { create: amenitySlugs.map((slug) => ({ amenity: { connect: { slug } } })) },
        host: {
          connect: {
            id: req.userId as string,
          },
        },
        category: categorySlug
          ? {
              connect: {
                slug: categorySlug,
              },
            }
          : undefined,

        images: {
          create: images.map((url, position) => ({
            url,
            position,
          })),
        },
        amenities: {
          create: amenitySlugs.map((slug) => ({
            amenity: {
              connect: {
                slug,
              },
            },
          })),
        },
      },
      include: { images: true },
    });
    await prisma.user.update({
      where: { id: req.userId as string },
      data: { isHost: true, hostSince: new Date() },
    });
    res.status(201).json(listing);
  } catch (e) {
    next(e);
  }
});

export default router;
