import type { Metadata } from "next";
import {
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { MOCK_ORDERS } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Payouts" };

const DEMO_PRODUCER_ID = "producer-1";

export default function ProducerPayoutsPage() {
  const orders = MOCK_ORDERS.filter(
    (o) => o.producerIds.includes(DEMO_PRODUCER_ID) && o.status === "delivered",
  );
  const grossRevenue = orders.reduce((sum, o) => sum + o.subtotal, 0);
  const commission = orders.reduce((sum, o) => sum + o.commission, 0);
  const netRevenue = grossRevenue - commission;

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display mb-2 text-2xl font-bold text-gray-900">
        Payouts
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Your earnings and Stripe Connect status
      </p>

      {/* Stripe Connect status */}
      <div className="mb-8 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <p className="font-semibold text-amber-900">
            Connect your bank account
          </p>
          <p className="mt-0.5 text-sm text-amber-700">
            Set up Stripe Connect to receive automatic payouts after each order
            is delivered.
          </p>
        </div>
        <a
          href="#"
          className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Connect <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Revenue summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Gross revenue",
            value: formatPrice(grossRevenue),
            colour: "text-gray-900",
          },
          {
            label: "Platform commission (10%)",
            value: `−${formatPrice(commission)}`,
            colour: "text-red-600",
          },
          {
            label: "Your net earnings",
            value: formatPrice(netRevenue),
            colour: "text-forest-700",
          },
        ].map(({ label, value, colour }) => (
          <div
            key={label}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
          >
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
              {label}
            </p>
            <p className={`text-2xl font-bold ${colour}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Payout history */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          <TrendingUp className="h-4 w-4 text-forest-600" />
          <h2 className="font-display text-lg font-semibold text-gray-900">
            Completed deliveries
          </h2>
        </div>
        {orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            No completed deliveries yet
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="font-mono text-xs text-gray-400">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> Delivered
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {formatPrice(order.subtotal - order.commission)}
                  </p>
                  <p className="text-xs text-gray-400">after commission</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
