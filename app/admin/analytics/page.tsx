import type { Metadata } from "next";
import { TrendingUp, Users, Package, ShoppingBag } from "lucide-react";
import { MOCK_PRODUCERS, MOCK_PRODUCTS, MOCK_ORDERS } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

export default function AdminAnalyticsPage() {
  const gmv = MOCK_ORDERS.reduce((sum, o) => sum + o.total, 0);
  const commission = MOCK_ORDERS.reduce((sum, o) => sum + o.commission, 0);

  const topCategories = MOCK_PRODUCTS.reduce<Record<string, number>>(
    (acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const sortedCategories = Object.entries(topCategories).sort(
    ([, a], [, b]) => b - a,
  );
  const maxCategoryCount = sortedCategories[0]?.[1] ?? 1;

  const PLATFORM_METRICS = [
    {
      label: "Gross merchandise value",
      value: formatPrice(gmv),
      icon: TrendingUp,
      desc: "Total value of all orders",
    },
    {
      label: "Platform commission",
      value: formatPrice(commission),
      icon: TrendingUp,
      desc: `${((commission / gmv) * 100).toFixed(1)}% average rate`,
    },
    {
      label: "Active producers",
      value: MOCK_PRODUCERS.filter((p) => p.status === "approved").length,
      icon: Users,
      desc: "Approved storefronts",
    },
    {
      label: "Products listed",
      value: MOCK_PRODUCTS.length,
      icon: Package,
      desc: "Across all producers",
    },
    {
      label: "Total orders",
      value: MOCK_ORDERS.length,
      icon: ShoppingBag,
      desc: "All time",
    },
    {
      label: "Avg order value",
      value: formatPrice(Math.round(gmv / Math.max(MOCK_ORDERS.length, 1))),
      icon: TrendingUp,
      desc: "Per transaction",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display mb-2 text-2xl font-bold text-gray-900">
        Analytics
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Platform performance overview
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORM_METRICS.map(({ label, value, icon: Icon, desc }) => (
          <div
            key={label}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg bg-forest-50 p-1.5">
                <Icon className="h-4 w-4 text-forest-700" />
              </div>
              <span className="text-xs font-medium text-gray-500">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="mt-1 text-xs text-gray-400">{desc}</p>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display mb-5 text-lg font-semibold text-gray-900">
            Products by category
          </h2>
          <div className="space-y-3">
            {sortedCategories.map(([cat, count]) => (
              <div key={cat}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium capitalize text-gray-700">
                    {cat}
                  </span>
                  <span className="text-gray-400">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-forest-500"
                    style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top producers by rating */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display mb-5 text-lg font-semibold text-gray-900">
            Top rated producers
          </h2>
          <ol className="space-y-3">
            {MOCK_PRODUCERS.filter((p) => p.rating != null)
              .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
              .slice(0, 6)
              .map((p, i) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-50 text-xs font-bold text-forest-700">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {p.name}
                  </span>
                  <span className="text-sm font-bold text-amber-500">
                    ★ {p.rating?.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({p.reviewCount})
                  </span>
                </li>
              ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
