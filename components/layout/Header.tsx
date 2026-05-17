"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBasket,
  Menu,
  X,
  Search,
  User,
  ChevronDown,
  Store,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBasket } from "@/contexts/BasketContext";
import { cn } from "@/lib/utils";
import config from "@/site.config";

const PRODUCER_NAV = [
  { href: "/producer/dashboard", label: "Dashboard" },
  { href: "/producer/products", label: "My Products" },
  { href: "/producer/orders", label: "Orders" },
  { href: "/producer/payouts", label: "Payouts" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { itemCount } = useBasket();

  const isHomepage = pathname === "/";
  const transparent = isHomepage && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        transparent
          ? "bg-transparent"
          : "border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-display text-xl font-semibold",
            transparent ? "text-white" : "text-forest-800",
          )}
        >
          <Store
            className={cn(
              "h-6 w-6 transition-colors",
              transparent ? "text-harvest-400" : "text-forest-600",
            )}
          />
          <span>{config.brand.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/shop"
            className={cn(
              "text-sm font-medium transition-colors",
              transparent
                ? "text-white/90 hover:text-white"
                : "text-gray-600 hover:text-forest-700",
              pathname === "/shop" &&
                !transparent &&
                "font-semibold text-forest-700",
            )}
          >
            Shop
          </Link>
          {config.features.multiProducer && (
            <Link
              href="/producers"
              className={cn(
                "text-sm font-medium transition-colors",
                transparent
                  ? "text-white/90 hover:text-white"
                  : "text-gray-600 hover:text-forest-700",
                pathname === "/producers" &&
                  !transparent &&
                  "font-semibold text-forest-700",
              )}
            >
              Producers
            </Link>
          )}
          {config.features.multiProducer && user?.role === "producer" && (
            <Link
              href="/producer/dashboard"
              className={cn(
                "text-sm font-medium transition-colors",
                transparent
                  ? "text-white/90 hover:text-white"
                  : "text-gray-600 hover:text-forest-700",
              )}
            >
              My Stall
            </Link>
          )}
          {config.features.adminPanel && user?.role === "admin" && (
            <Link
              href="/admin"
              className={cn(
                "text-sm font-medium transition-colors",
                transparent
                  ? "text-white/90 hover:text-white"
                  : "text-gray-600 hover:text-forest-700",
              )}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/shop"
            aria-label="Search"
            className={cn(
              "rounded-full p-2 transition-colors",
              transparent
                ? "text-white hover:bg-white/10"
                : "text-gray-600 hover:bg-gray-100 hover:text-forest-700",
            )}
          >
            <Search className="h-5 w-5" />
          </Link>

          {/* Basket */}
          <Link
            href="/basket"
            aria-label={`Basket, ${itemCount} items`}
            className={cn(
              "relative rounded-full p-2 transition-colors",
              transparent
                ? "text-white hover:bg-white/10"
                : "text-gray-600 hover:bg-gray-100 hover:text-forest-700",
            )}
          >
            <ShoppingBasket className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-harvest-500 text-[10px] font-bold text-white">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {/* Account */}
          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full p-1.5 text-sm font-medium transition-colors",
                  transparent
                    ? "text-white hover:bg-white/10"
                    : "text-gray-600 hover:bg-gray-100 hover:text-forest-700",
                )}
              >
                <User className="h-5 w-5" />
                <ChevronDown className="h-3 w-3" />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-10 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {user.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-forest-50 hover:text-forest-700"
                    >
                      My Account
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-forest-50 hover:text-forest-700"
                    >
                      My Orders
                    </Link>
                    {user.role === "producer" &&
                      PRODUCER_NAV.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-forest-50 hover:text-forest-700"
                        >
                          {item.label}
                        </Link>
                      ))}
                    {config.features.adminPanel && user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-forest-50 hover:text-forest-700"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className={cn(
                "hidden rounded-lg px-4 py-1.5 text-sm font-semibold transition-all md:block",
                transparent
                  ? "border border-white/40 text-white hover:bg-white/10"
                  : "bg-forest-700 text-white hover:bg-forest-800",
              )}
            >
              Sign in
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            className={cn(
              "rounded-full p-2 transition-colors md:hidden",
              transparent
                ? "text-white hover:bg-white/10"
                : "text-gray-600 hover:bg-gray-100",
            )}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-6 pt-2 md:hidden">
          <Link
            href="/shop"
            className="block py-3 text-base font-medium text-gray-700 hover:text-forest-700"
          >
            Shop
          </Link>
          {config.features.multiProducer && (
            <Link
              href="/producers"
              className="block py-3 text-base font-medium text-gray-700 hover:text-forest-700"
            >
              Producers
            </Link>
          )}
          {user ? (
            <>
              <hr className="my-2 border-gray-100" />
              <Link
                href="/account"
                className="block py-3 text-base font-medium text-gray-700 hover:text-forest-700"
              >
                My Account
              </Link>
              <Link
                href="/orders"
                className="block py-3 text-base font-medium text-gray-700 hover:text-forest-700"
              >
                My Orders
              </Link>
              {config.features.multiProducer &&
                user.role === "producer" &&
                PRODUCER_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block py-3 text-base font-medium text-gray-700 hover:text-forest-700"
                  >
                    {item.label}
                  </Link>
                ))}
              <hr className="my-2 border-gray-100" />
              <button
                onClick={handleSignOut}
                className="block py-3 text-base font-medium text-red-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <hr className="my-2 border-gray-100" />
              <Link
                href="/auth/login"
                className="block w-full rounded-xl bg-forest-700 py-3 text-center text-base font-semibold text-white"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="mt-2 block w-full rounded-xl border border-forest-300 py-3 text-center text-base font-semibold text-forest-700"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
