import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  PauseCircle,
  Route,
  Settings2,
  Truck,
} from "lucide-react";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { Shipment } from "@/models/shipment";

export const dynamic = "force-dynamic";

type RouteCheckpoint = {
  _id?: {
    toString(): string;
  };
  location: string;
  city: string;
  country: string;
  status: "pending" | "active" | "completed";
  estimatedArrival?: Date;
};

type RouteShipment = {
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
  status: string;
  progress: number;
  autoProgressEnabled: boolean;
  arrivalDate?: Date;
  estimatedDelivery?: Date;
  checkpoints: RouteCheckpoint[];
};

export default async function RouteManagementPage() {
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
      [
        "trackingNumber",
        "recipient.name",
        "origin",
        "destination",
        "status",
        "progress",
        "autoProgressEnabled",
        "arrivalDate",
        "estimatedDelivery",
        "checkpoints",
      ].join(" "),
    )
    .lean();

  const shipments =
    shipmentResults as unknown as RouteShipment[];

  const activeRoutes = shipments.filter(
    (shipment) =>
      ![
        "delivered",
        "cancelled",
        "held",
        "delayed",
      ].includes(shipment.status),
  ).length;

  const pausedRoutes = shipments.filter(
    (shipment) =>
      shipment.status === "held" ||
      shipment.status === "delayed",
  ).length;

  const completedRoutes = shipments.filter(
    (shipment) =>
      shipment.status === "delivered",
  ).length;

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-[#e6bd4f]"
            >
              <ArrowLeft size={17} />
              Back to dashboard
            </Link>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
              Route operations
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Route management
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
              Monitor generated routes, active checkpoints,
              automatic progression and paused shipments.
            </p>
          </div>

          <Link
            href="/admin/shipments"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-black text-black transition hover:bg-[#efc95d]"
          >
            <Settings2 size={17} />
            Manage shipments
          </Link>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Statistic
            label="Active routes"
            value={activeRoutes}
            Icon={Truck}
            color="text-blue-300"
            background="bg-blue-400/10"
          />

          <Statistic
            label="Paused routes"
            value={pausedRoutes}
            Icon={PauseCircle}
            color="text-amber-300"
            background="bg-amber-400/10"
          />

          <Statistic
            label="Completed routes"
            value={completedRoutes}
            Icon={CheckCircle2}
            color="text-emerald-300"
            background="bg-emerald-400/10"
          />
        </section>

        {shipments.length === 0 ? (
          <section className="mt-8 flex min-h-96 flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#111111] px-6 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#d4a72c]/10 text-[#e6bd4f]">
              <Route size={34} />
            </span>

            <h2 className="mt-6 text-2xl font-black">
              No routes available
            </h2>

            <p className="mt-3 text-sm text-white/40">
              Routes will appear after a shipment is created.
            </p>

            <Link
              href="/admin/shipments/new"
              className="mt-6 rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-black text-black"
            >
              Create shipment
            </Link>
          </section>
        ) : (
          <section className="mt-8 space-y-5">
            {shipments.map((shipment) => {
              const activeCheckpoint =
                shipment.checkpoints.find(
                  (checkpoint) =>
                    checkpoint.status === "active",
                );

              const completedCheckpoints =
                shipment.checkpoints.filter(
                  (checkpoint) =>
                    checkpoint.status === "completed",
                ).length;

              const deliveryDate =
                shipment.arrivalDate ??
                shipment.estimatedDelivery;

              return (
                <article
                  key={shipment._id.toString()}
                  className="rounded-3xl border border-white/10 bg-[#111111] p-6"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-black text-[#e6bd4f]">
                          {shipment.trackingNumber}
                        </p>

                        <StatusBadge
                          status={shipment.status}
                        />

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            shipment.autoProgressEnabled
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-white/10 text-white/40"
                          }`}
                        >
                          {shipment.autoProgressEnabled
                            ? "Automatic"
                            : "Manual"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-white/45">
                        Recipient:{" "}
                        {shipment.recipient.name}
                      </p>
                    </div>

                    <Link
                      href={`/admin/shipments/${shipment._id.toString()}`}
                      className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d4a72c]/40 px-4 py-2 text-xs font-black text-[#e6bd4f] transition hover:bg-[#d4a72c]/10"
                    >
                      <Settings2 size={15} />
                      Manage route
                    </Link>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <Information
                      Icon={MapPin}
                      label="Origin"
                      value={`${shipment.origin.city}, ${shipment.origin.country}`}
                    />

                    <Information
                      Icon={MapPin}
                      label="Destination"
                      value={`${shipment.destination.city}, ${shipment.destination.country}`}
                    />

                    <Information
                      Icon={CalendarDays}
                      label="Scheduled delivery"
                      value={formatDate(deliveryDate)}
                    />
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-white/30">
                          Current checkpoint
                        </p>

                        <p className="mt-2 text-sm font-bold">
                          {activeCheckpoint
                            ? `${activeCheckpoint.location} — ${activeCheckpoint.city}, ${activeCheckpoint.country}`
                            : shipment.status === "delivered"
                              ? "Route completed"
                              : "No active checkpoint"}
                        </p>

                        {activeCheckpoint && (
                          <p className="mt-1 text-xs text-white/35">
                            Scheduled:{" "}
                            {formatDate(
                              activeCheckpoint.estimatedArrival,
                            )}
                          </p>
                        )}
                      </div>

                      <p className="text-sm font-black text-[#e6bd4f]">
                        {completedCheckpoints}/
                        {shipment.checkpoints.length} stops
                      </p>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#98700f] to-[#f2cf68]"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              shipment.progress,
                              0,
                            ),
                            100,
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-[10px] font-bold text-white/30">
                      <span>Route progress</span>
                      <span>
                        {shipment.progress}%
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

type StatisticProps = {
  label: string;
  value: number;
  Icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  color: string;
  background: string;
};

function Statistic({
  label,
  value,
  Icon,
  color,
  background,
}: StatisticProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#111111] p-5">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${background} ${color}`}
      >
        <Icon size={20} />
      </span>

      <p className="mt-5 text-3xl font-black">
        {value}
      </p>

      <p className="mt-1 text-xs font-bold text-white/45">
        {label}
      </p>
    </article>
  );
}

function Information({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        size={17}
        className="mt-0.5 shrink-0 text-[#d4a72c]"
      />

      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-white/25">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-white/65">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    created: "bg-white/10 text-white/60",
    processing:
      "bg-violet-400/10 text-violet-300",
    in_transit:
      "bg-blue-400/10 text-blue-300",
    customs: "bg-amber-400/10 text-amber-300",
    held: "bg-red-400/10 text-red-300",
    delayed:
      "bg-orange-400/10 text-orange-300",
    out_for_delivery:
      "bg-cyan-400/10 text-cyan-300",
    delivered:
      "bg-emerald-400/10 text-emerald-300",
    cancelled: "bg-red-400/10 text-red-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
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
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(value?: Date) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}