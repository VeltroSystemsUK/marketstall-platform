"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit2, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

const DEMO_PRODUCER_ID = "producer-1";

export default function ProducerProductsPage() {
  const [products, setProducts] = useState<Product[]>(
    MOCK_PRODUCTS.filter((p) => p.producerId === DEMO_PRODUCER_ID),
  );

  function toggleAvailability(id: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p)),
    );
    toast.success("Product updated");
  }

  function deleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product removed");
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          My Products
        </h1>
        <Link
          href="/producer/products/new"
          className="flex items-center gap-1.5 rounded-xl bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800"
        >
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {products.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center text-gray-400">
            <p className="text-base font-medium text-gray-600">
              No products yet
            </p>
            <Link
              href="/producer/products/new"
              className="mt-3 text-sm font-medium text-forest-700 hover:underline"
            >
              Add your first product →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-right">Stock</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <span className="font-medium text-gray-900">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 capitalize text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-gray-900">
                      {formatPrice(product.price)}
                      <span className="ml-1 text-xs text-gray-400">
                        /{product.unit}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-gray-500">
                      {product.stock}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${product.available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {product.available ? "Live" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleAvailability(product.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          title={product.available ? "Hide" : "Show"}
                        >
                          {product.available ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <Link
                          href={`/producer/products/${product.id}/edit`}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
