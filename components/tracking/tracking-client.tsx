"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Info,
  LoaderCircle,
  MapPin,
  Package,
  Search,
  Truck,
  X,
} from "lucide-react";

type Checkpoint = {
  _id?: string;
  location: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  description: string;
  estimatedArrival?: string;
  completedAt?: string;
  status: "pending" | "active" | "completed";
};

type ShipmentNotification = {
  _id?: string;
  title: string;
  message: string;
  type: "information" | "success" | "warning" | "critical";
  showAsPopup: boolean;
  createdAt: string;
};

type Shipment = {
  _id: string;
  trackingNumber: string;

  recipient: {
    name: string;
  };

  origin: {
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };

  destination: {
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };

  packageDescription: string;
  weight?: number;
  serviceMode: string;
  status: string;
  estimatedDelivery?: string;
  progress: number;

  currentLocation?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };

  checkpoints: Checkpoint[];
  notifications: ShipmentNotification[];
  createdAt: string;
  updatedAt: string;
};

type TrackingClientProps = {
  initialNumber: string;
};

export function TrackingClient({
  initialNumber,
}: TrackingClientProps) {
  const router = useRouter();

  const [trackingNumber, setTrackingNumber] = useState(
    initialNumber.toUpperCase(),
  );

  const [shipment, setShipment] = useState<Shipment | null>(
    null,
  );

  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [popupDismissed, setPopupDismissed] =
    useState(false);

  async function loadShipment(number: string) {
    const normalizedNumber = number.trim().toUpperCase();

    if (!normalizedNumber) {
      return;
    }

    setLoading(true);
    setError("");
    setShipment(null);
    setSearched(true);
    setPopupDismissed(false);

    try {
      const response = await fetch(
        `/api/tracking/${encodeURIComponent(
          normalizedNumber,
        )}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ?? "Shipment could not be found.",
        );

        return;
      }

      setShipment(data.shipment);
    } catch {
      setError(
        "Unable to connect to the tracking service.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialNumber.trim()) {
      return;
    }

    void loadShipment(initialNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNumber]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedNumber = trackingNumber
      .trim()
      .toUpperCase();

    if (!normalizedNumber) {
      return;
    }

    router.replace(
      `/tracking?number=${encodeURIComponent(
        normalizedNumber,
      )}`,
    );

    void loadShipment(normalizedNumber);
  }

  const popupNotification =
    shipment?.notifications
      ?.slice()
      .reverse()
      .find((notification) => notification.showAsPopup) ??
    null;

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d4a72c]/50 bg-[#d4a72c]/10 text-lg font-black text-[#e6bd4f]">
              CR
            </span>

            <span>
              <span className="block text-sm font-black uppercase tracking-[0.12em]">
                CrownRoute
              </span>

              <span className="block text-[9px] uppercase tracking-[0.34em] text-[#d4a72c]">
                Logistics
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-[#e6bd4f]"
          >
            <ArrowLeft size={17} />
            Back home
          </Link>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[#101010] py-16">
        <div className="mx-auto max-w-4xl px-5 text-center lg:px-6">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#d4a72c]">
            Shipment visibility
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Track your shipment
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/45">
            Enter your CrownRoute tracking number to view
            verified checkpoints, progress and operational
            notifications.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-3 sm:flex-row"
          >
            <label className="flex flex-1 items-center gap-3 rounded-xl bg-white/[0.06] px-4">
              <Search size={19} className="text-white/35" />

              <input
                value={trackingNumber}
                onChange={(event) =>
                  setTrackingNumber(
                    event.target.value.toUpperCase(),
                  )
                }
                placeholder="Enter tracking number"
                className="h-14 w-full bg-transparent text-sm uppercase outline-none placeholder:normal-case placeholder:text-white/30"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#d4a72c] px-7 text-sm font-black text-black transition hover:bg-[#efc95d] disabled:opacity-60"
            >
              {loading && (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              )}

              {loading ? "Searching..." : "Track shipment"}
            </button>
          </form>
        </div>
      </section>

      {loading && (
        <section className="mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center">
          <LoaderCircle
            size={42}
            className="animate-spin text-[#d4a72c]"
          />

          <p className="mt-5 text-sm text-white/40">
            Retrieving shipment information...
          </p>
        </section>
      )}

      {!loading && !searched && (
        <section className="mx-auto max-w-3xl px-5 py-24 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#d4a72c]/25 bg-[#d4a72c]/10 text-[#e6bd4f]">
            <Package size={34} />
          </div>

          <h2 className="mt-6 text-2xl font-black">
            Enter a tracking number
          </h2>

          <p className="mt-3 text-sm text-white/40">
            Shipment details and route progress will appear here.
          </p>
        </section>
      )}

      {!loading && searched && error && (
        <section className="mx-auto max-w-3xl px-5 py-24 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-red-400/25 bg-red-400/10 text-red-300">
            <Search size={32} />
          </div>

          <h2 className="mt-6 text-2xl font-black">
            Shipment not found
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/40">
            {error}
          </p>
        </section>
      )}

      {!loading && shipment && (
        <section className="mx-auto max-w-7xl px-5 py-14 lg:px-6 lg:py-20">
          {popupNotification && !popupDismissed && (
            <NotificationBanner
              notification={popupNotification}
              onDismiss={() => setPopupDismissed(true)}
            />
          )}

          <div className="mb-7 rounded-2xl border border-blue-400/20 bg-blue-400/[0.08] p-5">
            <div className="flex items-start gap-4">
              <Truck
                size={22}
                className="mt-0.5 shrink-0 text-blue-300"
              />

              <div>
                <p className="font-bold text-blue-200">
                  {formatStatus(shipment.status)}
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-100/55">
                  Current location:{" "}
                  {shipment.currentLocation?.name ??
                    `${shipment.origin.city}, ${shipment.origin.country}`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
            <aside className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-[#111111] p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                      Tracking number
                    </p>

                    <p className="mt-2 text-xl font-black text-[#e6bd4f]">
                      {shipment.trackingNumber}
                    </p>
                  </div>

                  <StatusBadge status={shipment.status} />
                </div>

                <div className="mt-7 border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">
                      Overall progress
                    </p>

                    <p className="text-2xl font-black text-[#e6bd4f]">
                      {shipment.progress}%
                    </p>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#98700f] to-[#f2cf68] transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          Math.max(shipment.progress, 0),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#111111] p-6">
                <h2 className="font-black">
                  Shipment information
                </h2>

                <div className="mt-6 space-y-5">
                  <InfoRow
                    Icon={MapPin}
                    label="Origin"
                    value={`${shipment.origin.city}, ${shipment.origin.country}`}
                  />

                  <InfoRow
                    Icon={MapPin}
                    label="Destination"
                    value={`${shipment.destination.city}, ${shipment.destination.country}`}
                  />

                  <InfoRow
                    Icon={Truck}
                    label="Service"
                    value={formatStatus(
                      shipment.serviceMode,
                    )}
                  />

                  <InfoRow
                    Icon={CalendarDays}
                    label="Estimated delivery"
                    value={formatDate(
                      shipment.estimatedDelivery,
                    )}
                  />

                  <InfoRow
                    Icon={Package}
                    label="Package"
                    value={shipment.packageDescription}
                  />

                  <InfoRow
                    Icon={Info}
                    label="Recipient"
                    value={shipment.recipient.name}
                  />
                </div>
              </div>
            </aside>

            <div className="rounded-3xl border border-white/10 bg-[#111111] p-6 sm:p-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d4a72c]">
                  Live route
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Shipment checkpoints
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  Route progress is updated through the
                  CrownRoute operations dashboard.
                </p>
              </div>

              <div className="mt-9">
                {shipment.checkpoints.map(
                  (checkpoint, index) => {
                    const completed =
                      checkpoint.status === "completed";

                    const active =
                      checkpoint.status === "active";

                    return (
                      <div
                        key={
                          checkpoint._id ??
                          `${checkpoint.location}-${index}`
                        }
                        className="relative flex gap-4 pb-9"
                      >
                        {index !==
                          shipment.checkpoints.length - 1 && (
                          <span
                            className={`absolute left-[19px] top-10 h-full w-px ${
                              completed
                                ? "bg-[#d4a72c]"
                                : "bg-white/10"
                            }`}
                          />
                        )}

                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                            completed
                              ? "border-[#d4a72c] bg-[#d4a72c] text-black"
                              : active
                                ? "border-[#d4a72c] bg-[#d4a72c]/15 text-[#e6bd4f]"
                                : "border-white/15 bg-[#161616] text-white/25"
                          }`}
                        >
                          {completed ? (
                            <Check
                              size={18}
                              strokeWidth={3}
                            />
                          ) : active ? (
                            <Truck size={17} />
                          ) : (
                            <Clock3 size={17} />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-col justify-between gap-2 sm:flex-row">
                            <div>
                              <h3
                                className={`text-sm font-black ${
                                  active
                                    ? "text-[#e6bd4f]"
                                    : "text-white"
                                }`}
                              >
                                {checkpoint.location}
                              </h3>

                              <p className="mt-1 text-xs text-white/35">
                                {checkpoint.city},{" "}
                                {checkpoint.country}
                              </p>

                              <p className="mt-2 text-sm text-white/40">
                                {checkpoint.description}
                              </p>
                            </div>

                            <span className="text-xs text-white/30">
                              {completed
                                ? formatDate(
                                    checkpoint.completedAt,
                                  )
                                : formatDate(
                                    checkpoint.estimatedArrival,
                                  )}
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-white/25">
                            Coordinates:{" "}
                            {checkpoint.latitude.toFixed(4)},{" "}
                            {checkpoint.longitude.toFixed(4)}
                          </p>

                          {active && (
                            <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#d4a72c]/10 px-3 py-1.5 text-xs font-bold text-[#e6bd4f]">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-[#d4a72c]" />
                              Current checkpoint
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

type NotificationBannerProps = {
  notification: ShipmentNotification;
  onDismiss: () => void;
};

function NotificationBanner({
  notification,
  onDismiss,
}: NotificationBannerProps) {
  const styles = {
    information:
      "border-blue-400/20 bg-blue-400/10 text-blue-200",
    success:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    warning:
      "border-amber-400/20 bg-amber-400/10 text-amber-200",
    critical:
      "border-red-400/20 bg-red-400/10 text-red-200",
  };

  return (
    <div
      className={`mb-7 rounded-2xl border p-5 ${
        styles[notification.type]
      }`}
    >
      <div className="flex items-start gap-4">
        <AlertTriangle
          size={22}
          className="mt-0.5 shrink-0"
        />

        <div className="flex-1">
          <p className="font-black">{notification.title}</p>

          <p className="mt-1 text-sm leading-6 opacity-70">
            {notification.message}
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="opacity-50 transition hover:opacity-100"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

type InfoRowProps = {
  Icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  label: string;
  value: string;
};

function InfoRow({
  Icon,
  label,
  value,
}: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d4a72c]/10 text-[#e6bd4f]">
        <Icon size={18} />
      </span>

      <div>
        <p className="text-xs text-white/30">{label}</p>

        <p className="mt-1 text-sm font-semibold text-white/75">
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
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function formatDate(value?: string) {
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