import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  BarChart3,
  Leaf,
} from "lucide-react";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/producers", icon: Users, label: "Producers" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-56 shrink-0 border-r border-gray-100 bg-white lg:block">
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
          <Leaf className="h-5 w-5 text-harvest-600" />
          <span className="font-display font-semibold text-gray-800">
            Admin Panel
          </span>
        </div>
        <nav className="p-3">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-forest-50 hover:text-forest-700"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 px-5">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-forest-600"
          >
            ← Back to marketplace
          </Link>
        </div>
      </aside>

      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-4 lg:hidden">
        <Leaf className="h-5 w-5 text-harvest-600" />
        <span className="font-display font-semibold text-gray-800">
          Admin Panel
        </span>
        <div className="ml-auto flex gap-1">
          {NAV.map(({ href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <Icon className="h-4 w-4" />
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
