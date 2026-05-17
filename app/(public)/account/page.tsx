"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Package, Heart, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    router.push("/");
  }

  const MENU_ITEMS = [
    {
      href: "/orders",
      icon: Package,
      label: "My Orders",
      description: "Track and manage your orders",
    },
    {
      href: "/account/favourites",
      icon: Heart,
      label: "Favourites",
      description: "Saved products and producers",
    },
    ...(user.role === "producer"
      ? [
          {
            href: "/producer/dashboard",
            icon: User,
            label: "Producer Portal",
            description: "Manage your storefront and orders",
          },
        ]
      : []),
    ...(user.role === "admin"
      ? [
          {
            href: "/admin",
            icon: User,
            label: "Admin Panel",
            description: "Platform management",
          },
        ]
      : []),
  ];

  return (
    <div className="bg-cream min-h-screen pt-20">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Profile header */}
        <div className="mb-8 flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-700 text-2xl font-bold text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">
              {user.name}
            </h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-forest-50 px-2.5 py-0.5 text-xs font-medium capitalize text-forest-700">
              {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {MENU_ITEMS.map(({ href, icon: Icon, label, description }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-forest-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100">
                <Icon className="h-5 w-5 text-forest-700" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>
          ))}

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-red-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
              <LogOut className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-red-600">Sign out</p>
              <p className="text-sm text-gray-400">Sign out of your account</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
