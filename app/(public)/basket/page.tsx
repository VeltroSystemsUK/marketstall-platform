"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBasket, ArrowRight } from "lucide-react";
import { useBasket } from "@/contexts/BasketContext";
import { formatPrice } from "@/lib/utils";

const DELIVERY_FEE = 395;

export default function BasketPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem } =
    useBasket();

  if (itemCount === 0) {
    return (
      <div className="bg-cream flex min-h-screen flex-col items-center justify-center px-4 pt-20">
        <ShoppingBasket className="mb-4 h-16 w-16 text-gray-200" />
        <h1 className="font-display mb-2 text-2xl font-bold text-gray-900">
          Your basket is empty
        </h1>
        <p className="mb-6 text-gray-500">
          Browse our producers and add something delicious.
        </p>
        <Link
          href="/shop"
          className="rounded-xl bg-forest-700 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-800"
        >
          Go to shop
        </Link>
      </div>
    );
  }

  const total = subtotal + DELIVERY_FEE;

  // Group by producer
  const byProducer = items.reduce<Record<string, typeof items>>((acc, item) => {
    const pid = item.product.producerId;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(item);
    return acc;
  }, {});

  return (
    <div className="bg-cream min-h-screen pt-20">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display mb-8 text-3xl font-bold text-gray-900">
          Your basket
        </h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items */}
          <div className="space-y-6 lg:col-span-2">
            {Object.entries(byProducer).map(([producerId, producerItems]) => {
              const producerName = producerItems[0].product.producerName;
              return (
                <div
                  key={producerId}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                >
                  <div className="border-b border-gray-100 bg-forest-50 px-5 py-3">
                    <p className="text-sm font-semibold text-forest-800">
                      {producerName}
                    </p>
                  </div>
                  <ul className="divide-y divide-gray-50">
                    {producerItems.map(({ product, quantity }) => (
                      <li
                        key={product.id}
                        className="flex items-center gap-4 p-4"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-forest-50">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(product.price)} / {product.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(product.id, quantity - 1)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">
                            {quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(product.id, quantity + 1)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="w-16 text-right text-sm font-bold text-gray-900">
                          {formatPrice(product.price * quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(product.id)}
                          className="text-gray-300 hover:text-red-500"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="font-display mb-4 text-xl font-bold text-gray-900">
                Order summary
              </h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <dt>Subtotal ({itemCount} items)</dt>
                  <dd className="font-medium">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-gray-600">
                  <dt>Delivery</dt>
                  <dd className="font-medium">{formatPrice(DELIVERY_FEE)}</dd>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
                  <dt>Total</dt>
                  <dd>{formatPrice(total)}</dd>
                </div>
              </dl>
              <Link
                href="/checkout"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-forest-700 py-3.5 text-base font-semibold text-white hover:bg-forest-800"
              >
                Proceed to checkout <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/shop"
                className="mt-3 block text-center text-sm text-forest-700 hover:text-forest-900"
              >
                ← Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
