import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

import RegistrationPaymentClient from "@/components/customer/registration-payment-client";
import { getCustomerSession } from "@/lib/customer-auth";
import { connectToDatabase } from "@/lib/db";
import { Customer } from "@/models/customer";

export const dynamic = "force-dynamic";

export default async function RegistrationPaymentPage() {
  const session = await getCustomerSession();

  if (!session) {
    redirect("/login");
  }

  await connectToDatabase();

  const customer = await Customer.findById(
    session.customerId,
  );

  if (!customer) {
    redirect("/login");
  }

  if (customer.accountStatus === "active") {
    redirect("/account");
  }

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-8 text-white lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm font-bold text-white/40 transition hover:text-[#d4a72c]"
        >
          <ArrowLeft size={17} />
          Return to account
        </Link>

        <header className="mt-8 rounded-3xl border border-white/10 bg-[#111111] p-6 sm:p-8">
          <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#d4a72c]/10 text-[#e6bd4f]">
            <ShieldCheck size={25} />
          </span>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#d4a72c]">
            Secure registration
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Complete your registration
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
            Select your preferred payment method.
            Your one-time payment details will be
            assigned specifically to your account.
          </p>
        </header>

        <div className="mt-6">
          <RegistrationPaymentClient />
        </div>
      </div>
    </main>
  );
}