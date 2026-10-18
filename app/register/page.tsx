import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";

import CustomerAuthForm from "@/components/customer/customer-auth-form";
import { getCustomerSession } from "@/lib/customer-auth";

export default async function RegisterPage() {
  const session = await getCustomerSession();

  if (session) {
    redirect("/account");
  }

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#101010] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden border-r border-white/10 bg-[#0b0b0b] p-12 lg:block">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#d4a72c]/10 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-[#d4a72c]/5 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#d4a72c]">
              CrownRoute Logistics
            </p>

            <h1 className="mt-6 max-w-md text-5xl font-black leading-[1.05] tracking-[-0.05em]">
              Your shipments, managed from one secure account.
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-white/45">
              Register to request collections, manage your
              consignments and follow every delivery from pickup to
              arrival.
            </p>

            <div className="mt-12 space-y-5">
              <Feature
                icon={<ShieldCheck size={21} />}
                title="Secure customer account"
                text="Your account and shipment information are protected."
              />

              <Feature
                icon={<PackageCheck size={21} />}
                title="Shipment management"
                text="Request shipments and monitor pickup scheduling."
              />

              <Feature
                icon={<BadgeCheck size={21} />}
                title="Live tracking"
                text="Follow route checkpoints and delivery progress."
              />
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-14">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-white/40 transition hover:text-[#d4a72c]"
          >
            <ArrowLeft size={17} />
            Return home
          </Link>

          <p className="mt-10 text-xs font-black uppercase tracking-[0.2em] text-[#d4a72c]">
            Customer registration
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Create your account
          </h2>

          <p className="mt-3 text-sm leading-6 text-white/40">
            Registration payment instructions will be provided after
            your account is created.
          </p>

          <CustomerAuthForm mode="register" />
        </section>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d4a72c]/10 text-[#e6bd4f]">
        {icon}
      </span>

      <div>
        <h2 className="text-sm font-black">{title}</h2>
        <p className="mt-1 text-xs leading-6 text-white/35">
          {text}
        </p>
      </div>
    </div>
  );
}