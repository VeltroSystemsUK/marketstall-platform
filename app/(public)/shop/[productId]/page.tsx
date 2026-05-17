import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Leaf, ShieldCheck, Truck } from "lucide-react";
import { MOCK_PRODUCTS, MOCK_PRODUCERS } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import ProductCard from "@/components/products/ProductCard";
import AddToBasketButton from "./AddToBasketButton";

interface Props {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.id === productId);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.description };
}

export default async function ProductDetailPage({ params }: Props) {
  const { productId } = await params;
  const product = MOCK_PRODUCTS.find((p) => p.id === productId);
  if (!product) notFound();

  const producer = MOCK_PRODUCERS.find((p) => p.id === product.producerId);
  const related = MOCK_PRODUCTS.filter(
    (p) =>
      p.producerId === product.producerId && p.id !== product.id && p.available,
  ).slice(0, 3);

  return (
    <div className="bg-cream min-h-screen pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/shop"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-forest-700 hover:text-forest-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-forest-50">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              {product.seasonal && (
                <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-harvest-500 px-3 py-1.5 text-sm font-semibold text-white">
                  <Leaf className="h-3.5 w-3.5" /> Seasonal
                </span>
              )}
            </div>
            {product.images.slice(1).map((img, i) => (
              <div
                key={i}
                className="relative h-32 overflow-hidden rounded-2xl"
              >
                <Image
                  src={img}
                  alt={`${product.name} ${i + 2}`}
                  fill
                  sizes="400px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* Details */}
          <div>
            {producer && (
              <Link
                href={`/producers/${producer.slug}`}
                className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-900"
              >
                <div className="relative h-6 w-6 overflow-hidden rounded-full">
                  <Image
                    src={producer.images.logo}
                    alt={producer.name}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                </div>
                {producer.name}
              </Link>
            )}

            <h1 className="font-display mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
              <span className="text-gray-500">/ {product.unit}</span>
            </div>

            <p className="mb-6 text-base leading-relaxed text-gray-600">
              {product.description}
            </p>

            {/* Dietary + allergen tags */}
            {product.dietary.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {product.dietary.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-forest-50 px-3 py-1 text-xs font-medium capitalize text-forest-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {product.allergens.length > 0 && (
              <p className="mb-6 text-xs text-amber-700">
                <strong>Allergens:</strong> {product.allergens.join(", ")}
              </p>
            )}

            {/* Stock */}
            <div className="mb-6">
              {product.stock > 10 ? (
                <span className="text-sm text-green-700">✓ In stock</span>
              ) : product.stock > 0 ? (
                <span className="text-sm text-amber-700">
                  ⚠ Only {product.stock} left
                </span>
              ) : (
                <span className="text-sm text-red-600">✕ Out of stock</span>
              )}
            </div>

            <AddToBasketButton product={product} />

            {/* Trust signals */}
            <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck className="h-4 w-4 shrink-0 text-forest-600" />
                Next-day delivery across the East Midlands
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <ShieldCheck className="h-4 w-4 shrink-0 text-forest-600" />
                Freshness guaranteed or your money back
              </div>
            </div>
          </div>
        </div>

        {/* More from this producer */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display mb-6 text-2xl font-bold text-gray-900">
              More from {producer?.name}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link
                href={`/producers/${producer?.slug}`}
                className="text-sm font-medium text-forest-700 hover:text-forest-900"
              >
                View full storefront →
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
