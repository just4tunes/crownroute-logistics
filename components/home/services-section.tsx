import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Clock3,
  Container,
  Globe2,
  PackageCheck,
  Plane,
} from "lucide-react";

const services = [
  {
    title: "Air Freight",
    description:
      "Fast international air-cargo coordination for urgent and high-value shipments.",
    Icon: Plane,
  },
  {
    title: "Ocean Freight",
    description:
      "Dependable full-container and shared-container shipping across global ports.",
    Icon: Container,
  },
  {
    title: "Express Delivery",
    description:
      "Priority collection and delivery services for time-sensitive consignments.",
    Icon: Clock3,
  },
  {
    title: "International Shipping",
    description:
      "End-to-end worldwide transportation with customs and route coordination.",
    Icon: Globe2,
  },
  {
    title: "Warehousing",
    description:
      "Secure storage, inventory handling and distribution for growing businesses.",
    Icon: Boxes,
  },
  {
    title: "Last-Mile Delivery",
    description:
      "Reliable final-stage delivery from regional facilities to the recipient.",
    Icon: PackageCheck,
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="bg-[#0a0a0a] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-6">
        <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#d4a72c]">
              Our services
            </p>

            <h2 className="mt-4 max-w-2xl text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
              Your gateway to seamless transportation
            </h2>
          </div>

          <p className="max-w-md text-sm leading-7 text-white/50">
            From individual parcels to complex international freight,
            CrownRoute provides structured logistics solutions with clear,
            verified shipment visibility.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ title, description, Icon }, index) => (
            <article
              key={title}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#111111] p-7 transition duration-300 hover:-translate-y-2 hover:border-[#d4a72c]/60"
            >
              <span className="absolute right-6 top-5 text-5xl font-black text-white/[0.035]">
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4a72c]/30 bg-[#d4a72c]/10 text-[#e6bd4f] transition group-hover:bg-[#d4a72c] group-hover:text-black">
                <Icon size={25} />
              </div>

              <h3 className="mt-7 text-xl font-black">{title}</h3>

              <p className="mt-3 text-sm leading-7 text-white/45">
                {description}
              </p>

              <Link
                href="/services"
                className="mt-7 flex items-center gap-2 text-sm font-bold text-[#d4a72c]"
              >
                Explore service
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/services"
            className="flex items-center gap-2 rounded-full border border-[#d4a72c]/50 px-7 py-3.5 text-sm font-bold text-[#e6bd4f] transition hover:bg-[#d4a72c] hover:text-black"
          >
            View all services
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}