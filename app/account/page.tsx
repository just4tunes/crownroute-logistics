import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Clock3,
  CreditCard,
  Headphones,
  MapPin,
  PackagePlus,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import CustomerLogoutButton from "@/components/customer/customer-logout-button";
import { getCustomerSession } from "@/lib/customer-auth";
import { connectToDatabase } from "@/lib/db";
import { Customer } from "@/models/customer";

export const dynamic = "force-dynamic";

export default async function CustomerAccountPage() {
  const session = await getCustomerSession();

  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();

  const customer = await Customer.findById(session.customerId);

  if (!customer) {
    redirect("/login");
  }

  const accountIsActive = customer.accountStatus === "active";

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 rounded-3xl border border-white/10 bg-[#111111] p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d4a72c]">
              CrownRoute customer portal
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              Welcome, {customer.fullName}
            </h1>

            <p className="mt-2 text-sm text-white/40">{customer.email}</p>
          </div>

          <CustomerLogoutButton />
        </header>

        {!accountIsActive && (
          <section className="mt-7 rounded-3xl border border-[#d4a72c]/25 bg-[#d4a72c]/10 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#d4a72c]/15 text-[#f2cf68]">
                <Clock3 size={23} />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e6bd4f]">
                  Registration required
                </p>

                <h2 className="mt-2 text-xl font-black">
                  Complete your registration payment
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
                  Your account was created successfully. The next step is to
                  select your preferred payment method and receive your one-time
                  registration payment details.
                </p>

                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/35">
                  Payment status:{" "}
                  {formatLabel(customer.registrationPaymentStatus)}
                </p>

                <Link
                  href="/registration/payment"
                  className="mt-5 inline-flex rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-black text-black transition hover:bg-[#efc95d]"
                >
                  Select payment method
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AccountCard
            icon={<PackagePlus size={24} />}
            title="Create shipment"
            description={
              accountIsActive
                ? "Request a pickup and receive a tracking number."
                : "Available after your registration payment is approved."
            }
            disabled={!accountIsActive}
          />

          <Link
            href="/tracking"
            className="rounded-3xl border border-white/10 bg-[#111111] p-6 transition hover:border-[#d4a72c]/40"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4a72c]/10 text-[#e6bd4f]">
              <MapPin size={24} />
            </span>

            <h2 className="mt-6 text-lg font-black">Track a shipment</h2>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Enter a tracking number to see live delivery progress.
            </p>
          </Link>

          <AccountCard
            icon={<CreditCard size={24} />}
            title="Payment history"
            description="View your registration and shipment payment records."
            disabled={!accountIsActive}
          />

          <AccountCard
            icon={<UserRound size={24} />}
            title="Account information"
            description={`${customer.phone} · ${customer.country}`}
          />

          <AccountCard
            icon={<ShieldCheck size={24} />}
            title="Account status"
            description={formatLabel(customer.accountStatus)}
          />

          <Link
            href="/contact"
            className="rounded-3xl border border-white/10 bg-[#111111] p-6 transition hover:border-[#d4a72c]/40"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4a72c]/10 text-[#e6bd4f]">
              <Headphones size={24} />
            </span>

            <h2 className="mt-6 text-lg font-black">Customer support</h2>

            <p className="mt-2 text-sm leading-6 text-white/40">
              Contact CrownRoute if you need assistance.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}

function AccountCard({
  icon,
  title,
  description,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-[#111111] p-6 ${
        disabled ? "opacity-45" : ""
      }`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4a72c]/10 text-[#e6bd4f]">
        {icon}
      </span>

      <h2 className="mt-6 text-lg font-black">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-white/40">{description}</p>

      {disabled && (
        <p className="mt-4 text-xs font-black uppercase tracking-wider text-[#d4a72c]">
          Locked
        </p>
      )}
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
