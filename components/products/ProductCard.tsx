"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBasket, Leaf } from "lucide-react";
import { toast } from "react-hot-toast";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useBasket } from "@/contexts/BasketContext";

interface ProductCardProps {
  product: Product;
}

const DIETARY_ICONS: Record<string, string> = {
  vegan: "🌱",
  organic: "☘️",
  "gluten-free": "GF",
  "free-range": "🐔",
  "dairy-free": "DF",
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useBasket();

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name} added to basket`);
  }

  return (
    <Link
      href={`/shop/${product.id}`}
      className="card-hover group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-forest-50">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.seasonal && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-harvest-500 px-2.5 py-1 text-xs font-semibold text-white">
            <Leaf className="h-3 w-3" /> Seasonal
          </span>
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">
            Only {product.stock} left
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.producerName && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-forest-600">
            {product.producerName}
          </p>
        )}
        <h3 className="mb-1 font-display font-semibold text-gray-900 leading-snug">
          {product.name}
        </h3>

        {/* Dietary tags */}
        {product.dietary.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {product.dietary.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-gray-500">
                {DIETARY_ICONS[tag] ?? tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            <span className="ml-1 text-xs text-gray-400">/ {product.unit}</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={!product.available || product.stock === 0}
            className="flex items-center gap-1.5 rounded-xl bg-forest-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Add ${product.name} to basket`}
          >
            <ShoppingBasket className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </Link>
  );
}
