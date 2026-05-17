"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { Store, CheckCircle2 } from "lucide-react";
import config from "@/site.config";
import { CATEGORIES } from "@/lib/types";

const schema = z.object({
  businessName: z.string().min(2, "Business name required"),
  bio: z
    .string()
    .min(50, "Please write at least 50 characters about your business"),
  location: z.string().min(2, "Location required"),
  postcode: z.string().min(5, "Postcode required"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  fulfilment: z
    .array(z.string())
    .min(1, "Select at least one fulfilment method"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagram: z.string().optional(),
  agreeTerms: z.boolean().refine((v) => v, "You must agree to the terms"),
});
type FormData = z.infer<typeof schema>;

const STEPS = ["Business details", "Products & fulfilment", "Review & submit"];

export default function ProducerOnboardingPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { categories: [], fulfilment: [] },
  });

  const categories = watch("categories");
  const fulfilment = watch("fulfilment");

  function toggleCategory(id: string) {
    setValue(
      "categories",
      categories.includes(id)
        ? categories.filter((c) => c !== id)
        : [...categories, id],
    );
  }

  function toggleFulfilment(id: string) {
    setValue(
      "fulfilment",
      fulfilment.includes(id)
        ? fulfilment.filter((f) => f !== id)
        : [...fulfilment, id],
    );
  }

  async function onSubmit() {
    setSubmitted(true);
    toast.success(
      "Application submitted! We'll review and be in touch within 48 hours.",
    );
    setTimeout(() => router.push("/"), 3000);
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-forest-100">
          <CheckCircle2 className="h-10 w-10 text-forest-700" />
        </div>
        <h1 className="font-display mb-2 text-3xl font-bold text-gray-900">
          Application received!
        </h1>
        <p className="max-w-sm text-gray-500">
          Thank you for applying to sell on {config.brand.name}. We review all
          applications within 48 hours and will email you with next steps.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 font-display text-2xl font-bold text-forest-800">
            <Store className="h-7 w-7 text-forest-600" />
            {config.brand.name}
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900">
            Become a producer
          </h1>
          <p className="mt-2 text-gray-500">
            Join over 150 farmers and artisans selling on the East
            Midlands&apos; most trusted food marketplace.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i <= step ? "bg-forest-700 text-white" : "bg-gray-200 text-gray-400"}`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`hidden text-xs font-medium sm:block ${i === step ? "text-forest-700" : "text-gray-400"}`}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${i < step ? "bg-forest-700" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            {/* Step 0: Business details */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl font-semibold text-gray-900">
                  Business details
                </h2>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Business / farm name
                  </label>
                  <input
                    {...register("businessName")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none"
                  />
                  {errors.businessName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.businessName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    About your business (min 50 characters)
                  </label>
                  <textarea
                    {...register("bio")}
                    rows={5}
                    placeholder="Tell customers about your farm, your methods, and what makes your products special…"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none"
                  />
                  {errors.bio && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.bio.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Location (town / area)
                    </label>
                    <input
                      {...register("location")}
                      placeholder="e.g. Vale of Belvoir, Lincolnshire"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none"
                    />
                    {errors.location && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.location.message}
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Website (optional)
                    </label>
                    <input
                      {...register("website")}
                      type="url"
                      placeholder="https://"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Instagram handle (optional)
                    </label>
                    <input
                      {...register("instagram")}
                      placeholder="@yourhandle"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-forest-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Products & fulfilment */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="font-display text-xl font-semibold text-gray-900">
                  Products & fulfilment
                </h2>
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700">
                    What do you sell? (select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${categories.includes(cat.id) ? "border-forest-500 bg-forest-50 text-forest-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                      >
                        <span>{cat.emoji}</span>
                        <span className="text-xs">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.categories && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.categories.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700">
                    How can customers receive orders?
                  </label>
                  <div className="space-y-2">
                    {[
                      {
                        id: "ship",
                        label: "I can ship direct to customers",
                        desc: "You pack and dispatch orders yourself",
                      },
                      {
                        id: "collect",
                        label: "Click & collect from my farm / stall",
                        desc: "Customers collect from a location you set",
                      },
                      {
                        id: "consolidate",
                        label: "Consolidated market-day drops",
                        desc: `${config.brand.name} collects from you and distributes`,
                      },
                    ].map(({ id, label, desc }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleFulfilment(id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${fulfilment.includes(id) ? "border-forest-500 bg-forest-50" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {label}
                        </p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </button>
                    ))}
                  </div>
                  {errors.fulfilment && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.fulfilment.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl font-semibold text-gray-900">
                  Review & submit
                </h2>
                <div className="rounded-xl bg-forest-50 p-4 text-sm text-forest-800 space-y-2">
                  <p>✓ Applications are reviewed within 48 hours</p>
                  <p>✓ Platform commission: 10–12% per order</p>
                  <p>✓ Payouts via Stripe Connect after delivery</p>
                  <p>✓ No monthly fees or listing costs</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("agreeTerms")}
                    className="mt-1 accent-forest-700"
                  />
                  <span className="text-sm text-gray-600">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      className="font-medium text-forest-700 hover:underline"
                    >
                      Producer Terms of Service
                    </a>{" "}
                    and confirm that I am based in the East Midlands region.
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="text-xs text-red-500">
                    {errors.agreeTerms.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="rounded-xl bg-forest-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                className="rounded-xl bg-harvest-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-harvest-600"
              >
                Submit application
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
