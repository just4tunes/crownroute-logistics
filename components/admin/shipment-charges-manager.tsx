"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  Save,
} from "lucide-react";

type PaymentStatus =
  | "unpaid"
  | "awaiting_details"
  | "awaiting_payment"
  | "under_review"
  | "paid"
  | "rejected"
  | "waived";

type PaymentDetails = {
  recipientName?: string;
  paymentAddress?: string;
  providerName?: string;
  instructions?: string;
  assignedAt?: string;
  expiresAt?: string;
};

type ShipmentChargeRecord = {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  category: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  issueStatus: string;
  paymentStatus: PaymentStatus;
  selectedPaymentMethod?: string;
  paymentDetails?: PaymentDetails;
  hasReceipt: boolean;
  rejectionReason?: string;
  submittedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
};

const paymentStatuses = [
  "all",
  "awaiting_details",
  "awaiting_payment",
  "under_review",
  "paid",
  "rejected",
] as const;

export function ShipmentChargesManager() {
  const [charges, setCharges] = useState<ShipmentChargeRecord[]>([]);
  const [filter, setFilter] =
    useState<(typeof paymentStatuses)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCharges = useCallback(async () => {
    setError("");

    try {
      const response = await fetch(
        `/api/admin/shipment-charges?status=${filter}`,
        { cache: "no-store" },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.error ??
            `Unable to retrieve shipment fee payments. Server returned ${response.status}.`,
        );
        return;
      }

      setCharges(data.charges ?? []);
    } catch (requestError) {
      console.error("Shipment fee payment list failed:", requestError);
      setError("Unable to connect to the shipment fee payment service.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    // Fetching the initial list on mount is an intentional external side effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCharges();
  }, [loadCharges]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <label className="max-w-xs text-xs font-bold text-white/55">
          Filter payment status
          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target.value as (typeof paymentStatuses)[number],
              )
            }
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#181818] px-4 text-sm text-white outline-none focus:border-[#d4a72c]/60"
          >
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All" : formatLabel(status)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => void loadCharges()}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-bold text-white/60 transition hover:border-[#d4a72c]/40 hover:text-[#e6bd4f] disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center">
          <LoaderCircle
            size={30}
            className="animate-spin text-[#d4a72c]"
          />
        </div>
      ) : charges.length === 0 ? (
        <div className="mt-7 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#111111] p-8 text-center">
          <Clock3 size={34} className="text-[#d4a72c]" />
          <h2 className="mt-5 text-xl font-black">
            No shipment fee payments
          </h2>
          <p className="mt-2 text-sm text-white/40">
            Payment requests matching this filter will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          {charges.map((charge) => (
            <ChargeCard
              key={charge.id}
              charge={charge}
              onUpdated={loadCharges}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChargeCard({
  charge,
  onUpdated,
}: {
  charge: ShipmentChargeRecord;
  onUpdated: () => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updateCharge(payload: Record<string, unknown>) {
    setError("");
    setMessage("");
    setIsUpdating(true);

    try {
      const response = await fetch(
        `/api/admin/shipment-charges/${charge.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "Unable to update this charge.");
        return false;
      }

      setMessage(data.message ?? "Charge updated.");
      await onUpdated();
      return true;
    } catch (requestError) {
      console.error("Shipment charge update failed:", requestError);
      setError("Unable to connect to the shipment fee payment service.");
      return false;
    } finally {
      setIsUpdating(false);
    }
  }

  async function assignDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const expiryValue = String(formData.get("expiresAt") ?? "");
    const expiresAt = expiryValue
      ? new Date(expiryValue).toISOString()
      : "";

    await updateCharge({
      action: "assign_payment_details",
      recipientName: String(formData.get("recipientName") ?? ""),
      paymentAddress: String(formData.get("paymentAddress") ?? ""),
      providerName: String(formData.get("providerName") ?? ""),
      instructions: String(formData.get("instructions") ?? ""),
      expiresAt,
    });
  }

  async function approvePayment() {
    if (
      !window.confirm(
        `Approve the payment for "${charge.title}" (${formatCurrency(
          charge.amount,
          charge.currency,
        )})? This will mark only the fee as paid; it will not resolve the shipment issue or resume the shipment.`,
      )
    ) {
      return;
    }

    await updateCharge({ action: "approve_payment" });
  }

  async function rejectPayment() {
    const reason = window.prompt(
      `Enter the reason the receipt for "${charge.title}" was rejected:`,
    );

    if (reason === null) {
      return;
    }

    await updateCharge({
      action: "reject_payment",
      reason,
    });
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-[#111111] p-6 sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/tracking?number=${encodeURIComponent(
                charge.trackingNumber,
              )}`}
              target="_blank"
              className="text-sm font-black text-[#e6bd4f] hover:underline"
            >
              {charge.trackingNumber}
            </Link>
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
              {formatLabel(charge.category)}
            </span>
            <StatusBadge status={charge.issueStatus} />
            <StatusBadge status={charge.paymentStatus} />
          </div>

          <h2 className="mt-3 text-xl font-black">{charge.title}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/55">
            {charge.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/40">
            <span>
              Method:{" "}
              <strong className="text-white/70">
                {charge.selectedPaymentMethod
                  ? formatLabel(charge.selectedPaymentMethod)
                  : "Not selected"}
              </strong>
            </span>
            <span>Requested {formatDate(charge.createdAt)}</span>
            {charge.submittedAt && (
              <span>Receipt submitted {formatDate(charge.submittedAt)}</span>
            )}
          </div>
        </div>

        <p className="shrink-0 text-2xl font-black text-[#e6bd4f]">
          {formatCurrency(charge.amount, charge.currency)}
        </p>
      </div>

      {message && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      {charge.paymentStatus === "awaiting_details" && (
        <form
          onSubmit={assignDetails}
          className="mt-6 border-t border-white/10 pt-5"
        >
          <h3 className="font-black">Assign one-time payment details</h3>
          <p className="mt-1 text-xs text-white/40">
            Requested method:{" "}
            {charge.selectedPaymentMethod
              ? formatLabel(charge.selectedPaymentMethod)
              : "Not selected"}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Recipient/account name"
              name="recipientName"
              minLength={2}
              maxLength={150}
              required
            />
            <Field
              label="Payment address or account"
              name="paymentAddress"
              minLength={3}
              maxLength={300}
              required
            />
            <Field
              label="Provider, bank or network"
              name="providerName"
              maxLength={150}
            />
            <Field
              label="Optional expiration"
              name="expiresAt"
              type="datetime-local"
            />
            <label className="text-xs font-bold text-white/55 sm:col-span-2">
              Instructions
              <textarea
                name="instructions"
                maxLength={1000}
                rows={3}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-[#d4a72c]/60"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#d4a72c] px-5 py-3 text-sm font-black text-black transition hover:bg-[#efc95d] disabled:opacity-50"
          >
            {isUpdating ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Send payment details
          </button>
        </form>
      )}

      {charge.paymentStatus === "awaiting_payment" && (
        <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-400/[0.05] p-5">
          <p className="font-bold text-blue-200">
            Payment details sent
          </p>
          <p className="mt-1 text-sm text-white/50">
            The receiver has not submitted a receipt yet.
          </p>
          <PaymentDetailsView details={charge.paymentDetails} />
          {charge.hasReceipt && (
            <p className="mt-3 text-xs text-white/35">
              A previous receipt is retained for review history.
            </p>
          )}
        </div>
      )}

      {charge.paymentStatus === "under_review" && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="font-bold text-amber-200">
            Receiver receipt is under review
          </p>
          <PaymentDetailsView details={charge.paymentDetails} />

          {charge.hasReceipt && (
            <div className="mt-4">
              <a
                href={`/api/admin/shipment-charges/${charge.id}/receipt`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#e6bd4f] underline underline-offset-4"
              >
                <ExternalLink size={14} />
                Open full receipt
              </a>
              <img
                src={`/api/admin/shipment-charges/${charge.id}/receipt`}
                alt={`Submitted payment receipt for ${charge.title}`}
                className="mt-3 max-h-[28rem] w-full rounded-xl bg-black/30 object-contain"
              />
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={approvePayment}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-black transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {isUpdating ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Approve Payment
            </button>
            <button
              type="button"
              onClick={rejectPayment}
              disabled={isUpdating}
              className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 px-5 py-3 text-sm font-black text-red-200 transition hover:bg-red-400/10 disabled:opacity-50"
            >
              <AlertTriangle size={16} />
              Reject Payment
            </button>
          </div>
        </div>
      )}

      {charge.paymentStatus === "rejected" && (
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-5">
          <p className="font-bold text-red-200">Receipt rejected</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/55">
            {charge.rejectionReason || "No rejection reason was provided."}
          </p>
          <p className="mt-3 text-xs text-white/40">
            The receiver may upload a corrected receipt or request a different
            payment method.
          </p>
          {charge.hasReceipt && (
            <a
              href={`/api/admin/shipment-charges/${charge.id}/receipt`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#e6bd4f] underline underline-offset-4"
            >
              <ExternalLink size={14} />
              Open rejected receipt
            </a>
          )}
        </div>
      )}

      {charge.paymentStatus === "paid" && (
        <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-5">
          <p className="font-black text-emerald-200">
            Paid {charge.paidAt ? `on ${formatDate(charge.paidAt)}` : ""}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Payment approval does not resolve the issue or resume shipment
            progress. Resolve the issue and update shipment status separately.
          </p>
          <Link
            href={`/admin/shipments/${charge.shipmentId}`}
            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#e6bd4f] underline underline-offset-4"
          >
            Open shipment management
            <ExternalLink size={13} />
          </Link>
        </div>
      )}

      {charge.paymentStatus === "waived" && (
        <p className="mt-5 text-sm font-bold text-sky-200">
          This fee was waived.
        </p>
      )}
    </article>
  );
}

function PaymentDetailsView({
  details,
}: {
  details?: PaymentDetails;
}) {
  if (!details) {
    return null;
  }

  return (
    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      {details.recipientName && (
        <Detail label="Recipient/account name" value={details.recipientName} />
      )}
      {details.paymentAddress && (
        <Detail label="Payment address" value={details.paymentAddress} />
      )}
      {details.providerName && (
        <Detail label="Provider, bank or network" value={details.providerName} />
      )}
      {details.instructions && (
        <Detail label="Instructions" value={details.instructions} />
      )}
      {details.expiresAt && (
        <Detail label="Expires" value={formatDate(details.expiresAt)} />
      )}
    </dl>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/20 p-3">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-white/35">
        {label}
      </dt>
      <dd className="mt-1 break-all font-semibold text-white/80">{value}</dd>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  minLength,
  maxLength,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-bold text-white/55">
      {label}
      <input
        name={name}
        type={type}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
        className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-[#d4a72c]/60"
      />
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    resolved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    cancelled: "border-white/10 bg-white/[0.04] text-white/45",
    unpaid: "border-red-400/20 bg-red-400/10 text-red-200",
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
      {formatLabel(status)}
    </span>
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
