import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Clock3,
  Container,
  Globe2,
  MapPinned,
  Package,
  Plane,
  Route,
  ShieldCheck,
  Ship,
  TrainFront,
  Truck,
  Warehouse,
  Zap,
} from "lucide-react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export const metadata: Metadata = {
  title: "Logistics Services | CrownRoute Logistics",
  description:
    "Explore CrownRoute parcel delivery, air freight, ocean freight, rail logistics, express delivery and shipment tracking services.",
};

const services = [
  {
    title: "Parcel delivery",
    description:
      "Dependable parcel movement for individuals, retailers and growing businesses, supported by structured tracking checkpoints.",
    Icon: Package,
    features: [
      "Domestic and international delivery",
      "Scheduled route checkpoints",
      "Recipient tracking access",
      "Delivery status notifications",
    ],
  },
  {
    title: "Air freight",
    description:
      "Time-sensitive international air cargo coordination with origin processing, airport transit and destination visibility.",
    Icon: Plane,
    features: [
      "Priority cargo handling",
      "Airport-to-airport coordination",
      "Customs checkpoint visibility",
      "Estimated arrival scheduling",
    ],
  },
  {
    title: "Ocean freight",
    description:
      "Structured ocean cargo services for larger shipments requiring dependable port-to-port freight coordination.",
    Icon: Ship,
    features: [
      "Port departure coordination",
      "International waters tracking",
      "Destination port processing",
      "Customs and final-mile updates",
    ],
  },
  {
    title: "Rail freight",
    description:
      "Efficient regional and cross-country rail transportation for commercial cargo and scheduled freight movements.",
    Icon: TrainFront,
    features: [
      "Rail terminal coordination",
      "Regional transit visibility",
      "Distribution-centre updates",
      "Final delivery scheduling",
    ],
  },
  {
    title: "Express delivery",
    description:
      "Priority logistics for urgent documents, parcels and business shipments that need faster operational handling.",
    Icon: Zap,
    features: [
      "Priority collection",
      "Express sorting",
      "Accelerated transit",
      "Courier delivery updates",
    ],
  },
  {
    title: "Freight coordination",
    description:
      "End-to-end coordination for complex shipments involving multiple transportation and processing stages.",
    Icon: Container,
    features: [
      "Multi-stage route planning",
      "Shipment progress monitoring",
      "Operational notifications",
      "Destination coordination",
    ],
  },
];

const processSteps = [
  {
    number: "01",
    title: "Shipment planning",
    description:
      "We identify the service mode, origin, destination, shipment requirements and expected delivery schedule.",
  },
  {
    number: "02",
    title: "Collection and processing",
    description:
      "The shipment is registered, assigned a tracking number and prepared for its selected transportation route.",
  },
  {
    number: "03",
    title: "Transit visibility",
    description:
      "Route checkpoints, current progress and important operational notifications remain available through tracking.",
  },
  {
    number: "04",
    title: "Final delivery",
    description:
      "The shipment reaches its destination network and progresses through final delivery to the recipient.",
  },
];

const capabilities = [
  {
    title: "Global coordination",
    description:
      "Structured shipment support across origin, transit and destination locations.",
    Icon: Globe2,
  },
  {
    title: "Route visibility",
    description:
      "Clear progress information through scheduled and verified checkpoints.",
    Icon: MapPinned,
  },
  {
    title: "Secure handling",
    description:
      "Controlled administrative updates and protected shipment information.",
    Icon: ShieldCheck,
  },
  {
    title: "Operational support",
    description:
      "Shipment notifications for delays, customs activity, holds and delivery.",
    Icon: Clock3,
  },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] text-white">
      <SiteHeader />

      <section
        className="relative flex min-h-[620px] items-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=2000&q=85')",
        }}
      >
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-24 lg:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a72c]/40 bg-[#d4a72c]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#efc95d]">
              <Route size={15} />
              Logistics capabilities
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Built to move what{" "}
              <span className="text-[#d4a72c]">
                matters.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/60 sm:text-lg">
              From priority parcels to international freight,
              CrownRoute provides structured transportation,
              route visibility and professional shipment
              coordination.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="flex items-center gap-2 rounded-full bg-[#d4a72c] px-7 py-3.5 text-sm font-black text-black transition hover:bg-[#efc95d]"
              >
                Request a shipment
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/tracking"
                className="rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold transition hover:border-[#d4a72c] hover:text-[#e6bd4f]"
              >
                Track shipment
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
              What we provide
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              A service for every route.
            </h2>

            <p className="mt-5 text-base leading-8 text-white/45">
              Select the transportation method that matches
              your shipment size, destination and expected
              delivery schedule.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map(
              ({
                title,
                description,
                Icon,
                features,
              }) => (
                <article
                  key={title}
                  className="group rounded-3xl border border-white/10 bg-[#111111] p-7 transition hover:-translate-y-1 hover:border-[#d4a72c]/45"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4a72c]/25 bg-[#d4a72c]/10 text-[#e6bd4f] transition group-hover:bg-[#d4a72c] group-hover:text-black">
                    <Icon size={25} />
                  </span>

                  <h3 className="mt-6 text-xl font-black">
                    {title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-white/40">
                    {description}
                  </p>

                  <ul className="mt-6 space-y-3">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm text-white/55"
                      >
                        <CheckCircle2
                          size={16}
                          className="mt-0.5 shrink-0 text-[#d4a72c]"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0c0c0c] px-5 py-20 lg:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
                Our process
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Clear from collection to delivery.
              </h2>

              <p className="mt-5 text-base leading-8 text-white/45">
                Each shipment is organised around defined
                operational stages, giving customers a clear
                view of how their parcel or cargo progresses.
              </p>

              <div className="mt-8 flex items-center gap-4 rounded-2xl border border-[#d4a72c]/20 bg-[#d4a72c]/[0.06] p-5">
                <Warehouse
                  size={26}
                  className="shrink-0 text-[#e6bd4f]"
                />

                <p className="text-sm leading-6 text-white/55">
                  Every shipment receives a unique tracking
                  number and a route based on its selected
                  transport method and delivery schedule.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {processSteps.map((step) => (
                <article
                  key={step.number}
                  className="rounded-3xl border border-white/10 bg-[#111111] p-6"
                >
                  <span className="text-sm font-black text-[#d4a72c]">
                    {step.number}
                  </span>

                  <h3 className="mt-5 text-lg font-black">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-white/40">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
              CrownRoute standard
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Visibility built into every service.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(
              ({
                title,
                description,
                Icon,
              }) => (
                <article
                  key={title}
                  className="rounded-3xl border border-white/10 bg-[#111111] p-6 text-center"
                >
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#d4a72c]/10 text-[#e6bd4f]">
                    <Icon size={22} />
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

      <section className="px-5 pb-20 lg:px-6 lg:pb-28">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#d4a72c]/25 bg-[#d4a72c] px-7 py-12 text-black sm:px-12 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <Truck size={27} />

              <p className="text-xs font-black uppercase tracking-[0.2em]">
                Start your shipment
              </p>
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Need help selecting the right service?
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-black/65">
              Contact CrownRoute with your shipment origin,
              destination and requirements. Our team will help
              determine the appropriate route.
            </p>
          </div>

          <Link
            href="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-black text-white transition hover:bg-[#191919] lg:mt-0"
          >
            Contact our team
            <ArrowRight size={17} />
          </Link>

          <Box className="absolute -bottom-10 -right-6 h-44 w-44 text-black/[0.06]" />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}