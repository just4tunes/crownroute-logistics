import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  MapPin,
  PackagePlus,
  Search,
} from "lucide-react";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { Shipment } from "@/models/shipment";

export const dynamic = "force-dynamic";

type ShipmentRecord = {
  _id: {
    toString(): string;
  };
  trackingNumber: string;
  recipient: {
    name: string;
  };
  origin: {
    city: string;
    country: string;
  };
  destination: {
    city: string;
    country: string;
  };
  serviceMode: string;
  status: string;
  progress: number;
  estimatedDelivery?: Date;
  createdAt: Date;
};

export default async function AdminShipmentsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  await connectToDatabase();

  const admin = await Admin.exists({
    _id: session.adminId,
    isActive: true,
  });

  if (!admin) {
    redirect("/admin/login");
  }

  const shipmentResults = await Shipment.find({})
    .sort({
      createdAt: -1,
    })
    .select(
      "trackingNumber recipient.name origin destination serviceMode status progress estimatedDelivery createdAt",
    )
    .lean();

  const shipments =
    shipmentResults as unknown as ShipmentRecord[];

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-[#e6bd4f]"
            >
              <ArrowLeft size={17} />
              Back to dashboard
            </Link>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
              Shipment management
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              All shipments
            </h1>

            <p className="mt-3 text-sm text-white/40">
              Select a shipment to update its route, progress and
              notifications.
            </p>
          </div>

          <Link
            href="/admin/shipments/new"
            className="flex w-fit items-center gap-2 rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-black text-black transition hover:bg-[#efc95d]"
          >
            <PackagePlus size={18} />
            New shipment
          </Link>
        </div>

        <div className="mt-9 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111111] px-5">
          <Search size={19} className="text-white/30" />

          <input
            type="search"
            placeholder="Search shipments using your browser search for now"
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-white/25"
          />
        </div>

        {shipments.length === 0 ? (
          <section className="mt-8 flex min-h-96 flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#111111] px-6 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#d4a72c]/10 text-[#e6bd4f]">
              <Boxes size={34} />
            </span>

            <h2 className="mt-6 text-2xl font-black">
              No shipments available
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-7 text-white/40">
              Create a shipment to begin managing its tracking
              progress.
            </p>

            <Link
              href="/admin/shipments/new"
              className="mt-6 rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-black text-black"
            >
              Create shipment
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-5 lg:grid-cols-2">
            {shipments.map((shipment) => (
              <Link
                key={shipment._id.toString()}
                href={`/admin/shipments/${shipment._id.toString()}`}
                className="group rounded-3xl border border-white/10 bg-[#111111] p-6 transition hover:-translate-y-1 hover:border-[#d4a72c]/50"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/30">
                      Tracking number
                    </p>

                    <p className="mt-2 text-lg font-black text-[#e6bd4f]">
                      {shipment.trackingNumber}
                    </p>
                  </div>

                  <StatusBadge status={shipment.status} />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <InfoItem
                    label="Origin"
                    value={`${shipment.origin.city}, ${shipment.origin.country}`}
                  />

                  <InfoItem
                    label="Destination"
                    value={`${shipment.destination.city}, ${shipment.destination.country}`}
                  />

                  <InfoItem
                    label="Recipient"
                    value={shipment.recipient.name}
                  />

                  <InfoItem
                    label="Service"
                    value={formatLabel(shipment.serviceMode)}
                  />
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white/45">
                      Route progress
                    </p>

                    <p className="text-sm font-black text-[#e6bd4f]">
                      {shipment.progress}%
                    </p>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#98700f] to-[#f2cf68]"
                      style={{
                        width: `${Math.min(
                          Math.max(shipment.progress, 0),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-white/30">
                  <span className="flex items-center gap-2">
                    <CalendarDays size={14} />
                    Delivery:{" "}
                    {formatDate(shipment.estimatedDelivery)}
                  </span>

                  <span className="font-bold text-[#d4a72c] transition group-hover:text-[#f2cf68]">
                    Manage shipment →
                  </span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <MapPin
        size={16}
        className="mt-0.5 shrink-0 text-[#d4a72c]"
      />

      <div>
        <p className="text-[10px] uppercase tracking-wider text-white/25">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-white/65">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    created: "bg-white/10 text-white/60",
    processing: "bg-violet-400/10 text-violet-300",
    in_transit: "bg-blue-400/10 text-blue-300",
    customs: "bg-amber-400/10 text-amber-300",
    held: "bg-red-400/10 text-red-300",
    delayed: "bg-orange-400/10 text-orange-300",
    out_for_delivery: "bg-cyan-400/10 text-cyan-300",
    delivered: "bg-emerald-400/10 text-emerald-300",
    cancelled: "bg-red-400/10 text-red-300",
  };

  return (
    <span
      className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
        styles[status] ?? styles.created
      }`}
    >
      {formatLabel(status)}
    </span>
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function formatDate(value?: Date) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}