"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Menu,
  Package,
  Plane,
  Search,
  Ship,
  TrainFront,
  Truck,
  X,
  Zap,
} from "lucide-react";

import { brand } from "@/lib/brand";
import { AboutSection } from "@/components/home/about-section";
import { ServicesSection } from "@/components/home/services-section";
import { TrackingPreview } from "@/components/home/tracking-preview";
import { WhyChooseUs } from "@/components/home/why-choose-us";

const trackingModes = [
  { id: "parcel", label: "Parcel", Icon: Package },
  { id: "air", label: "Air", Icon: Plane },
  { id: "ocean", label: "Ocean", Icon: Ship },
  { id: "rail", label: "Rail", Icon: TrainFront },
  { id: "express", label: "Express", Icon: Zap },
];

export default function HomePage() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [trackingMode, setTrackingMode] = useState("parcel");
  const [trackingNumber, setTrackingNumber] = useState("");

  function handleTracking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const number = trackingNumber.trim();

    if (!number) {
      return;
    }

    router.push(`/tracking?number=${encodeURIComponent(number)}`);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] text-white">
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

      <header className="relative z-50 border-b border-white/10 bg-[#0b0b0b]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 lg:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d4a72c]/50 bg-[#d4a72c]/10">
              <span className="text-lg font-black text-[#e6bd4f]">CR</span>
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
            <Link
              href="/"
              className="border-b-2 border-[#d4a72c] py-7 text-sm font-semibold text-[#e6bd4f]"
            >
              Home
            </Link>

            <Link
              href="#about"
              className="py-7 text-sm font-medium text-white/70 transition hover:text-[#e6bd4f]"
            >
              About
            </Link>

            <Link
              href="/services"
              className="py-7 text-sm font-medium text-white/70 transition hover:text-[#e6bd4f]"
            >
              Services
            </Link>

            <Link
              href="#portfolio"
              className="py-7 text-sm font-medium text-white/70 transition hover:text-[#e6bd4f]"
            >
              Portfolio
            </Link>

            <Link
              href="/contact"
              className="py-7 text-sm font-medium text-white/70 transition hover:text-[#e6bd4f]"
            >
              Contact
            </Link>
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href="/tracking"
              className="flex items-center gap-2 rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#efc95d]"
            >
              Track Shipment
              <Truck size={17} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="border-t border-white/10 bg-[#0b0b0b] px-5 py-6 lg:hidden">
            <div className="flex flex-col gap-5">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                Home
              </Link>

              <Link href="#about" onClick={() => setMenuOpen(false)}>
                About
              </Link>

              <Link href="/services" onClick={() => setMenuOpen(false)}>
                Services
              </Link>

              <Link href="#portfolio" onClick={() => setMenuOpen(false)}>
                Portfolio
              </Link>

              <Link href="/contact" onClick={() => setMenuOpen(false)}>
                Contact
              </Link>

              <Link
                href="/tracking"
                onClick={() => setMenuOpen(false)}
                className="rounded-full bg-[#d4a72c] px-5 py-3 text-center font-bold text-black"
              >
                Track Shipment
              </Link>
            </div>
          </nav>
        )}
      </header>

      <section
        className="relative flex min-h-[calc(100vh-114px)] items-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=85')",
        }}
      >
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-20 lg:px-6 lg:py-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a72c]/40 bg-[#d4a72c]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#efc95d]">
              <CheckCircle2 size={15} />
              International freight and courier
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Precision across{" "}
              <span className="text-[#d4a72c]">every mile.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">
              Intelligent shipment visibility, structured route checkpoints and
              dependable global logistics for businesses and individuals.
            </p>

            <form
              onSubmit={handleTracking}
              className="mt-9 max-w-2xl rounded-3xl border border-white/15 bg-black/50 p-4 shadow-2xl backdrop-blur-xl sm:p-5"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                Select service mode
              </p>

              <div className="mb-4 flex flex-wrap gap-2">
                {trackingModes.map(({ id, label, Icon }) => {
                  const selected = trackingMode === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTrackingMode(id)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${
                        selected
                          ? "border-[#d4a72c] bg-[#d4a72c] font-bold text-black"
                          : "border-white/10 bg-white/5 text-white/60 hover:border-[#d4a72c]/50 hover:text-white"
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4">
                  <Search size={19} className="shrink-0 text-white/40" />

                  <input
                    value={trackingNumber}
                    onChange={(event) =>
                      setTrackingNumber(event.target.value.toUpperCase())
                    }
                    placeholder="Enter tracking or reference number"
                    className="h-14 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />
                </label>

                <button
                  type="submit"
                  className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#d4a72c] px-7 font-bold text-black transition hover:bg-[#efc95d]"
                >
                  Track
                  <ArrowRight size={18} />
                </button>
              </div>

              <p className="mt-3 text-xs leading-5 text-white/35">
                No account required. Results show the latest verified
                operational update.
              </p>
            </form>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/services"
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-[#d4a72c]"
              >
                View capabilities
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/contact"
                className="rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-[#d4a72c] hover:text-[#efc95d]"
              >
                Request information
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl md:grid-cols-4 lg:mt-24">
            {brand.statistics.map((stat) => (
              <div
                key={stat.label}
                className="border-b border-r border-white/10 p-5 last:border-r-0 md:border-b-0 lg:p-6"
              >
                <p className="text-2xl font-black text-[#e6bd4f] lg:text-3xl">
                  {stat.value}
                </p>

                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <AboutSection />
      <ServicesSection />
      <TrackingPreview />
      <WhyChooseUs />
    </main>
  );
}
