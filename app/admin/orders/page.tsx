import type { Metadata } from "next";
import { MOCK_ORDERS } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Admin Orders" };

const STATUS_COLOURS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-purple-100 text-purple-700",
  dispatched: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function AdminOrdersPage() {
  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display mb-6 text-2xl font-bold text-gray-900">
        All Orders
      </h1>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3 text-left">Order ID</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-right">Subtotal</th>
                <th className="px-5 py-3 text-right">Commission</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {MOCK_ORDERS.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-mono text-xs text-gray-500">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {format(new Date(order.createdAt as Date), "d MMM yyyy")}
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    {order.consumerName ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-gray-900">
                    {formatPrice(order.subtotal)}
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-green-700">
                    {formatPrice(order.commission)}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-gray-900">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOURS[order.status]}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
