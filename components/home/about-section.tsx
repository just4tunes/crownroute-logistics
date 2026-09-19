import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  Phone,
} from "lucide-react";

import { brand } from "@/lib/brand";

const benefits = [
  "International freight coordination",
  "Intelligent route checkpoints",
  "Verified tracking updates",
  "Dedicated account management",
  "Multi-modal freight flexibility",
];

export function AboutSection() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[#f4f0e6] py-20 text-[#111111] lg:py-28"
    >
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#d4a72c]/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-6">
        <div className="relative">
          <div
            className="min-h-[520px] rounded-[2rem] bg-cover bg-center shadow-2xl"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=1400&q=85')",
            }}
          />

          <div className="absolute -bottom-7 right-5 rounded-3xl border border-white/20 bg-[#111111] p-6 text-white shadow-2xl sm:right-8">
            <p className="text-4xl font-black text-[#e6bd4f]">25+</p>
            <p className="mt-1 text-sm text-white/60">Years of excellence</p>
          </div>

          <div className="absolute left-5 top-5 flex items-center gap-3 rounded-2xl bg-[#d4a72c] px-4 py-3 text-black shadow-xl">
            <Headphones size={22} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider">
                Support
              </p>
              <p className="text-sm font-black">Available 24/7</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#a87e13]">
            About CrownRoute
          </p>

          <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
            A premium standard in global transportation
          </h2>

          <p className="mt-6 max-w-xl text-base leading-8 text-black/60">
            CrownRoute Logistics is more than a transportation company. We are
            your trusted partner for freight coordination, supply-chain
            visibility and dependable delivery across international routes.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-[#b68a18]"
                />
                <span className="text-sm font-semibold text-black/75">
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/services"
              className="flex w-fit items-center gap-2 rounded-full bg-[#111111] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#d4a72c] hover:text-black"
            >
              Learn more
              <ArrowRight size={17} />
            </Link>

            <a
              href={`tel:${brand.contact.phone}`}
              className="flex items-center gap-3"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d4a72c] text-black">
                <Phone size={19} />
              </span>

              <span>
                <span className="block text-xs text-black/45">
                  Call us anytime
                </span>
                <span className="block text-sm font-black">
                  {brand.contact.phone}
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}