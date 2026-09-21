import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { addDays, subDays } from 'date-fns';
import { photo } from './photo-source.js';
import { CATEGORIES, AMENITIES, HOSTS, LISTINGS, GUESTS, REVIEW_BODIES } from './seed-data.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting\u2026');
  await prisma.$transaction([
    prisma.review.deleteMany(), prisma.booking.deleteMany(), prisma.favorite.deleteMany(),
    prisma.blockedDate.deleteMany(), prisma.listingAmenity.deleteMany(), prisma.listingImage.deleteMany(),
    prisma.listing.deleteMany(), prisma.amenity.deleteMany(), prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const password = await bcrypt.hash('password123', 10);

  await prisma.category.createMany({ data: CATEGORIES.map(([slug, label, icon]) => ({ slug, label, icon })) });
  await prisma.amenity.createMany({ data: AMENITIES.map(([slug, label, group, icon]) => ({ slug, label, group, icon })) });

  const hosts = [];
  for (const [email, name, bio] of HOSTS) {
    hosts.push(await prisma.user.create({
      data: {
        email, name, bio, password, isHost: true,
        hostSince: subDays(new Date(), 365 * (2 + hosts.length)),
        avatarUrl: photo(`host-${name}`, 200, 200),
      },
    }));
  }

  const guests = [];
  for (const [email, name] of GUESTS) {
    guests.push(await prisma.user.create({
      data: { email, name, password, avatarUrl: photo(`guest-${name}`, 200, 200) },
    }));
  }

  const categories: Record<string, string> = Object.fromEntries(
    (await prisma.category.findMany()).map((c): [string, string] => [c.slug, c.id]),
  );

  let i = 0;
  for (const l of LISTINGS) {
    const host = hosts[i % hosts.length];
    const listing = await prisma.listing.create({
      data: {
        title: l.title, description: l.description, type: l.type,
        city: l.city, country: l.country, lat: l.lat, lng: l.lng,
        pricePerNight: l.pricePerNight, cleaningFee: l.cleaningFee,
        guests: l.guests, bedrooms: l.bedrooms, beds: l.beds, baths: l.baths,
        hostId: host.id, categoryId: categories[l.category],
        instantBook: i % 3 !== 0,
        images: {
          create: Array.from({ length: 7 }, (_, p) => ({
            url: photo(`${l.city}-${i}-${p}`),
            alt: `${l.title} \u2014 photo ${p + 1}`,
            position: p,
          })),
        },
        amenities: { create: l.amenities.map((slug) => ({ amenity: { connect: { slug } } })) },
      },
    });

    // A handful of past stays so every listing has honest-looking reviews.
    const reviewCount = 4 + (i % 5);
    for (let r = 0; r < reviewCount; r++) {
      const guest = guests[(i + r) % guests.length];
      const checkOut = subDays(new Date(), 7 + r * 19);
      const checkIn = subDays(checkOut, 2 + (r % 4));
      const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
      const subtotal = listing.pricePerNight * nights;
      const serviceFee = Math.round(subtotal * 0.12);
      const booking = await prisma.booking.create({
        data: {
          listingId: listing.id, userId: guest.id, checkIn, checkOut, nights,
          guests: Math.min(2 + (r % 3), listing.guests),
          subtotal, cleaningFee: listing.cleaningFee, serviceFee,
          total: subtotal + listing.cleaningFee + serviceFee, status: 'COMPLETED',
        },
      });
      const s = (base: number) => Math.min(5, Math.max(3, base - (r % 2)));
      const scores = {
        cleanliness: s(5), accuracy: s(5), checkin: s(5),
        communication: s(5), location: s(5), value: s(5),
      };
      await prisma.review.create({
        data: {
          ...scores,
          overall: Object.values(scores).reduce((a, b) => a + b, 0) / 6,
          body: REVIEW_BODIES[(i + r) % REVIEW_BODIES.length],
          userId: guest.id, listingId: listing.id, bookingId: booking.id,
          createdAt: checkOut,
        },
      });
    }

    // Block a few dates so the calendar has something to gray out.
    await prisma.blockedDate.createMany({
      data: [5, 6, 7, 21, 22].map((d) => ({ listingId: listing.id, date: addDays(new Date(new Date().toDateString()), d + i) })),
      skipDuplicates: true,
    });

    i++;
  }

  // One upcoming trip and two saved places for the demo account.
  const demo = guests[0];
  const first = await prisma.listing.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!first) throw new Error('Seeding order bug: no listings were created before this point.');

  const checkIn = addDays(new Date(new Date().toDateString()), 40);
  const checkOut = addDays(checkIn, 5);
  const subtotal = first.pricePerNight * 5;
  await prisma.booking.create({
    data: {
      listingId: first.id, userId: demo.id, checkIn, checkOut, nights: 5, guests: 2,
      subtotal, cleaningFee: first.cleaningFee, serviceFee: Math.round(subtotal * 0.12),
      total: subtotal + first.cleaningFee + Math.round(subtotal * 0.12),
    },
  });
  const saved = await prisma.listing.findMany({ take: 2, skip: 2 });
  await prisma.favorite.createMany({ data: saved.map((l) => ({ userId: demo.id, listingId: l.id })) });

  console.log(`Seeded ${LISTINGS.length} listings. Demo login: ${demo.email} / password123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
