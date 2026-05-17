/**
 * site.config.ts — edit this file when deploying for a new client.
 *
 * MODE GUIDE
 * ----------
 * marketplace   Multi-producer platform. Full admin, producer onboarding,
 *               Stripe Connect commission splits. Sell to farmers market
 *               organisers, collectives, or aggregators.
 *
 * single-store  One brand, one producer's products. Direct Stripe checkout
 *               (no commission). Sell to individual farms, bakeries, etc.
 */

import type { SiteConfig } from "@/lib/site-config.types";

const config: SiteConfig = {
  mode: "marketplace",

  brand: {
    name: "MarketStall",
    tagline: "Your local market, delivered",
    description:
      "Connecting East Midlands farmers and artisan producers directly with people who love great food. Every order supports a local family.",
    email: "hello@marketstall.co.uk",
    location: "East Midlands",
    foundedYear: 2024,
    socialInstagram: "https://instagram.com",
    socialFacebook: "https://facebook.com",
  },

  features: {
    producerOnboarding: true,
    adminPanel: true,
    multiProducer: true,
    stripeConnect: true,
    reviews: true,
  },
};

export default config;
