import type { Metadata } from "next";
import { MapPin, Search } from "lucide-react";
import ProducerCard from "@/components/producers/ProducerCard";
import { MOCK_PRODUCERS } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Our Producers",
  description: "Meet the East Midlands farmers and artisans behind your food.",
};

export default function ProducersPage() {
  const approved = MOCK_PRODUCERS.filter((p) => p.status === "approved");

  return (
    <div className="bg-cream min-h-screen">
      {/* Header */}
      <div className="bg-forest-800 px-4 pb-16 pt-28 text-center sm:px-6">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-harvest-400">
          The people behind your food
        </p>
        <h1 className="font-display mb-4 text-4xl font-bold text-white sm:text-5xl">
          Meet our producers
        </h1>
        <p className="mx-auto max-w-xl text-forest-300">
          {approved.length} farmers, bakers, cheesemakers, and artisans across
          Nottinghamshire, Leicestershire, Derbyshire, and Lincolnshire.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Search + filter bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search producers…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-200"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4 text-forest-600" />
            <span>East Midlands region</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {approved.map((producer) => (
            <ProducerCard key={producer.id} producer={producer} />
          ))}
        </div>
      </div>
    </div>
  );
}
