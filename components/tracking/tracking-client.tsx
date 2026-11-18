"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Info,
  LoaderCircle,
  MapPin,
  Package,
  Search,
  Truck,
  X,
} from "lucide-react";
import {
  MAX_PAYMENT_RECEIPT_SIZE,
  PAYMENT_RECEIPT_CONTENT_TYPES,
} from "@/lib/payment-receipt";

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

type TrackingCharge = {
  id: string;
  category: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  issueStatus: string;
  paymentStatus: string;
  selectedPaymentMethod?: string;
  rejectionReason?: string;
  hasReceipt: boolean;
  paymentDetails?: {
    recipientName?: string;
    paymentAddress?: string;
    providerName?: string;
    instructions?: string;
    assignedAt?: string;
    expiresAt?: string;
  };
  createdAt: string;
  updatedAt: string;
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
  departureDate?: string;
  arrivalDate?: string;
  estimatedDelivery?: string;
  progress: number;
  autoProgressEnabled?: boolean;
  hasParcelImage?: boolean;

  currentLocation?: {
    name?: string;
    latitude?: number;
    longitude?: number;
  };

  checkpoints: Checkpoint[];
  notifications: ShipmentNotification[];
  charges?: TrackingCharge[];
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
  const [visualProgress, setVisualProgress] =
    useState(0);
  const [popupDismissed, setPopupDismissed] =
    useState(false);

  const loadShipment = useCallback(
    async (
      number: string,
      options: {
        silent?: boolean;
        resetPopup?: boolean;
      } = {},
    ) => {
      const normalizedNumber = number.trim().toUpperCase();

      if (!normalizedNumber) {
        return;
      }

      const silent = options.silent ?? false;
      const resetPopup = options.resetPopup ?? !silent;

      if (!silent) {
        setLoading(true);
        setShipment(null);
      }

      setError("");
      setSearched(true);

      if (resetPopup) {
        setPopupDismissed(false);
      }

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
          if (!silent) {
            setError(
              data.error ??
                "Shipment could not be found.",
            );
          }

          return;
        }

        setShipment({
          ...data.shipment,
          charges: Array.isArray(data.charges)
            ? data.charges
            : [],
        });
      } catch {
        if (!silent) {
          setError(
            "Unable to connect to the tracking service.",
          );
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!initialNumber.trim()) {
      return;
    }

    void loadShipment(initialNumber);
  }, [initialNumber, loadShipment]);

  useEffect(() => {
    const activeTrackingNumber =
      shipment?.trackingNumber;

    if (!activeTrackingNumber) {
      return;
    }

    const waitingForPaymentDetails =
      shipment.charges?.some(
        (charge) =>
          charge.paymentStatus === "awaiting_details",
      ) ?? false;

    const refreshTimer = window.setInterval(() => {
      void loadShipment(activeTrackingNumber, {
        silent: true,
        resetPopup: false,
      });
    }, waitingForPaymentDetails ? 5_000 : 30_000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [
    shipment?.trackingNumber,
    shipment?.charges,
    loadShipment,
  ]);

  useEffect(() => {
    if (!shipment) {
      setVisualProgress(0);
      return;
    }

    const updateVisualProgress = () => {
      if (shipment.status === "delivered") {
        setVisualProgress(100);
        return;
      }

      if (
        ["held", "delayed", "cancelled"].includes(
          shipment.status,
        ) ||
        !shipment.departureDate ||
        !shipment.arrivalDate
      ) {
        setVisualProgress(shipment.progress);
        return;
      }

      const departureTime = new Date(
        shipment.departureDate,
      ).getTime();
      const arrivalTime = new Date(
        shipment.arrivalDate,
      ).getTime();
      const currentTime = Date.now();

      if (
        Number.isNaN(departureTime) ||
        Number.isNaN(arrivalTime) ||
        arrivalTime <= departureTime ||
        currentTime < departureTime
      ) {
        setVisualProgress(shipment.progress);
        return;
      }

      const timeProgress =
        ((currentTime - departureTime) /
          (arrivalTime - departureTime)) *
        100;

      setVisualProgress(
        Number(
          Math.min(
            99,
            Math.max(
              shipment.progress,
              timeProgress,
            ),
          ).toFixed(2),
        ),
      );
    };

    updateVisualProgress();

    const visualTimer = window.setInterval(
      updateVisualProgress,
      1_000,
    );

    return () => {
      window.clearInterval(visualTimer);
    };
  }, [shipment]);

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

  const liveTrackingPaused = shipment
    ? ["held", "delayed", "cancelled"].includes(
        shipment.status,
      )
    : false;

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

                <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-blue-100/60">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      liveTrackingPaused
                        ? "bg-amber-300"
                        : shipment.status === "delivered"
                          ? "bg-emerald-300"
                          : "animate-pulse bg-blue-300"
                    }`}
                  />

                  {liveTrackingPaused
                    ? "Live progress paused"
                    : shipment.status === "delivered"
                      ? "Route completed"
                      : "Live progress · refreshes every 30 seconds"}
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
                      {formatProgress(visualProgress)}%
                    </p>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#98700f] to-[#f2cf68] transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          Math.max(visualProgress, 0),
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

              {shipment.hasParcelImage && (
                <section className="rounded-3xl border border-white/10 bg-[#111111] p-6">
                  <div className="flex items-center gap-2 text-[#e6bd4f]">
                    <Package size={18} />
                    <h2 className="font-black text-white">
                      Parcel photograph
                    </h2>
                  </div>

                  <a
                    href={`/api/tracking/${encodeURIComponent(
                      shipment.trackingNumber,
                    )}/parcel-image`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 block"
                    aria-label="Open full parcel photograph"
                  >
                    <img
                      src={`/api/tracking/${encodeURIComponent(
                        shipment.trackingNumber,
                      )}/parcel-image`}
                      alt={`Parcel photograph for shipment ${shipment.trackingNumber}`}
                      className="max-h-[28rem] w-full rounded-2xl bg-black/30 object-contain"
                    />
                  </a>

                  <a
                    href={`/api/tracking/${encodeURIComponent(
                      shipment.trackingNumber,
                    )}/parcel-image`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex text-xs font-bold text-[#e6bd4f] underline underline-offset-4"
                  >
                    Open full image
                  </a>
                </section>
              )}
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

          {(shipment.charges?.length ?? 0) > 0 && (
            <section className="mt-8 rounded-3xl border border-white/10 bg-[#111111] p-6 sm:p-8">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                  <AlertTriangle size={21} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                    Shipment attention
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Shipment issues and fees
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {(shipment.charges ?? []).map((charge) => (
                  <TrackingChargeCard
                    key={charge.id}
                    charge={charge}
                    trackingNumber={shipment.trackingNumber}
                    onUpdated={() =>
                      loadShipment(shipment.trackingNumber, {
                        silent: true,
                        resetPopup: false,
                      })
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </section>
      )}
    </main>
  );
}

const shipmentChargePaymentMethods = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "paypal", label: "PayPal" },
  { value: "cash_app", label: "Cash App" },
  { value: "bitcoin", label: "Bitcoin" },
  { value: "usdt", label: "USDT" },
] as const;

const oneTimePaymentNotice =
  "These payment details are assigned to this shipment charge only. Do not share or reuse them.";

function TrackingChargeCard({
  charge,
  trackingNumber,
  onUpdated,
}: {
  charge: TrackingCharge;
  trackingNumber: string;
  onUpdated: () => Promise<void>;
}) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestingPayment, setRequestingPayment] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [error, setError] = useState("");
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const urgent =
    charge.issueStatus === "open" &&
    charge.paymentStatus === "unpaid";
  const historical =
    ["resolved", "cancelled"].includes(charge.issueStatus) ||
    charge.paymentStatus === "waived";
  const canPay =
    charge.issueStatus === "open" &&
    charge.paymentStatus === "unpaid";
  const canUploadReceipt =
    charge.issueStatus === "open" &&
    (charge.paymentStatus === "awaiting_payment" ||
      charge.paymentStatus === "rejected");

  useEffect(() => {
    if (!receiptPreview) {
      return;
    }

    return () => URL.revokeObjectURL(receiptPreview);
  }, [receiptPreview]);

  function handleReceiptChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    if (
      !PAYMENT_RECEIPT_CONTENT_TYPES.some(
        (contentType) => contentType === file.type,
      )
    ) {
      setError("Receipt must be a JPEG, PNG or WebP image.");
      event.currentTarget.value = "";
      return;
    }

    if (file.size === 0 || file.size > MAX_PAYMENT_RECEIPT_SIZE) {
      setError("Receipt image must be no larger than 2 MB.");
      event.currentTarget.value = "";
      return;
    }

    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setError("");
  }

  function clearReceipt() {
    setReceiptFile(null);
    setReceiptPreview("");
    if (receiptInputRef.current) {
      receiptInputRef.current.value = "";
    }
  }

  async function submitPaymentRequest(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!paymentMethod) {
      setError("Select a payment method.");
      return;
    }

    setRequestingPayment(true);
    setError("");

    try {
      const response = await fetch(
        `/api/tracking/${encodeURIComponent(
          trackingNumber,
        )}/charges/${charge.id}/payment-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ method: paymentMethod }),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.error ??
            `Unable to prepare payment. Server returned ${response.status}.`,
        );
        return;
      }

      setRequestModalOpen(false);
      setPaymentMethod("");
      await onUpdated();
    } catch (requestError) {
      console.error("Shipment fee payment request failed:", requestError);
      setError("Unable to connect to the payment service.");
    } finally {
      setRequestingPayment(false);
    }
  }

  async function submitReceipt(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!receiptFile) {
      setError("Select a receipt screenshot to upload.");
      return;
    }

    setUploadingReceipt(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("paymentReceipt", receiptFile);

      const response = await fetch(
        `/api/tracking/${encodeURIComponent(
          trackingNumber,
        )}/charges/${charge.id}/receipt`,
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.error ??
            `Unable to upload receipt. Server returned ${response.status}.`,
        );
        return;
      }

      clearReceipt();
      await onUpdated();
    } catch (uploadError) {
      console.error("Shipment fee receipt upload failed:", uploadError);
      setError("Unable to connect to the receipt service.");
    } finally {
      setUploadingReceipt(false);
    }
  }

  async function copyPaymentAddress() {
    const paymentAddress = charge.paymentDetails?.paymentAddress;

    if (!paymentAddress) {
      return;
    }

    try {
      await navigator.clipboard.writeText(paymentAddress);
      setCopyMessage("Copied");
    } catch (copyError) {
      console.error("Copy payment address failed:", copyError);
      setCopyMessage("Unable to copy");
    }

    window.setTimeout(() => setCopyMessage(""), 2000);
  }

  return (
    <article
      className={`rounded-2xl border p-5 ${
        urgent
          ? "border-amber-400/30 bg-amber-400/[0.07]"
          : historical
            ? "border-white/5 bg-white/[0.015] opacity-70"
            : "border-white/10 bg-white/[0.025]"
      }`}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <AlertTriangle
              size={17}
              className={
                urgent ? "shrink-0 text-amber-300" : "shrink-0 text-white/40"
              }
            />
            <span className="text-[10px] font-black uppercase tracking-wider text-white/45">
              {formatStatus(charge.category)}
            </span>
          </div>

          <h3 className="mt-2 text-lg font-black">{charge.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/60">
            {charge.description}
          </p>
          <p className="mt-3 text-xs text-white/35">
            Created {formatDate(charge.createdAt)}
          </p>
        </div>

        <div className="shrink-0 sm:text-right">
          <p
            className={`text-xl font-black ${
              urgent ? "text-amber-200" : "text-white/75"
            }`}
          >
            {formatChargeCurrency(charge.amount, charge.currency)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
            <ChargeStatusPill status={charge.issueStatus} />
            <ChargeStatusPill status={charge.paymentStatus} />
          </div>
        </div>
      </div>

      {charge.paymentStatus === "paid" && (
        <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
          <div className="flex items-center gap-2 font-black text-emerald-200">
            <CheckCircle2 size={17} />
            Paid
          </div>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Payment approval does not automatically resolve the shipment
            issue or remove a hold. Shipment progress is managed separately.
          </p>
        </div>
      )}

      {charge.paymentStatus === "awaiting_details" &&
        charge.issueStatus === "open" && (
          <div
            role="status"
            className="mt-5 rounded-xl border border-blue-400/20 bg-blue-400/[0.06] p-4"
          >
            <h4 className="font-black text-blue-200">
              Preparing your payment details
            </h4>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Please hold while a one-time payment account is being prepared
              for this shipment fee.
            </p>
            <p className="mt-3 text-xs leading-5 text-amber-100/60">
              {oneTimePaymentNotice}
            </p>
          </div>
        )}

      {(charge.paymentStatus === "awaiting_payment" ||
        charge.paymentStatus === "rejected") &&
        charge.issueStatus === "open" && (
          <div className="mt-5 space-y-4">
            {charge.paymentStatus === "rejected" && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4">
                <p className="font-bold text-red-200">
                  Receipt needs correction
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/55">
                  {charge.rejectionReason ||
                    "The submitted receipt was rejected."}
                </p>
                <p className="mt-2 text-xs text-white/40">
                  Upload a corrected receipt using these details, or request a
                  different payment method.
                </p>
              </div>
            )}

            {charge.paymentDetails && (
              <div className="rounded-xl border border-[#d4a72c]/20 bg-[#d4a72c]/[0.04] p-4">
                <p className="text-sm font-black text-[#e6bd4f]">
                  One-time payment details
                </p>
                <p className="mt-3 text-sm text-white/75">
                  Recipient/account name:{" "}
                  <strong>
                    {charge.paymentDetails.recipientName || "Not provided"}
                  </strong>
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <p className="break-all text-sm text-white/75">
                    Payment address:{" "}
                    <strong>
                      {charge.paymentDetails.paymentAddress ||
                        "Not provided"}
                    </strong>
                  </p>
                  {charge.paymentDetails.paymentAddress && (
                    <button
                      type="button"
                      onClick={copyPaymentAddress}
                      className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-white/70 hover:border-[#d4a72c]/40 hover:text-[#e6bd4f]"
                    >
                      <Copy size={13} />
                      {copyMessage || "Copy"}
                    </button>
                  )}
                </div>
                {charge.paymentDetails.providerName && (
                  <p className="mt-2 text-sm text-white/65">
                    Provider: {charge.paymentDetails.providerName}
                  </p>
                )}
                {charge.paymentDetails.instructions && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/55">
                    {charge.paymentDetails.instructions}
                  </p>
                )}
                {charge.paymentDetails.expiresAt && (
                  <p className="mt-3 text-xs text-amber-200/70">
                    Expires {formatDate(charge.paymentDetails.expiresAt)}
                  </p>
                )}
                <p className="mt-4 text-sm font-bold text-[#e6bd4f]">
                  Exact fee to pay:{" "}
                  {formatChargeCurrency(charge.amount, charge.currency)}
                </p>
                <p className="mt-2 text-xs leading-5 text-amber-100/60">
                  {oneTimePaymentNotice}
                </p>
              </div>
            )}

            {canUploadReceipt && (
              <form
                onSubmit={submitReceipt}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <h4 className="font-bold">Submit payment receipt</h4>
                <p className="mt-1 text-xs text-white/40">
                  JPEG, PNG or WebP. Maximum file size: 2 MB.
                </p>
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept={PAYMENT_RECEIPT_CONTENT_TYPES.join(",")}
                  onChange={handleReceiptChange}
                  className="mt-4 block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-[#d4a72c] file:px-3 file:py-2 file:text-xs file:font-black file:text-black"
                />
                {receiptFile && (
                  <div className="mt-4">
                    <p className="break-all text-xs text-white/60">
                      {receiptFile.name}
                    </p>
                    {receiptPreview && (
                      <img
                        src={receiptPreview}
                        alt="Selected payment receipt preview"
                        className="mt-3 max-h-64 w-full rounded-xl bg-black/30 object-contain"
                      />
                    )}
                    <button
                      type="button"
                      onClick={clearReceipt}
                      className="mt-3 text-xs font-bold text-red-200 underline underline-offset-4"
                    >
                      Clear receipt
                    </button>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!receiptFile || uploadingReceipt}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#d4a72c] px-5 py-3 text-xs font-black text-black transition hover:bg-[#efc95d] disabled:opacity-50"
                >
                  {uploadingReceipt && (
                    <LoaderCircle size={15} className="animate-spin" />
                  )}
                  Upload receipt for verification
                </button>
              </form>
            )}
          </div>
        )}

      {charge.paymentStatus === "under_review" && (
        <div
          role="status"
          className="mt-5 rounded-xl border border-blue-400/20 bg-blue-400/[0.05] p-4"
        >
          <p className="font-black text-blue-200">
            Payment verification in progress.
          </p>
          <p className="mt-2 text-sm text-white/50">
            Your receipt is being reviewed. Another receipt cannot be uploaded
            while verification is in progress.
          </p>
        </div>
      )}

      {canPay && (
        <button
          type="button"
          onClick={() => {
            setError("");
            setPaymentMethod("");
            setRequestModalOpen(true);
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#d4a72c] px-5 py-3 text-sm font-black text-black transition hover:bg-[#efc95d]"
        >
          Pay Fee
        </button>
      )}

      {charge.paymentStatus === "rejected" &&
        charge.issueStatus === "open" && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setPaymentMethod("");
              setRequestModalOpen(true);
            }}
            className="mt-4 inline-flex items-center rounded-xl border border-[#d4a72c]/30 px-4 py-2.5 text-xs font-black text-[#e6bd4f] transition hover:bg-[#d4a72c]/10"
          >
            Request a different payment method
          </button>
        )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      {requestModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !requestingPayment) {
              setRequestModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`charge-payment-title-${charge.id}`}
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#111111] p-6 shadow-2xl"
          >
            <h3
              id={`charge-payment-title-${charge.id}`}
              className="text-xl font-black"
            >
              Pay shipment fee
            </h3>
            <p className="mt-3 font-bold">{charge.title}</p>
            <p className="mt-1 text-lg font-black text-[#e6bd4f]">
              {formatChargeCurrency(charge.amount, charge.currency)}
            </p>

            <form onSubmit={submitPaymentRequest} className="mt-5">
              <label className="text-xs font-bold text-white/55">
                Preferred payment method
                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value)
                  }
                  required
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#181818] px-4 text-sm text-white outline-none focus:border-[#d4a72c]/60"
                >
                  <option value="" disabled>
                    Select a payment method
                  </option>
                  {shipmentChargePaymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>

              {error && (
                <p role="alert" className="mt-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              <p className="mt-4 text-xs leading-5 text-white/40">
                Payment details will be prepared by CrownRoute operations.
                Card payments and banking passwords are not accepted.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  disabled={requestingPayment}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-white/65 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!paymentMethod || requestingPayment}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#d4a72c] px-5 py-2.5 text-sm font-black text-black disabled:opacity-50"
                >
                  {requestingPayment && (
                    <LoaderCircle size={15} className="animate-spin" />
                  )}
                  Request payment details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
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

function ChargeStatusPill({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    open: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    resolved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    cancelled: "border-white/10 bg-white/[0.04] text-white/45",
    unpaid: "border-red-400/25 bg-red-400/10 text-red-200",
    awaiting_details:
      "border-violet-400/20 bg-violet-400/10 text-violet-200",
    awaiting_payment:
      "border-orange-400/20 bg-orange-400/10 text-orange-200",
    under_review: "border-blue-400/20 bg-blue-400/10 text-blue-200",
    paid: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    rejected: "border-red-400/20 bg-red-400/10 text-red-200",
    waived: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
        styles[status] ?? "border-white/10 bg-white/[0.04] text-white/45"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function formatChargeCurrency(
  amount: number,
  currency: string,
) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
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

function formatProgress(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}