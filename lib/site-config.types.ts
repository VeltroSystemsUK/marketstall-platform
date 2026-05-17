export interface SiteConfig {
  /** Controls which features and pages are active */
  mode: "marketplace" | "single-store";

  brand: {
    name: string;
    tagline: string;
    /** Short paragraph used in the footer and about sections */
    description: string;
    email: string;
    location: string;
    foundedYear: number;
    socialInstagram?: string;
    socialFacebook?: string;
  };

  features: {
    /** Show "Sell With Us" link and /producer/onboarding route */
    producerOnboarding: boolean;
    /** Show admin panel link and /admin routes */
    adminPanel: boolean;
    /** Show Producers page, producer cards, per-producer filtering */
    multiProducer: boolean;
    /** Use Stripe Connect commission splits (marketplace) vs direct payment (single-store) */
    stripeConnect: boolean;
    /** Show product reviews / ratings */
    reviews: boolean;
  };
}
