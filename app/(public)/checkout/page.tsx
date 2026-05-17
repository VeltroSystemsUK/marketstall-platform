"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { ShieldCheck, CreditCard } from "lucide-react";
import { useBasket } from "@/contexts/BasketContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(9, "Phone number required"),
  line1: z.string().min(3, "Address required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City required"),
  postcode: z.string().min(5, "Postcode required"),
  fulfilment: z.enum(["delivery", "collection"]),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const DELIVERY_FEE = 395;

export default function CheckoutPage() {
  const { items, subtotal, clearBasket } = useBasket();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email ?? "",
      name: user?.name ?? "",
      fulfilment: "delivery",
    },
  });

  const fulfilment = watch("fulfilment");
  const total = subtotal + (fulfilment === "delivery" ? DELIVERY_FEE : 0);

  async function onSubmit(data: FormData) {
    if (items.length === 0) {
      toast.error("Your basket is empty");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, address: data, total }),
      });
      if (!res.ok) throw new Error("Payment setup failed");
      const { clientSecret, orderId } = await res.json();
      // In a real implementation, we'd use Stripe Elements here
      // For now, simulate success
      clearBasket();
      router.push(`/orders/${orderId}?success=true`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    router.push("/basket");
    return null;
  }

  return (
    <div className="bg-cream min-h-screen pt-20">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display mb-8 text-3xl font-bold text-gray-900">
          Checkout
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-8 lg:grid-cols-3"
        >
          {/* Left: Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Contact */}
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="font-display mb-4 text-xl font-semibold text-gray-900">
                Contact
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Full name
                  </label>
                  <input
                    {...register("name")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    {...register("phone")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Fulfilment */}
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="font-display mb-4 text-xl font-semibold text-gray-900">
                Fulfilment
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["delivery", "collection"] as const).map((opt) => (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${fulfilment === opt ? "border-forest-500 bg-forest-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <input
                      type="radio"
                      value={opt}
                      {...register("fulfilment")}
                      className="accent-forest-700"
                    />
                    <div>
                      <p className="text-sm font-semibold capitalize text-gray-900">
                        {opt}
                      </p>
                      <p className="text-xs text-gray-500">
                        {opt === "delivery"
                          ? `Next-day delivery (+${formatPrice(DELIVERY_FEE)})`
                          : "Free collection from pick-up point"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {fulfilment === "delivery" && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Address line 1
                    </label>
                    <input
                      {...register("line1")}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none"
                    />
                    {errors.line1 && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.line1.message}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Address line 2 (optional)
                    </label>
                    <input
                      {...register("line2")}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      City / Town
                    </label>
                    <input
                      {...register("city")}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none"
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Postcode
                    </label>
                    <input
                      {...register("postcode")}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none"
                    />
                    {errors.postcode && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.postcode.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Notes */}
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="font-display mb-4 text-xl font-semibold text-gray-900">
                Order notes
              </h2>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Delivery instructions, substitution preferences…"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
              />
            </section>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <h2 className="font-display mb-4 text-xl font-bold text-gray-900">
                  Order total
                </h2>
                <ul className="mb-4 space-y-2 text-sm text-gray-600">
                  {items.map(({ product, quantity }) => (
                    <li key={product.id} className="flex justify-between">
                      <span className="truncate">
                        {product.name} × {quantity}
                      </span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatPrice(product.price * quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="space-y-2 border-t border-gray-100 pt-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <dt>Subtotal</dt>
                    <dd className="font-medium">{formatPrice(subtotal)}</dd>
                  </div>
                  {fulfilment === "delivery" && (
                    <div className="flex justify-between text-gray-600">
                      <dt>Delivery</dt>
                      <dd className="font-medium">
                        {formatPrice(DELIVERY_FEE)}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold text-gray-900">
                    <dt>Total</dt>
                    <dd>{formatPrice(total)}</dd>
                  </div>
                </dl>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-forest-700 py-3.5 text-base font-semibold text-white hover:bg-forest-800 disabled:opacity-60"
                >
                  <CreditCard className="h-4 w-4" />
                  {loading ? "Processing…" : `Pay ${formatPrice(total)}`}
                </button>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-forest-500" />
                  Secure payment powered by Stripe
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
