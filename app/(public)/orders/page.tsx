"use client";

import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_ORDERS } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { format } from "date-fns";

const STATUS_COLOURS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-purple-100 text-purple-700",
  dispatched: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const orders = user
    ? MOCK_ORDERS.filter((o) => o.consumerId === user.id)
    : MOCK_ORDERS;

  return (
    <div className="bg-cream min-h-screen pt-20">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display mb-8 text-3xl font-bold text-gray-900">
          My orders
        </h1>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center text-gray-400">
            <Package className="mb-4 h-14 w-14 text-gray-200" />
            <p className="text-lg font-medium text-gray-600">No orders yet</p>
            <Link
              href="/shop"
              className="mt-4 text-sm font-medium text-forest-700 hover:underline"
            >
              Start shopping →
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="card-hover flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOURS[order.status]}`}
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"} ·{" "}
                      {formatPrice(order.total)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(order.createdAt as Date), "d MMM yyyy")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
