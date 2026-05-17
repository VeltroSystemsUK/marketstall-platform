"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, XCircle, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";
import { MOCK_PRODUCERS } from "@/lib/mock-data";
import type { Producer } from "@/lib/types";

const STATUS_COLOURS: Record<Producer["status"], string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  suspended: "bg-red-100 text-red-600",
};

export default function AdminProducersPage() {
  const [producers, setProducers] = useState(MOCK_PRODUCERS);
  const [filter, setFilter] = useState<Producer["status"] | "all">("all");

  const filtered =
    filter === "all" ? producers : producers.filter((p) => p.status === filter);

  function updateStatus(id: string, status: Producer["status"]) {
    setProducers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p)),
    );
    toast.success(`Producer ${status}`);
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display mb-6 text-2xl font-bold text-gray-900">
        Producers
      </h1>

      <div className="mb-6 flex gap-2">
        {(["all", "pending", "approved", "suspended"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium capitalize transition-colors ${filter === s ? "bg-forest-700 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-gray-300"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((producer) => (
          <div
            key={producer.id}
            className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
              <Image
                src={producer.images.logo}
                alt={producer.name}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-gray-900">{producer.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOURS[producer.status]}`}
                >
                  {producer.status}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="h-3 w-3" /> {producer.location}
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                {producer.bio}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {producer.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-500"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {producer.status !== "approved" && (
                <button
                  onClick={() => updateStatus(producer.id, "approved")}
                  className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </button>
              )}
              {producer.status !== "suspended" && (
                <button
                  onClick={() => updateStatus(producer.id, "suspended")}
                  className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  <XCircle className="h-3.5 w-3.5" /> Suspend
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
