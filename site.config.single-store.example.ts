/**
 * EXAMPLE — Single-Producer Store
 *
 * Copy this file to site.config.ts when deploying for an individual producer.
 * One brand, their products only, direct Stripe checkout.
 *
 * Typical buyers: honey farms, bakeries, butchers, cheese makers, box schemes.
 */

import type { SiteConfig } from "@/lib/site-config.types";

const config: SiteConfig = {
  mode: "single-store",

  brand: {
    name: "Wildwood Honey",
    tagline: "Raw, unfiltered honey from the Nottinghamshire countryside",
    description:
      "Small-batch honey harvested by hand from our hives in the heart of Nottinghamshire. Every jar captures the wildflowers of a single season.",
    email: "hello@wildwoodhoney.co.uk",
    location: "Nottinghamshire",
    foundedYear: 2018,
    socialInstagram: "https://instagram.com/wildwoodhoney",
    socialFacebook: "https://facebook.com/wildwoodhoney",
  },

  features: {
    producerOnboarding: false,
    adminPanel: false,
    multiProducer: false,
    stripeConnect: false,
    reviews: true,
  },
};

export default config;
