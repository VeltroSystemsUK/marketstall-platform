import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, ShoppingBag } from "lucide-react";
import type { Producer } from "@/lib/types";
import { truncate } from "@/lib/utils";

interface ProducerCardProps {
  producer: Producer;
}

export default function ProducerCard({ producer }: ProducerCardProps) {
  return (
    <Link
      href={`/producers/${producer.slug}`}
      className="card-hover group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
    >
      {/* Banner */}
      <div className="relative h-40 overflow-hidden bg-forest-100">
        <Image
          src={producer.images.banner}
          alt={producer.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Logo */}
        <div className="absolute bottom-3 left-3 h-12 w-12 overflow-hidden rounded-xl border-2 border-white shadow-md">
          <Image
            src={producer.images.logo}
            alt={`${producer.name} logo`}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-display font-semibold text-gray-900 leading-tight">
            {producer.name}
          </h3>
          {producer.rating != null && (
            <div className="flex shrink-0 items-center gap-1 text-sm text-amber-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="font-medium text-gray-700">
                {producer.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span>{producer.location}</span>
        </div>

        <p className="mb-3 text-sm leading-relaxed text-gray-600">
          {truncate(producer.bio, 100)}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {producer.categories.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="rounded-full bg-forest-50 px-2.5 py-0.5 text-xs font-medium capitalize text-forest-700"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-gray-50 px-4 py-3">
        <ShoppingBag className="h-3.5 w-3.5 text-forest-600" />
        <span className="text-xs font-medium text-forest-700">
          View storefront
        </span>
        <span className="ml-auto text-xs text-gray-400">→</span>
      </div>
    </Link>
  );
}
