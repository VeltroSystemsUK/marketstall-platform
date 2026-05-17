"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBasket } from "lucide-react";
import { toast } from "react-hot-toast";
import { useBasket } from "@/contexts/BasketContext";
import type { Product } from "@/lib/types";

export default function AddToBasketButton({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const { addItem } = useBasket();

  function handleAdd() {
    addItem(product, qty);
    toast.success(`${qty} × ${product.name} added to basket`);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-50"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-base font-semibold">{qty}</span>
        <button
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={handleAdd}
        disabled={!product.available || product.stock === 0}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-forest-700 py-3 text-base font-semibold text-white transition-colors hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ShoppingBasket className="h-5 w-5" />
        Add to basket
      </button>
    </div>
  );
}
