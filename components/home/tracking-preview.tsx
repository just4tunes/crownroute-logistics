import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  Navigation,
  PackageCheck,
} from "lucide-react";

const checkpoints = [
  {
    name: "New York Distribution Centre",
    detail: "Shipment processed",
    status: "complete",
  },
  {
    name: "John F. Kennedy International Airport",
    detail: "Departed origin airport",
    status: "complete",
  },
  {
    name: "London Heathrow Airport",
    detail: "Shipment currently in transit",
    status: "active",
  },
  {
    name: "United Kingdom Customs Facility",
    detail: "Awaiting arrival",
    status: "pending",
  },
  {
    name: "Recipient Delivery Address",
    detail: "Final delivery",
    status: "pending",
  },
];

export function TrackingPreview() {
  return (
    <section className="relative overflow-hidden bg-[#090909] py-20 lg:py-28">
      <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-[#d4a72c]/10 blur-[120px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:px-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#d4a72c]">
            Intelligent tracking
          </p>

          <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
            Follow every important stop in real time
          </h2>

          <p className="mt-6 max-w-xl text-base leading-8 text-white/50">
            CrownRoute converts shipment routes into clear operational
            checkpoints. Customers can see completed stops, current movement,
            delivery estimates and important notices.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm text-white/70">
              <Navigation size={19} className="text-[#d4a72c]" />
              Location and coordinate updates
            </div>

            <div className="flex items-center gap-3 text-sm text-white/70">
              <PackageCheck size={19} className="text-[#d4a72c]" />
              Automatically calculated shipment progress
            </div>

            <div className="flex items-center gap-3 text-sm text-white/70">
              <Clock3 size={19} className="text-[#d4a72c]" />
              Delay, hold and customs notifications
            </div>
          </div>

          <Link
            href="/tracking"
            className="mt-9 flex w-fit items-center gap-2 rounded-full bg-[#d4a72c] px-6 py-3.5 text-sm font-bold text-black transition hover:bg-[#efc95d]"
          >
            Open tracking
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-8">
          <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                Tracking number
              </p>

              <p className="mt-2 text-xl font-black text-[#e6bd4f]">
                CRL-839274-UK
              </p>
            </div>

            <span className="w-fit rounded-full border border-blue-400/25 bg-blue-400/10 px-4 py-2 text-xs font-bold text-blue-300">
              In transit
            </span>
          </div>

          <div className="py-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-bold">Shipment progress</p>
                <p className="mt-1 text-xs text-white/35">
                  New York, USA → London, England
                </p>
              </div>

              <p className="text-2xl font-black text-[#e6bd4f]">56%</p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[56%] rounded-full bg-gradient-to-r from-[#9b7010] to-[#f2cf68]" />
            </div>
          </div>

          <div className="space-y-0">
            {checkpoints.map((checkpoint, index) => {
              const complete = checkpoint.status === "complete";
              const active = checkpoint.status === "active";

              return (
                <div key={checkpoint.name} className="relative flex gap-4 pb-7">
                  {index !== checkpoints.length - 1 && (
                    <span
                      className={`absolute left-[17px] top-9 h-full w-px ${
                        complete ? "bg-[#d4a72c]" : "bg-white/10"
                      }`}
                    />
                  )}

                  <span
                    className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                      complete
                        ? "border-[#d4a72c] bg-[#d4a72c] text-black"
                        : active
                          ? "border-[#d4a72c] bg-[#d4a72c]/15 text-[#e6bd4f]"
                          : "border-white/15 bg-[#171717] text-white/30"
                    }`}
                  >
                    {complete ? (
                      <Check size={17} strokeWidth={3} />
                    ) : (
                      <MapPin size={16} />
                    )}
                  </span>

                  <div className="pt-0.5">
                    <p
                      className={`text-sm font-bold ${
                        active ? "text-[#e6bd4f]" : "text-white"
                      }`}
                    >
                      {checkpoint.name}
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      {checkpoint.detail}
                    </p>

                    {active && (
                      <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#d4a72c]">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#d4a72c]" />
                        Current checkpoint
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}