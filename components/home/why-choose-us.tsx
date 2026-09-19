import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Globe2,
  Headphones,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    number: "01",
    title: "Global network",
    description:
      "International freight routes connecting airports, ports, warehouses and distribution centres worldwide.",
    Icon: Globe2,
  },
  {
    number: "02",
    title: "24/7 support",
    description:
      "Our operations team remains available for shipment questions, customs updates and delivery assistance.",
    Icon: Headphones,
  },
  {
    number: "03",
    title: "Secure handling",
    description:
      "Structured checkpoints and verified operational updates protect every shipment from origin to destination.",
    Icon: ShieldCheck,
  },
  {
    number: "04",
    title: "On-time delivery",
    description:
      "Route planning, milestone monitoring and proactive delay notifications keep shipments moving efficiently.",
    Icon: Clock3,
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-[#f4f0e6] py-20 text-[#111111] lg:py-28">
      <div className="mx-auto max-w-7xl px-5 lg:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#a87e13]">
            Why choose us
          </p>

          <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
            Empowering your global delivery experience
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-8 text-black/55">
            The right logistics partner provides more than transportation.
            CrownRoute gives you visibility, accountability and dependable
            support throughout every shipment.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {features.map(({ number, title, description, Icon }) => (
            <article
              key={number}
              className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="absolute right-6 top-4 text-6xl font-black text-black/[0.04]">
                {number}
              </span>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111111] text-[#e6bd4f] transition group-hover:bg-[#d4a72c] group-hover:text-black">
                <Icon size={25} />
              </div>

              <h3 className="mt-7 text-2xl font-black">{title}</h3>

              <p className="mt-3 max-w-lg text-sm leading-7 text-black/55">
                {description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-3xl bg-[#111111] p-7 text-white sm:flex-row lg:px-10">
          <div>
            <p className="text-xl font-black">
              Trusted shipment visibility from pickup to delivery
            </p>

            <p className="mt-2 text-sm text-white/45">
              Track every verified checkpoint using one reference number.
            </p>
          </div>

          <Link
            href="/tracking"
            className="flex shrink-0 items-center gap-2 rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#efc95d]"
          >
            Track a shipment
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}