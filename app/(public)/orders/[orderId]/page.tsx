import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Package, Truck, Home } from "lucide-react";
import { MOCK_ORDERS } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Order details" };

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ success?: string }>;
}

const STATUS_STEPS = [
  "confirmed",
  "packed",
  "dispatched",
  "delivered",
] as const;

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { success } = await searchParams;
  const order = MOCK_ORDERS.find((o) => o.id === orderId) ?? MOCK_ORDERS[0];

  if (!order && orderId !== "order-demo-1") notFound();

  const currentStep = STATUS_STEPS.indexOf(
    order.status as (typeof STATUS_STEPS)[number],
  );

  return (
    <div className="bg-cream min-h-screen pt-20">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {success === "true" && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-green-50 p-5 ring-1 ring-green-200">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">
                Order placed successfully!
              </p>
              <p className="text-sm text-green-700">
                We&apos;ve notified your producers and you&apos;ll receive a
                confirmation email shortly.
              </p>
            </div>
          </div>
        )}

        <Link
          href="/orders"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-forest-700 hover:text-forest-900"
        >
          <ArrowLeft className="h-4 w-4" /> All orders
        </Link>

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <span className="text-sm text-gray-400">
            {format(new Date(order.createdAt as Date), "d MMMM yyyy")}
          </span>
        </div>

        {/* Status tracker */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display mb-5 text-lg font-semibold text-gray-900">
            Order status
          </h2>
          <div className="relative flex items-start justify-between">
            <div className="absolute left-4 right-4 top-4 h-0.5 bg-gray-100" />
            {STATUS_STEPS.map((step, idx) => {
              const done = idx <= currentStep;
              const Icon = [CheckCircle2, Package, Truck, Home][idx];
              return (
                <div
                  key={step}
                  className="relative flex flex-col items-center gap-2 text-center"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${done ? "bg-forest-700 text-white" : "bg-gray-100 text-gray-400"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-xs font-medium ${done ? "text-forest-700" : "text-gray-400"}`}
                  >
                    {ORDER_STATUS_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="font-display text-lg font-semibold text-gray-900">
              Items
            </h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 p-4">
                {item.imageUrl && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-forest-50">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {item.productName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.producerName} · {item.quantity} ×{" "}
                    {formatPrice(item.price)}
                  </p>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Summary */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="font-display mb-4 text-lg font-semibold text-gray-900">
            Summary
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <dt>Subtotal</dt>
              <dd className="font-medium">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>Delivery</dt>
              <dd className="font-medium">{formatPrice(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
          {order.deliveryAddress && (
            <div className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
              <p className="mb-1 font-medium text-gray-900">Delivery address</p>
              <p>{order.deliveryAddress.line1}</p>
              <p>
                {order.deliveryAddress.city}, {order.deliveryAddress.postcode}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
