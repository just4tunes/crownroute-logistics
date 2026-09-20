import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { brand } from "@/lib/brand";

const serviceLinks = [
  "Parcel delivery",
  "Air freight",
  "Ocean freight",
  "Rail freight",
  "Express delivery",
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#060606] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div>
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d4a72c]/50 bg-[#d4a72c]/10 text-lg font-black text-[#e6bd4f]">
              CR
            </span>

            <span>
              <span className="block font-black uppercase tracking-[0.12em]">
                CrownRoute
              </span>

              <span className="block text-[9px] uppercase tracking-[0.34em] text-[#d4a72c]">
                Logistics
              </span>
            </span>
          </Link>

          <p className="mt-5 max-w-xs text-sm leading-7 text-white/40">
            Structured global logistics,
            reliable shipment visibility and
            professional freight coordination.
          </p>

          <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-300">
            <ShieldCheck size={16} />
            Secure shipment management
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.15em] text-[#e6bd4f]">
            Company
          </h2>

          <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">
            <Link
              href="/#about"
              className="hover:text-white"
            >
              About CrownRoute
            </Link>

            <Link
              href="/services"
              className="hover:text-white"
            >
              Services
            </Link>

            <Link
              href="/portfolio"
              className="hover:text-white"
            >
              Portfolio
            </Link>

            <Link
              href="/contact"
              className="hover:text-white"
            >
              Contact
            </Link>

            <Link
              href="/tracking"
              className="hover:text-white"
            >
              Track shipment
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.15em] text-[#e6bd4f]">
            Services
          </h2>

          <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">
            {serviceLinks.map((service) => (
              <Link
                key={service}
                href="/services"
                className="hover:text-white"
              >
                {service}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.15em] text-[#e6bd4f]">
            Contact
          </h2>

          <div className="mt-5 space-y-4 text-sm text-white/45">
            <a
              href={`mailto:${brand.contact.email}`}
              className="flex items-start gap-3 hover:text-white"
            >
              <Mail
                size={17}
                className="mt-0.5 shrink-0 text-[#d4a72c]"
              />
              {brand.contact.email}
            </a>

            <a
              href={`tel:${brand.contact.phone}`}
              className="flex items-start gap-3 hover:text-white"
            >
              <Phone
                size={17}
                className="mt-0.5 shrink-0 text-[#d4a72c]"
              />
              {brand.contact.phone}
            </a>

            <div className="flex items-start gap-3">
              <MapPin
                size={17}
                className="mt-0.5 shrink-0 text-[#d4a72c]"
              />

              <span>
                Global logistics support
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-6 text-xs text-white/25 sm:flex-row lg:px-6">
          <p>
            © {new Date().getFullYear()} CrownRoute
            Logistics. All rights reserved.
          </p>

          <p>
            Global freight and shipment
            visibility.
          </p>
        </div>
      </div>
    </footer>
  );
}