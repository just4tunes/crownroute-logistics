"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  LoaderCircle,
  RefreshCw,
  Save,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

type PaymentMethod =
  | "paypal"
  | "cash_app"
  | "bank_transfer"
  | "bitcoin"
  | "usdt";

type PaymentStatus =
  | "awaiting_details"
  | "awaiting_payment"
  | "under_review"
  | "approved"
  | "rejected";

type CustomerRecord = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  accountStatus: string;
  registrationPaymentStatus: string;
};

type PaymentRecord = {
  _id: string;
  customerId: CustomerRecord;
  referenceCode: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;

  paymentDetails?: {
    recipientName?: string;
    paymentAddress?: string;
    bankName?: string;
    instructions?: string;
  };

  transactionReference?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  payments?: PaymentRecord[];
};

const paymentMethods: {
  value: PaymentMethod;
  label: string;
}[] = [
  {
    value: "paypal",
    label: "PayPal",
  },
  {
    value: "cash_app",
    label: "Cash App",
  },
  {
    value: "bank_transfer",
    label: "Bank transfer",
  },
  {
    value: "bitcoin",
    label: "Bitcoin",
  },
  {
    value: "usdt",
    label: "USDT",
  },
];

export default function RegistrationPaymentsManager() {
  const [payments, setPayments] = useState<
    PaymentRecord[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    setError("");

    try {
      const response = await fetch(
        "/api/admin/registration-payments",
        {
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        setError(
          data.error ??
            "Unable to retrieve registration payments.",
        );
        return;
      }

      setPayments(data.payments ?? []);
    } catch {
      setError(
        "Unable to connect to the payment service.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <LoaderCircle
          size={30}
          className="animate-spin text-[#d4a72c]"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-white/40">
            {payments.length} registration payment
            request{payments.length === 1 ? "" : "s"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPayments()}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-bold text-white/60 transition hover:border-[#d4a72c]/40 hover:text-[#e6bd4f]"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {payments.length === 0 ? (
        <div className="mt-7 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#111111] p-8 text-center">
          <CreditCard
            size={35}
            className="text-[#d4a72c]"
          />

          <h2 className="mt-5 text-xl font-black">
            No payment requests
          </h2>

          <p className="mt-2 text-sm text-white/40">
            Customer registration requests will
            appear here.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-6">
          {payments.map((payment) => (
            <PaymentCard
              key={payment._id}
              payment={payment}
              onUpdated={loadPayments}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentCard({
  payment,
  onUpdated,
}: {
  payment: PaymentRecord;
  onUpdated: () => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updatePayment(
    payload: Record<string, unknown>,
  ) {
    setError("");
    setMessage("");
    setIsUpdating(true);

    try {
      const response = await fetch(
        `/api/admin/registration-payments/${payment._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        setError(
          data.error ??
            "Unable to update this payment.",
        );
        return false;
      }

      setMessage(
        data.message ?? "Payment updated.",
      );

      await onUpdated();
      return true;
    } catch {
      setError(
        "Unable to connect to the payment service.",
      );
      return false;
    } finally {
      setIsUpdating(false);
    }
  }

  async function assignDetails(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(
      event.currentTarget,
    );

    const expiresAtValue = String(
      formData.get("expiresAt") ?? "",
    );

    let expiresAt = "";

    if (expiresAtValue) {
      expiresAt = new Date(
        expiresAtValue,
      ).toISOString();
    }

    await updatePayment({
      action: "assign_details",
      method: String(formData.get("method")),
      recipientName: String(
        formData.get("recipientName"),
      ),
      paymentAddress: String(
        formData.get("paymentAddress"),
      ),
      bankName: String(
        formData.get("bankName") ?? "",
      ),
      instructions: String(
        formData.get("instructions") ?? "",
      ),
      expiresAt,
    });
  }

  async function approvePayment() {
    const confirmed = window.confirm(
      `Approve the $1,000 payment from ${payment.customerId.fullName} and activate their account?`,
    );

    if (!confirmed) {
      return;
    }

    await updatePayment({
      action: "approve_payment",
    });
  }

  async function rejectPayment() {
    const reason = window.prompt(
      "Enter the reason for rejecting this payment:",
    );

    if (!reason?.trim()) {
      return;
    }

    await updatePayment({
      action: "reject_payment",
      reason: reason.trim(),
    });
  }

  async function copyReference() {
    if (!payment.transactionReference) {
      return;
    }

    await navigator.clipboard.writeText(
      payment.transactionReference,
    );

    setMessage("Transaction reference copied.");
  }

  const canAssignDetails =
    payment.status === "awaiting_details" ||
    payment.status === "awaiting_payment" ||
    payment.status === "rejected";

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111111] p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d4a72c]/10 text-[#e6bd4f]">
            <UserRound size={22} />
          </span>

          <div>
            <h2 className="text-xl font-black">
              {payment.customerId.fullName}
            </h2>

            <p className="mt-1 text-sm text-white/45">
              {payment.customerId.email}
            </p>

            <p className="mt-1 text-xs text-white/30">
              {payment.customerId.phone} ·{" "}
              {payment.customerId.country}
            </p>
          </div>
        </div>

        <StatusBadge status={payment.status} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Detail
          label="Amount"
          value="$1,000 USD"
        />

        <Detail
          label="Requested method"
          value={formatLabel(payment.method)}
        />

        <Detail
          label="Request reference"
          value={payment.referenceCode}
        />

        <Detail
          label="Requested"
          value={formatDate(payment.createdAt)}
        />
      </div>

      {payment.transactionReference && (
        <div className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-400/[0.07] p-5">
          <p className="text-xs font-black uppercase tracking-wider text-violet-300">
            Customer transaction reference
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="break-all text-sm font-black text-white">
              {payment.transactionReference}
            </p>

            <button
              type="button"
              onClick={copyReference}
              className="shrink-0 text-white/40 hover:text-white"
            >
              <Copy size={18} />
            </button>
          </div>
        </div>
      )}

      {payment.paymentDetails?.paymentAddress && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-black uppercase tracking-wider text-white/30">
            Assigned payment details
          </p>

          <p className="mt-3 text-sm font-bold text-[#e6bd4f]">
            {payment.paymentDetails.paymentAddress}
          </p>

          {payment.paymentDetails.recipientName && (
            <p className="mt-2 text-xs text-white/40">
              Recipient:{" "}
              {payment.paymentDetails.recipientName}
            </p>
          )}
        </div>
      )}

      {canAssignDetails && (
        <form
          onSubmit={assignDetails}
          className="mt-7 border-t border-white/10 pt-7"
        >
          <h3 className="text-base font-black">
            Assign one-time payment details
          </h3>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Payment method">
              <select
                name="method"
                required
                defaultValue={payment.method}
                className={inputClass}
              >
                {paymentMethods.map((method) => (
                  <option
                    key={method.value}
                    value={method.value}
                  >
                    {method.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Recipient or account name">
              <input
                name="recipientName"
                required
                minLength={2}
                maxLength={150}
                defaultValue={
                  payment.paymentDetails
                    ?.recipientName ?? ""
                }
                placeholder="Account holder name"
                className={inputClass}
              />
            </Field>

            <Field label="Payment account or address">
              <input
                name="paymentAddress"
                required
                minLength={3}
                maxLength={300}
                defaultValue={
                  payment.paymentDetails
                    ?.paymentAddress ?? ""
                }
                placeholder="Email, tag, account or wallet address"
                className={inputClass}
              />
            </Field>

            <Field label="Bank or provider name">
              <input
                name="bankName"
                maxLength={150}
                defaultValue={
                  payment.paymentDetails?.bankName ??
                  ""
                }
                placeholder="Optional"
                className={inputClass}
              />
            </Field>

            <Field label="Expiration date and time">
              <input
                name="expiresAt"
                type="datetime-local"
                className={inputClass}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Payment instructions">
                <textarea
                  name="instructions"
                  rows={4}
                  maxLength={1000}
                  defaultValue={
                    payment.paymentDetails
                      ?.instructions ?? ""
                  }
                  placeholder="Optional instructions for this customer"
                  className={`${inputClass} h-auto py-4`}
                />
              </Field>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-black text-black transition hover:bg-[#efc95d] disabled:opacity-50"
          >
            {isUpdating ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <Save size={17} />
            )}

            Send payment details
          </button>
        </form>
      )}

      {payment.status === "under_review" && (
        <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-7 sm:flex-row">
          <button
            type="button"
            onClick={approvePayment}
            disabled={isUpdating}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-black text-black disabled:opacity-50"
          >
            <CheckCircle2 size={18} />
            Approve and activate account
          </button>

          <button
            type="button"
            onClick={rejectPayment}
            disabled={isUpdating}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-red-400/30 px-6 py-3 text-sm font-black text-red-300 disabled:opacity-50"
          >
            <XCircle size={18} />
            Reject payment
          </button>
        </div>
      )}

      {payment.status === "approved" && (
        <div className="mt-7 flex gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-200">
          <CheckCircle2
            size={20}
            className="shrink-0"
          />

          <p className="text-sm">
            Payment approved. The customer account
            is active.
          </p>
        </div>
      )}

      {payment.status === "rejected" &&
        payment.rejectionReason && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">
            <AlertTriangle
              size={20}
              className="shrink-0"
            />

            <p className="text-sm">
              {payment.rejectionReason}
            </p>
          </div>
        )}

      {message && (
        <p className="mt-5 text-sm text-emerald-300">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-5 text-sm text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}

const inputClass =
  "h-13 w-full rounded-2xl border border-white/10 bg-[#090909] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#d4a72c]/70";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="text-xs font-bold uppercase tracking-wider text-white/35">
        {label}
      </span>

      <span className="mt-2 block">
        {children}
      </span>
    </label>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
        {label}
      </p>

      <p className="mt-2 break-all text-sm font-bold text-white/65">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  const styles: Record<PaymentStatus, string> = {
    awaiting_details:
      "bg-blue-400/10 text-blue-300",
    awaiting_payment:
      "bg-amber-400/10 text-amber-300",
    under_review:
      "bg-violet-400/10 text-violet-300",
    approved:
      "bg-emerald-400/10 text-emerald-300",
    rejected: "bg-red-400/10 text-red-300",
  };

  return (
    <span
      className={`w-fit rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${styles[status]}`}
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}