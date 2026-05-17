import Stripe from "stripe";
import { loadStripe } from "@stripe/stripe-js";

// Lazy singleton — avoids initialising at module load time during build
let _stripe: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

// Keep named export for backwards compatibility in route handlers
export const stripe = {
  paymentIntents: {
    create: (...args: Parameters<Stripe["paymentIntents"]["create"]>) =>
      getStripeServer().paymentIntents.create(...args),
  },
  webhooks: {
    constructEvent: (
      ...args: Parameters<Stripe["webhooks"]["constructEvent"]>
    ) => getStripeServer().webhooks.constructEvent(...args),
  },
} as unknown as Stripe;

// Client-side Stripe promise (singleton)
let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
}

export const PLATFORM_COMMISSION_RATE = 0.12; // 12% default

export function calculateCommission(
  subtotal: number,
  rate = PLATFORM_COMMISSION_RATE,
): number {
  return Math.round(subtotal * rate);
}
