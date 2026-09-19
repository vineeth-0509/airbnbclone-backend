import Stripe from 'stripe';

// Stripe test mode is free — create an account, use the sk_test_ key, and no
// real card is ever charged. Until STRIPE_SECRET_KEY is set, this stays null
// and the booking routes fall back to instant confirm so the app still works
// end to end with zero setup.
export const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;
