import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Instagram, Globe, ArrowLeft } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { MOCK_PRODUCERS, MOCK_PRODUCTS } from "@/lib/mock-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const producer = MOCK_PRODUCERS.find((p) => p.slug === slug);
  if (!producer) return { title: "Producer not found" };
  return {
    title: producer.name,
    description: producer.bio,
  };
}

export async function generateStaticParams() {
  return MOCK_PRODUCERS.map((p) => ({ slug: p.slug }));
}

export default async function ProducerStorefrontPage({ params }: Props) {
  const { slug } = await params;
  const producer = MOCK_PRODUCERS.find((p) => p.slug === slug);
  if (!producer) notFound();

  const products = MOCK_PRODUCTS.filter(
    (p) => p.producerId === producer.id && p.available,
  );

  return (
    <div className="bg-cream min-h-screen">
      {/* Hero banner */}
      <div className="relative h-72 overflow-hidden sm:h-96">
        <Image
          src={producer.images.banner}
          alt={producer.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-4 p-6 sm:p-10">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-lg sm:h-24 sm:w-24">
            <Image
              src={producer.images.logo}
              alt={`${producer.name} logo`}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
          <div className="text-white">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">
              {producer.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {producer.location}
              </span>
              {producer.rating != null && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {producer.rating.toFixed(1)} ({producer.reviewCount} reviews)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/producers"
          className="inline-flex items-center gap-1.5 text-sm text-forest-700 hover:text-forest-900"
        >
          <ArrowLeft className="h-4 w-4" /> All producers
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Bio */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <h2 className="font-display mb-3 text-xl font-semibold text-gray-900">
                  About
                </h2>
                <p className="text-sm leading-relaxed text-gray-600">
                  {producer.bio}
                </p>
              </div>

              {/* Story */}
              {producer.story && (
                <div className="rounded-2xl bg-forest-800 p-6 text-white">
                  <h2 className="font-display mb-3 text-lg font-semibold">
                    Our story
                  </h2>
                  <p className="text-sm italic leading-relaxed text-forest-200">
                    &ldquo;{producer.story}&rdquo;
                  </p>
                </div>
              )}

              {/* Details */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 space-y-3">
                <h2 className="font-display text-lg font-semibold text-gray-900">
                  Details
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {producer.categories.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-forest-50 px-3 py-0.5 text-xs font-medium capitalize text-forest-700"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {producer.fulfilmentOptions.map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-harvest-50 px-3 py-0.5 text-xs font-medium capitalize text-harvest-700"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                {producer.socialLinks && (
                  <div className="flex gap-3 pt-1">
                    {producer.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${producer.socialLinks.instagram.replace("@", "")}`}
                        className="text-gray-400 hover:text-forest-600"
                      >
                        <Instagram className="h-4 w-4" />
                      </a>
                    )}
                    {producer.socialLinks.website && (
                      <a
                        href={producer.socialLinks.website}
                        className="text-gray-400 hover:text-forest-600"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Products */}
          <div className="lg:col-span-2">
            <h2 className="font-display mb-6 text-2xl font-bold text-gray-900">
              Available now ({products.length})
            </h2>
            {products.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
                <p>No products currently listed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
