import type { Metadata } from "next";
import { Users, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { MOCK_PRODUCERS, MOCK_PRODUCTS, MOCK_ORDERS } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import config from "@/site.config";

export const metadata: Metadata = { title: "Admin Overview" };

export default function AdminPage() {
  const gmv = MOCK_ORDERS.reduce((sum, o) => sum + o.total, 0);
  const commission = MOCK_ORDERS.reduce((sum, o) => sum + o.commission, 0);
  const pendingProducers = MOCK_PRODUCERS.filter(
    (p) => p.status === "pending",
  ).length;

  const STATS = [
    {
      label: "Total GMV",
      value: formatPrice(gmv),
      sub: "all time",
      icon: TrendingUp,
      colour: "bg-green-50 text-green-700",
    },
    {
      label: "Commission earned",
      value: formatPrice(commission),
      sub: "platform revenue",
      icon: TrendingUp,
      colour: "bg-blue-50 text-blue-700",
    },
    {
      label: "Active producers",
      value: MOCK_PRODUCERS.filter((p) => p.status === "approved").length,
      sub: `${pendingProducers} pending approval`,
      icon: Users,
      colour: "bg-purple-50 text-purple-700",
    },
    {
      label: "Total products",
      value: MOCK_PRODUCTS.filter((p) => p.available).length,
      sub: "listed & available",
      icon: Package,
      colour: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display mb-2 text-2xl font-bold text-gray-900">
        Platform Overview
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        {config.brand.name} admin dashboard
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, sub, icon: Icon, colour }) => (
          <div
            key={label}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
          >
            <div className={`mb-3 inline-flex rounded-xl p-2 ${colour}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display mb-4 text-lg font-semibold text-gray-900">
            Recent orders
          </h2>
          <ul className="divide-y divide-gray-50">
            {MOCK_ORDERS.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-mono text-xs text-gray-500">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {order.items.length} items · {order.fulfilmentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {formatPrice(order.total)}
                  </p>
                  <p className="text-xs text-gray-400">
                    comm: {formatPrice(order.commission)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pending producer applications */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-gray-900">
              Producer queue
            </h2>
            {pendingProducers > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {pendingProducers} pending
              </span>
            )}
          </div>
          {pendingProducers === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              No pending applications
            </p>
          ) : (
            <ul className="space-y-2">
              {MOCK_PRODUCERS.filter((p) => p.status === "pending").map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-amber-50 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-500">{p.location}</p>
                  </div>
                  <a
                    href={`/admin/producers`}
                    className="text-xs font-medium text-forest-700 hover:underline"
                  >
                    Review →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
