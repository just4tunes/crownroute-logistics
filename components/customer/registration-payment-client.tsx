"use client";

import {
  AlertTriangle,
  Bitcoin,
  Building2,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  DollarSign,
  LoaderCircle,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

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

type PaymentRecord = {
  _id: string;
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

  expiresAt?: string;
  rejectionReason?: string;
};

type ApiResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  payment?: PaymentRecord | null;
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

export default function RegistrationPaymentClient() {
  const [payment, setPayment] = useState<PaymentRecord | null>(null);

  const [method, setMethod] = useState<PaymentMethod | "">("");

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPreparingModal, setShowPreparingModal] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPayment = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/customer/registration-payment", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        setError(data.error ?? "Unable to retrieve payment information.");
        return;
      }

      setPayment(data.payment ?? null);

      if (data.payment?.method) {
        setMethod(data.payment.method);
      }

      if (data.payment?.status !== "awaiting_details") {
        setShowPreparingModal(false);
      }
    } catch {
      setError("Unable to connect to the payment service.");
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadPayment();
  }, [loadPayment]);

  useEffect(() => {
    if (payment?.status !== "awaiting_details") {
      return;
    }

    const interval = window.setInterval(() => {
      void loadPayment(true);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [payment?.status, loadPayment]);

  async function selectPaymentMethod() {
    if (!method) {
      setError("Select a payment method.");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);
    setShowPreparingModal(true);

    try {
      const response = await fetch("/api/customer/registration-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        setShowPreparingModal(false);

        setError(data.error ?? "Unable to create your payment request.");

        return;
      }

      setPayment(data.payment ?? null);

      setMessage("Your payment request has been sent to the administrator.");
    } catch {
      setShowPreparingModal(false);

      setError("Unable to connect to the payment service.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const paymentProof = formData.get("paymentProof");

    if (!(paymentProof instanceof File) || paymentProof.size === 0) {
      setError("Select a screenshot of your payment receipt.");
      return;
    }

    if (paymentProof.size > 2 * 1024 * 1024) {
      setError("The receipt image must be smaller than 2 MB.");
      return;
    }

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/customer/registration-payment", {
        method: "PATCH",
        body: formData,
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        setError(data.error ?? "Unable to upload your payment receipt.");
        return;
      }

      setPayment(data.payment ?? null);

      setMessage("Your receipt has been submitted for verification.");
    } catch {
      setError("Unable to connect to the payment service.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyPaymentAddress() {
    const value = payment?.paymentDetails?.paymentAddress;

    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setMessage("Payment details copied.");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <LoaderCircle size={30} className="animate-spin text-[#d4a72c]" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-[#111111] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d4a72c]">
                Registration fee
              </p>

              <h2 className="mt-2 text-4xl font-black">
                $1,000 <span className="text-lg text-white/35">USD</span>
              </h2>
            </div>

            {payment && <StatusBadge status={payment.status} />}
          </div>

          <div className="mt-7">
            <label
              htmlFor="paymentMethod"
              className="text-xs font-bold uppercase tracking-[0.14em] text-white/45"
            >
              Preferred payment method
            </label>

            <select
              id="paymentMethod"
              value={method}
              onChange={(event) =>
                setMethod(event.target.value as PaymentMethod)
              }
              disabled={
                payment?.status === "under_review" ||
                payment?.status === "approved"
              }
              className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-[#0a0a0a] px-4 text-sm text-white outline-none focus:border-[#d4a72c]/70 disabled:opacity-50"
            >
              <option value="">Select a payment method</option>

              {paymentMethods.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {payment?.status !== "under_review" &&
              payment?.status !== "approved" && (
                <button
                  type="button"
                  onClick={selectPaymentMethod}
                  disabled={!method || isSubmitting}
                  className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#d4a72c] px-6 text-sm font-black text-black transition hover:bg-[#efc95d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <WalletCards size={18} />
                  )}
                  Request payment details
                </button>
              )}
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {payment?.status === "awaiting_details" && (
          <WaitingCard payment={payment} />
        )}

        {payment?.status === "awaiting_payment" && (
          <PaymentDetailsCard
            payment={payment}
            isSubmitting={isSubmitting}
            onCopy={copyPaymentAddress}
            onSubmit={submitPayment}
          />
        )}

        {payment?.status === "under_review" && <ReviewCard payment={payment} />}

        {payment?.status === "approved" && <ApprovedCard />}

        {payment?.status === "rejected" && <RejectedCard payment={payment} />}
      </div>

      {showPreparingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-[#d4a72c]/30 bg-[#111111] p-7 text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setShowPreparingModal(false)}
              className="absolute right-5 top-5 text-white/30 transition hover:text-white"
              aria-label="Close notification"
            >
              <X size={19} />
            </button>

            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4a72c]/10 text-[#e6bd4f]">
              <LoaderCircle size={29} className="animate-spin" />
            </span>

            <h2 className="mt-6 text-2xl font-black">
              Preparing your payment account
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/50">
              Please hold while your one-time payment details are being
              prepared.
            </p>

            <div className="mt-5 flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-left">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-amber-300"
              />

              <p className="text-xs leading-6 text-amber-100/75">
                These payment details are assigned to your registration only. Do
                not share them with another user.
              </p>
            </div>

            <p className="mt-5 text-xs leading-5 text-white/30">
              You may close this notification. This page will continue checking
              for your payment details.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function WaitingCard({ payment }: { payment: PaymentRecord }) {
  return (
    <section className="rounded-3xl border border-blue-400/20 bg-blue-400/[0.07] p-6 sm:p-8">
      <Clock3 className="text-blue-300" size={28} />

      <h2 className="mt-5 text-xl font-black">Waiting for payment details</h2>

      <p className="mt-3 text-sm leading-7 text-white/50">
        Your selected method is{" "}
        <strong className="text-white">{formatLabel(payment.method)}</strong>.
        The administrator is preparing your one-time payment account.
      </p>

      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/30">
        Request: {payment.referenceCode}
      </p>
    </section>
  );
}

function PaymentDetailsCard({
  payment,
  isSubmitting,
  onCopy,
  onSubmit,
}: {
  payment: PaymentRecord;
  isSubmitting: boolean;
  onCopy: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="rounded-3xl border border-[#d4a72c]/25 bg-[#111111] p-6 sm:p-8">
      <CreditCard size={28} className="text-[#e6bd4f]" />

      <h2 className="mt-5 text-2xl font-black">Your payment details</h2>

      <p className="mt-2 text-sm text-white/40">
        Pay exactly $1,000 USD using the details below.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Detail label="Payment method" value={formatLabel(payment.method)} />

        <Detail
          label="Recipient"
          value={payment.paymentDetails?.recipientName ?? "Not provided"}
        />

        {payment.paymentDetails?.bankName && (
          <Detail
            label="Bank or provider"
            value={payment.paymentDetails.bankName}
          />
        )}

        <div className="sm:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30">
            Payment account
          </p>

          <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="break-all text-sm font-bold text-[#e6bd4f]">
              {payment.paymentDetails?.paymentAddress ?? "Not provided"}
            </p>

            <button
              type="button"
              onClick={onCopy}
              className="shrink-0 text-white/40 hover:text-white"
            >
              <Copy size={18} />
            </button>
          </div>
        </div>
      </div>

      {payment.paymentDetails?.instructions && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-white/30">
            Instructions
          </p>

          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-white/55">
            {payment.paymentDetails.instructions}
          </p>
        </div>
      )}

      <div className="mt-5 flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-300" />

        <p className="text-xs leading-6 text-amber-100/75">
          Use only these assigned details. Do not share them or send payment
          through details provided by another person.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-7 border-t border-white/10 pt-7">
        <label
          htmlFor="paymentProof"
          className="text-xs font-bold uppercase tracking-[0.14em] text-white/45"
        >
          Payment receipt screenshot
        </label>

        <div className="mt-2 rounded-2xl border border-dashed border-white/15 bg-[#090909] p-5">
          <input
            id="paymentProof"
            name="paymentProof"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-white/55 file:mr-4 file:rounded-full file:border-0 file:bg-[#d4a72c] file:px-5 file:py-2.5 file:text-xs file:font-black file:text-black hover:file:bg-[#efc95d]"
          />

          <p className="mt-3 text-xs leading-5 text-white/30">
            Upload a clear JPEG, PNG or WebP screenshot. Maximum file size: 2
            MB.
          </p>
        </div>

    

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#d4a72c] px-6 text-sm font-black text-black disabled:opacity-50"
        >
          {isSubmitting ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <DollarSign size={18} />
          )}
          Upload receipt for verification
        </button>
      </form>
    </section>
  );
}

function ReviewCard({ payment }: { payment: PaymentRecord }) {
  return (
    <section className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.07] p-6 sm:p-8">
      <Clock3 className="text-violet-300" size={28} />

      <h2 className="mt-5 text-xl font-black">
        Payment verification in progress
      </h2>

      <p className="mt-3 text-sm leading-7 text-white/50">
        Your transaction reference has been submitted. Your account will be
        unlocked after the administrator confirms your payment.
      </p>

      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/30">
        Payment receipt uploaded
      </p>
    </section>
  );
}

function ApprovedCard() {
  return (
    <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.07] p-6 sm:p-8">
      <CheckCircle2 className="text-emerald-300" size={30} />

      <h2 className="mt-5 text-xl font-black">Registration approved</h2>

      <p className="mt-3 text-sm leading-7 text-white/50">
        Your payment has been approved and your customer account is now active.
      </p>

      <a
        href="/account"
        className="mt-5 inline-flex rounded-full bg-emerald-400 px-6 py-3 text-sm font-black text-black"
      >
        Continue to dashboard
      </a>
    </section>
  );
}

function RejectedCard({ payment }: { payment: PaymentRecord }) {
  return (
    <section className="rounded-3xl border border-red-400/20 bg-red-400/[0.07] p-6 sm:p-8">
      <AlertTriangle className="text-red-300" size={28} />

      <h2 className="mt-5 text-xl font-black">Payment was not approved</h2>

      <p className="mt-3 text-sm leading-7 text-white/50">
        {payment.rejectionReason ??
          "Please confirm your payment information and submit another request."}
      </p>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-white/30">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-white/70">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    awaiting_details: "bg-blue-400/10 text-blue-300",
    awaiting_payment: "bg-amber-400/10 text-amber-300",
    under_review: "bg-violet-400/10 text-violet-300",
    approved: "bg-emerald-400/10 text-emerald-300",
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
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
