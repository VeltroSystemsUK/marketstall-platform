import Link from "next/link";
import { Store, Instagram, Facebook, Mail } from "lucide-react";
import config from "@/site.config";

const SHOP_LINKS = [
  { href: "/shop", label: "All Products" },
  { href: "/shop?category=vegetables", label: "Vegetables" },
  { href: "/shop?category=dairy", label: "Dairy & Eggs" },
  { href: "/shop?category=bakery", label: "Bakery" },
  { href: "/shop?category=meat", label: "Meat" },
  { href: "/shop?category=preserves", label: "Preserves" },
];

const HELP_LINKS = [
  { href: "/about", label: `About ${config.brand.name}` },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/delivery", label: "Delivery & Collection" },
  { href: "/contact", label: "Contact Us" },
];

export default function Footer() {
  const showProducerColumn =
    config.features.multiProducer || config.features.producerOnboarding;

  return (
    <footer className="bg-forest-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 gap-10 sm:grid-cols-2 ${
            showProducerColumn ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="mb-4 flex items-center gap-2 font-display text-xl font-semibold"
            >
              <Store className="h-6 w-6 text-harvest-500" />
              <span>{config.brand.name}</span>
            </Link>
            <p className="mb-6 text-sm leading-relaxed text-forest-300">
              {config.brand.description}
            </p>
            <div className="flex gap-4">
              {config.brand.socialInstagram && (
                <a
                  href={config.brand.socialInstagram}
                  aria-label="Instagram"
                  className="text-forest-400 transition-colors hover:text-white"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {config.brand.socialFacebook && (
                <a
                  href={config.brand.socialFacebook}
                  aria-label="Facebook"
                  className="text-forest-400 transition-colors hover:text-white"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              <a
                href={`mailto:${config.brand.email}`}
                aria-label="Email us"
                className="text-forest-400 transition-colors hover:text-white"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-forest-400">
              Shop
            </h3>
            <ul className="space-y-2.5">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-forest-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Producers — marketplace only */}
          {showProducerColumn && (
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-forest-400">
                Producers
              </h3>
              <ul className="space-y-2.5">
                {config.features.multiProducer && (
                  <li>
                    <Link
                      href="/producers"
                      className="text-sm text-forest-300 transition-colors hover:text-white"
                    >
                      Meet Our Producers
                    </Link>
                  </li>
                )}
                {config.features.producerOnboarding && (
                  <li>
                    <Link
                      href="/producer/onboarding"
                      className="text-sm text-forest-300 transition-colors hover:text-white"
                    >
                      Sell With Us
                    </Link>
                  </li>
                )}
                {config.features.multiProducer && (
                  <li>
                    <Link
                      href="/producer/dashboard"
                      className="text-sm text-forest-300 transition-colors hover:text-white"
                    >
                      Producer Portal
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Help */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-forest-400">
              Help
            </h3>
            <ul className="space-y-2.5">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-forest-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-forest-800 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-forest-500">
            &copy; {new Date().getFullYear()} Veltro Ltd. All rights reserved.{" "}
            {config.brand.name} is a trading name of Veltro Ltd.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/privacy"
              className="text-xs text-forest-500 hover:text-forest-300"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-forest-500 hover:text-forest-300"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="text-xs text-forest-500 hover:text-forest-300"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
