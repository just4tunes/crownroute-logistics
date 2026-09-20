"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Mail,
  Menu,
  Truck,
  X,
} from "lucide-react";

import { brand } from "@/lib/brand";

const navigation = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "About",
    href: "/#about",
  },
  {
    label: "Services",
    href: "/services",
  },
  {
    label: "Portfolio",
    href: "/portfolio",
  },
  {
    label: "Contact",
    href: "/contact",
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] =
    useState(false);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    if (href.startsWith("/#")) {
      return false;
    }

    return pathname.startsWith(href);
  }

  return (
    <>
      <div className="hidden border-b border-white/10 bg-[#070707] lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 text-xs text-white/65">
          <div className="flex items-center gap-6">
            <a
              href={`tel:${brand.contact.phone}`}
              className="transition hover:text-[#e6bd4f]"
            >
              {brand.contact.phone}
            </a>

            <a
              href={`mailto:${brand.contact.email}`}
              className="flex items-center gap-2 transition hover:text-[#e6bd4f]"
            >
              <Mail size={14} />
              {brand.contact.email}
            </a>
          </div>

          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              All systems operational
            </span>

            <span className="h-4 w-px bg-white/15" />

            <span>24/7 global support</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b0b]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 lg:px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d4a72c]/50 bg-[#d4a72c]/10">
              <span className="text-lg font-black text-[#e6bd4f]">
                CR
              </span>
            </span>

            <span>
              <span className="block text-base font-black uppercase tracking-[0.12em]">
                CrownRoute
              </span>

              <span className="block text-[9px] uppercase tracking-[0.34em] text-[#d4a72c]">
                Logistics
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {navigation.map((item) => {
              const active = isActive(
                item.href,
              );

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`py-7 text-sm transition ${
                    active
                      ? "border-b-2 border-[#d4a72c] font-semibold text-[#e6bd4f]"
                      : "font-medium text-white/70 hover:text-[#e6bd4f]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/tracking"
            className="hidden items-center gap-2 rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#efc95d] lg:flex"
          >
            Track Shipment
            <Truck size={17} />
          </Link>

          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (current) => !current,
              )
            }
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>

        {menuOpen && (
          <nav className="border-t border-white/10 bg-[#0b0b0b] px-5 py-6 lg:hidden">
            <div className="flex flex-col gap-5">
              {navigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className={
                    isActive(item.href)
                      ? "font-bold text-[#e6bd4f]"
                      : "text-white/70"
                  }
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/tracking"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="rounded-full bg-[#d4a72c] px-5 py-3 text-center font-bold text-black"
              >
                Track Shipment
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}