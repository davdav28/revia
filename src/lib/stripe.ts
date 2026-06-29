import Stripe from "stripe";

let cached: Stripe | null = null;

/** Client Stripe, ou null si aucune clé (mode démo). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.trim()) return null;
  if (!cached) cached = new Stripe(key);
  return cached;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY?.trim();
}
