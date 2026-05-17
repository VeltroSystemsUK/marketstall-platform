import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { CATEGORIES } from "@/lib/types";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse fresh, local produce from East Midlands farmers and artisans.",
};

interface Props {
  searchParams: Promise<{ category?: string; seasonal?: string; q?: string }>;
}

export default async function ShopPage({ searchParams }: Props) {
  const { category, seasonal, q } = await searchParams;

  let products = MOCK_PRODUCTS.filter((p) => p.available);

  if (category) products = products.filter((p) => p.category === category);
  if (seasonal === "true") products = products.filter((p) => p.seasonal);
  if (q) {
    const lower = q.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        (p.producerName ?? "").toLowerCase().includes(lower),
    );
  }

  const activeCategory = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="bg-cream min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-4 pb-6 pt-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">
            {activeCategory
              ? `${activeCategory.emoji} ${activeCategory.label}`
              : "The Market"}
          </h1>
          <p className="mt-1 text-gray-500">
            {products.length} {products.length === 1 ? "product" : "products"}{" "}
            from East Midlands producers
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Filters sidebar */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Category
                </h3>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="/shop"
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${!category ? "bg-forest-700 font-medium text-white" : "text-gray-600 hover:bg-forest-50 hover:text-forest-700"}`}
                    >
                      All products
                    </a>
                  </li>
                  {CATEGORIES.map((cat) => (
                    <li key={cat.id}>
                      <a
                        href={`/shop?category=${cat.id}`}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${category === cat.id ? "bg-forest-700 font-medium text-white" : "text-gray-600 hover:bg-forest-50 hover:text-forest-700"}`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Filter
                </h3>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="/shop?seasonal=true"
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${seasonal === "true" ? "bg-harvest-500 font-medium text-white" : "text-gray-600 hover:bg-harvest-50 hover:text-harvest-700"}`}
                    >
                      🌿 Seasonal only
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Mobile filter chip */}
          <div className="mb-4 flex items-center gap-2 lg:hidden">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <a
                  key={cat.id}
                  href={`/shop?category=${cat.id}`}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${category === cat.id ? "bg-forest-700 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}
                >
                  {cat.emoji} {cat.label}
                </a>
              ))}
            </div>
          </div>

          {/* Products grid */}
          <div className="flex-1">
            {products.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center text-gray-400">
                <p className="text-lg font-medium">No products found</p>
                <p className="mt-1 text-sm">
                  Try a different category or search term.
                </p>
                <a
                  href="/shop"
                  className="mt-4 inline-block text-sm font-medium text-forest-700 hover:underline"
                >
                  View all products
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
