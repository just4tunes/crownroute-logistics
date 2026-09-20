import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Container,
  Globe2,
  MapPin,
  Package,
  Plane,
  Route,
  ShieldCheck,
  Ship,
  TrainFront,
  Truck,
} from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Logistics Portfolio | CrownRoute Logistics",
  description:
    "Explore representative CrownRoute logistics routes, freight capabilities and shipment coordination solutions.",
};

const projects = [
  {
    title: "Transatlantic air freight",
    route: "New York → London",
    category: "Air freight",
    description:
      "A structured international air route covering collection, origin processing, airport departure, international transit, customs and final delivery.",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=85",
    Icon: Plane,
    details: [
      "Airport transit checkpoints",
      "Customs status visibility",
      "Scheduled delivery progression",
    ],
  },
  {
    title: "International ocean cargo",
    route: "Shanghai → Rotterdam",
    category: "Ocean freight",
    description:
      "Port-to-port freight coordination designed for commercial cargo moving through origin terminals, international waters and destination customs.",
    image:
      "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1400&q=85",
    Icon: Ship,
    details: [
      "Origin freight consolidation",
      "International waters stage",
      "Destination port processing",
    ],
  },
  {
    title: "Regional rail movement",
    route: "Berlin → Paris",
    category: "Rail freight",
    description:
      "A regional rail logistics structure connecting origin collection, rail terminals, transit checkpoints and destination distribution.",
    image:
      "https://images.unsplash.com/photo-1473445730015-841f29a9490b?auto=format&fit=crop&w=1400&q=85",
    Icon: TrainFront,
    details: [
      "Rail terminal coordination",
      "Regional route visibility",
      "Distribution-centre updates",
    ],
  },
  {
    title: "Priority business delivery",
    route: "Toronto → Chicago",
    category: "Express delivery",
    description:
      "An accelerated cross-border route for urgent business parcels requiring priority processing and clear delivery-stage visibility.",
    image:
      "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1400&q=85",
    Icon: Truck,
    details: [
      "Priority collection",
      "Express sorting",
      "Courier delivery stage",
    ],
  },
  {
    title: "Commercial container freight",
    route: "Dubai → Lagos",
    category: "Freight coordination",
    description:
      "Multi-stage cargo coordination combining freight processing, international transportation, destination customs and local delivery.",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=85",
    Icon: Container,
    details: [
      "Multi-stage route planning",
      "Destination customs updates",
      "Final-mile coordination",
    ],
  },
  {
    title: "International parcel route",
    route: "London → Accra",
    category: "Parcel delivery",
    description:
      "A customer-focused parcel route with structured sorting, regional transit, destination processing and final courier delivery.",
    image:
      "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=1400&q=85",
    Icon: Package,
    details: [
      "Parcel sorting checkpoints",
      "Recipient tracking access",
      "Delivery notifications",
    ],
  },
];

const principles = [
  {
    title: "Defined route stages",
    description:
      "Every shipment route is structured around clear operational checkpoints.",
    Icon: Route,
  },
  {
    title: "Progress visibility",
    description:
      "Customers can review the latest route stage and overall shipment progress.",
    Icon: Clock3,
  },
  {
    title: "Protected updates",
    description:
      "Administrative controls protect shipment updates and customer notifications.",
    Icon: ShieldCheck,
  },
  {
    title: "Global capability",
    description:
      "Multiple transport modes support regional and international shipment routes.",
    Icon: Globe2,
  },
];

export default function PortfolioPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] text-white">
      <SiteHeader />

      <section
        className="relative flex min-h-[600px] items-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=2000&q=85')",
        }}
      >
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-24 lg:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a72c]/40 bg-[#d4a72c]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#efc95d]">
              <MapPin size={15} />
              Operational portfolio
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Routes designed with{" "}
              <span className="text-[#d4a72c]">
                precision.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
              Explore representative CrownRoute logistics
              solutions across air, ocean, rail, parcel and
              express transportation.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="flex items-center gap-2 rounded-full bg-[#d4a72c] px-7 py-3.5 text-sm font-black text-black transition hover:bg-[#efc95d]"
              >
                Plan your shipment
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/services"
                className="rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold transition hover:border-[#d4a72c] hover:text-[#e6bd4f]"
              >
                Explore services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
              Capability showcase
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Built around real logistics stages.
            </h2>

            <p className="mt-5 text-base leading-8 text-white/45">
              These representative routes demonstrate how
              CrownRoute structures different shipment modes
              from origin collection through final delivery.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {projects.map(
              ({
                title,
                route,
                category,
                description,
                image,
                Icon,
                details,
              }) => (
                <article
                  key={title}
                  className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111] transition hover:-translate-y-1 hover:border-[#d4a72c]/45"
                >
                  <div
                    className="relative h-64 bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${image}')`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-2 text-xs font-bold backdrop-blur">
                      <Icon
                        size={15}
                        className="text-[#e6bd4f]"
                      />
                      {category}
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="flex items-center gap-2 text-sm font-black text-[#efc95d]">
                        <MapPin size={16} />
                        {route}
                      </p>
                    </div>
                  </div>

                  <div className="p-7">
                    <h3 className="text-2xl font-black">
                      {title}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-white/40">
                      {description}
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {details.map((detail) => (
                        <div
                          key={detail}
                          className="rounded-xl border border-white/10 bg-white/[0.025] p-3"
                        >
                          <CheckCircle2
                            size={15}
                            className="text-[#d4a72c]"
                          />

                          <p className="mt-2 text-xs leading-5 text-white/45">
                            {detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0c0c0c] px-5 py-20 lg:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
              Our approach
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Consistency across every transport mode.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/45">
              Different routes require different transportation,
              but every CrownRoute shipment follows the same
              commitment to structured visibility.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(
              ({
                title,
                description,
                Icon,
              }) => (
                <article
                  key={title}
                  className="rounded-3xl border border-white/10 bg-[#111111] p-6 text-center"
                >
                  <span className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-[#d4a72c]/10 text-[#e6bd4f]">
                    <Icon size={23} />
                  </span>

                  <h3 className="mt-5 font-black">
                    {title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-white/40">
                    {description}
                  </p>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-6 lg:py-28">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111] lg:grid-cols-2">
          <div
            className="min-h-[380px] bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=1400&q=85')",
            }}
          />

          <div className="flex flex-col justify-center p-8 sm:p-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4a72c]/10 text-[#e6bd4f]">
              <Truck size={25} />
            </div>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-[#d4a72c]">
              Your route comes next
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Let us structure your shipment journey.
            </h2>

            <p className="mt-5 text-sm leading-7 text-white/45">
              Tell us what you are shipping, where it is
              departing from and where it needs to arrive.
              CrownRoute will help you identify the appropriate
              logistics service.
            </p>

            <Link
              href="/contact"
              className="mt-8 flex w-fit items-center gap-2 rounded-full bg-[#d4a72c] px-7 py-3.5 text-sm font-black text-black transition hover:bg-[#efc95d]"
            >
              Contact CrownRoute
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}