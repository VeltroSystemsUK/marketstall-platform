import Image from "next/image";
import Link from "next/link";
import config from "@/site.config";
import {
  ArrowRight,
  MapPin,
  Star,
  ShieldCheck,
  Truck,
  RefreshCw,
  Leaf,
} from "lucide-react";
import ProducerCard from "@/components/producers/ProducerCard";
import ProductCard from "@/components/products/ProductCard";
import { MOCK_PRODUCERS, MOCK_PRODUCTS, MOCK_REVIEWS } from "@/lib/mock-data";
import { CATEGORIES } from "@/lib/types";

const SEASONAL_PRODUCTS = MOCK_PRODUCTS.filter((p) => p.featured).slice(0, 4);
const FEATURED_PRODUCERS = MOCK_PRODUCERS.slice(0, 3);

const HOW_IT_WORKS = [
  {
    icon: MapPin,
    title: "Discover local producers",
    body: "Browse farms and artisans across the East Midlands. Read their stories, see their methods, and find your favourites.",
  },
  {
    icon: ShieldCheck,
    title: "Order with confidence",
    body: "Secure checkout, flexible fulfilment — delivery to your door, click & collect, or consolidated market-day drops.",
  },
  {
    icon: Leaf,
    title: "Taste the difference",
    body: "Food picked and prepared at its best, not weeks early for a distribution centre. You'll taste why it matters.",
  },
];

const STATS = [
  { value: "150+", label: "Local Producers" },
  { value: "2,000+", label: "Products Listed" },
  { value: "12,000+", label: "Happy Customers" },
  { value: "4 Counties", label: "East Midlands" },
];

export default function HomePage() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=85"
          alt="East Midlands farmland at golden hour"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="gradient-hero absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Leaf className="h-3.5 w-3.5 text-harvest-400" />
            East Midlands · Local &amp; Seasonal · Since 2024
          </div>
          <h1 className="font-display mb-6 text-5xl font-bold leading-tight text-balance sm:text-6xl lg:text-7xl">
            Food grown with
            <span className="block italic text-harvest-400">
              passion, not profit.
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">
            Shop directly from the farmers and artisans who grow, raise, and
            craft your food. Know their names. Know their land. Taste the
            difference.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-2xl bg-harvest-500 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-harvest-600 hover:shadow-xl hover:-translate-y-0.5"
            >
              Shop the market <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/producers"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Meet producers
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-10 w-6 rounded-full border-2 border-white/40 p-1">
            <div className="h-2 w-full rounded-full bg-white/60" />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <section className="bg-forest-800 py-8">
        <div className="mx-auto max-w-5xl px-4">
          <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="font-display text-3xl font-bold text-harvest-400">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-sm text-forest-300">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── IN SEASON NOW ──────────────────────────────────────── */}
      <section className="section-pad bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-harvest-600">
                Right now
              </p>
              <h2 className="font-display text-4xl font-bold text-gray-900">
                In season &amp; featured
              </h2>
            </div>
            <Link
              href="/shop?seasonal=true"
              className="hidden items-center gap-1 text-sm font-medium text-forest-700 hover:text-forest-900 sm:flex"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SEASONAL_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/shop?seasonal=true"
              className="text-sm font-medium text-forest-700"
            >
              View all seasonal products →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ─────────────────────────────────────────── */}
      <section className="section-pad bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-harvest-600">
              Browse by
            </p>
            <h2 className="font-display text-4xl font-bold text-gray-900">
              Shop by category
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.slice(0, 10).map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.id}`}
                className="card-hover group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-cream p-6 text-center transition-colors hover:border-forest-200 hover:bg-forest-50"
              >
                <span className="text-4xl">{cat.emoji}</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-forest-700">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCERS ─────────────────────────────────── */}
      <section className="section-pad relative overflow-hidden bg-forest-950">
        <div className="absolute inset-0 opacity-5">
          <Image
            src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&q=60"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-harvest-500">
                The people behind your food
              </p>
              <h2 className="font-display text-4xl font-bold text-white">
                Meet our producers
              </h2>
            </div>
            <Link
              href="/producers"
              className="hidden items-center gap-1 text-sm font-medium text-forest-300 hover:text-white sm:flex"
            >
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURED_PRODUCERS.map((producer) => (
              <ProducerCard key={producer.id} producer={producer} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/producer/onboarding"
              className="inline-flex items-center gap-2 rounded-2xl border border-forest-700 px-6 py-3 text-sm font-medium text-forest-300 transition-colors hover:border-harvest-500 hover:text-harvest-400"
            >
              Are you a producer? Sell with us →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section className="section-pad bg-cream">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-harvest-600">
              Simple as Sunday morning
            </p>
            <h2 className="font-display text-4xl font-bold text-gray-900">
              How {config.brand.name} works
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, idx) => (
              <div key={step.title} className="flex flex-col items-start">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-100">
                  <step.icon className="h-6 w-6 text-forest-700" />
                </div>
                <div className="mb-2 text-xs font-bold text-forest-500">
                  STEP {idx + 1}
                </div>
                <h3 className="font-display mb-2 text-xl font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ───────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-forest-50 p-3">
                <Truck className="h-6 w-6 text-forest-700" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  Next-day delivery
                </h4>
                <p className="text-sm text-gray-500">
                  Order by 10pm, receive the next morning across the East
                  Midlands.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-forest-50 p-3">
                <RefreshCw className="h-6 w-6 text-forest-700" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Fresh guarantee</h4>
                <p className="text-sm text-gray-500">
                  Not happy? We'll replace or refund — no questions asked.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-forest-50 p-3">
                <ShieldCheck className="h-6 w-6 text-forest-700" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Secure payments</h4>
                <p className="text-sm text-gray-500">
                  Stripe-powered checkout. Your card details never touch our
                  servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section className="section-pad bg-earth-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-harvest-600">
              Happy customers
            </p>
            <h2 className="font-display text-4xl font-bold text-gray-900">
              What people say
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {MOCK_REVIEWS.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="mb-3 flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                    />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-gray-700">
                  &ldquo;{review.comment}&rdquo;
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {review.consumerName}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest-800 py-24">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1600&q=60"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display mb-4 text-4xl font-bold text-white sm:text-5xl">
            Ready to taste the difference?
          </h2>
          <p className="mb-8 text-lg text-forest-300">
            Join thousands of East Midlands households who have made the switch
            to real, local food.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-2xl bg-harvest-500 px-10 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-harvest-600 hover:-translate-y-0.5"
          >
            Start shopping <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
