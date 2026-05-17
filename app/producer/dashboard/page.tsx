import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Star,
  ArrowRight,
  Plus,
} from "lucide-react";
import { MOCK_PRODUCTS, MOCK_ORDERS } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Producer Dashboard" };

const DEMO_PRODUCER_ID = "producer-1";

export default function ProducerDashboardPage() {
  const myProducts = MOCK_PRODUCTS.filter(
    (p) => p.producerId === DEMO_PRODUCER_ID,
  );
  const myOrders = MOCK_ORDERS.filter((o) =>
    o.producerIds.includes(DEMO_PRODUCER_ID),
  );
  const revenue = myOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const pendingOrders = myOrders.filter(
    (o) => o.status === "pending" || o.status === "confirmed",
  ).length;

  const STATS = [
    {
      label: "Total revenue",
      value: formatPrice(revenue),
      icon: TrendingUp,
      colour: "bg-green-50 text-green-700",
    },
    {
      label: "Active products",
      value: myProducts.filter((p) => p.available).length,
      icon: Package,
      colour: "bg-blue-50 text-blue-700",
    },
    {
      label: "Orders pending",
      value: pendingOrders,
      icon: ShoppingBag,
      colour: "bg-amber-50 text-amber-700",
    },
    {
      label: "Avg rating",
      value: "4.9 ★",
      icon: Star,
      colour: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500">Welcome back, Greenfield Farm</p>
        </div>
        <Link
          href="/producer/products/new"
          className="flex items-center gap-1.5 rounded-xl bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800"
        >
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon, colour }) => (
          <div
            key={label}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
          >
            <div className={`mb-3 inline-flex rounded-xl p-2 ${colour}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-gray-900">
              Recent orders
            </h2>
            <Link
              href="/producer/orders"
              className="flex items-center gap-1 text-xs font-medium text-forest-700"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {myOrders.length > 0 ? (
            <ul className="divide-y divide-gray-50">
              {myOrders.slice(0, 4).map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      #{order.id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(order.createdAt as Date), "d MMM")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${order.status === "delivered" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatPrice(order.subtotal)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-gray-400">
              No orders yet
            </p>
          )}
        </div>

        {/* Products */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-gray-900">
              Your products
            </h2>
            <Link
              href="/producer/products"
              className="flex items-center gap-1 text-xs font-medium text-forest-700"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y divide-gray-50">
            {myProducts.slice(0, 5).map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatPrice(product.price)} / {product.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {product.stock} left
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${product.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {product.available ? "Live" : "Hidden"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
