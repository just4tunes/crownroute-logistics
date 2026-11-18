"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BellRing,
  Boxes,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  Mail,
  Menu,
  PackagePlus,
  Route,
  X,
} from "lucide-react";

import { LogoutButton } from "@/components/admin/logout-button";

const navigationLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    Icon: LayoutDashboard,
  },
  {
    label: "Shipments",
    href: "/admin/shipments",
    Icon: Boxes,
  },
  {
    label: "Create shipment",
    href: "/admin/shipments/new",
    Icon: PackagePlus,
  },
  {
    label: "Shipment fee payments",
    href: "/admin/shipment-charges",
    Icon: CircleDollarSign,
  },
  {
    label: "Registration payments",
    href: "/admin/registration-payments",
    Icon: CreditCard,
  },
  {
    label: "Route management",
    href: "/admin/routes",
    Icon: Route,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    Icon: BellRing,
  },
  {
    label: "Messages",
    href: "/admin/messages",
    Icon: Mail,
  },
];

function isActiveLink(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  if (href === "/admin/shipments") {
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) &&
        pathname !== "/admin/shipments/new")
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-white/10 bg-[#0c0c0c] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6bd4f]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d4a72c]/40 bg-[#d4a72c]/10 text-lg font-black text-[#e6bd4f]">
              CR
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black uppercase tracking-[0.12em]">
                CrownRoute
              </span>
              <span className="block text-[9px] uppercase tracking-[0.3em] text-[#d4a72c]">
                Logistics
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <div className="w-28 sm:w-36">
              <LogoutButton />
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
              aria-expanded={menuOpen}
              aria-controls="admin-navigation"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/70 transition hover:border-[#d4a72c]/50 hover:text-[#e6bd4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6bd4f] lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <nav
          id="admin-navigation"
          aria-label="Admin navigation"
          className={`mt-4 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid lg:grid-cols-4 ${
            menuOpen ? "grid" : "hidden"
          }`}
        >
          {navigationLinks.map(({ label, href, Icon }) => {
            const active = isActiveLink(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={`flex min-h-11 min-w-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6bd4f] sm:px-4 sm:text-sm ${
                  active
                    ? "bg-[#d4a72c] text-black"
                    : "text-white/55 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon size={17} className="shrink-0" />
                <span className="min-w-0 break-words">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
