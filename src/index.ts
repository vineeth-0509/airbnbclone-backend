import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import auth from './routes/auth.js';
import listings from './routes/listings.js';
import bookings from './routes/bookings.js';
import reviews from './routes/reviews.js';
import favorites from './routes/favorites.js';
import meta from './routes/meta.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || '').split(',').filter(Boolean), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));
app.use('/api/auth', auth);
app.use('/api/listings', listings);
app.use('/api/bookings', bookings);
app.use('/api/reviews', reviews);
app.use('/api/favorites', favorites);
app.use('/api', meta);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`API listening on :${port}`));
