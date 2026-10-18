import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  LockKeyhole,
  PackageSearch,
} from "lucide-react";

import CustomerAuthForm from "@/components/customer/customer-auth-form";
import { getCustomerSession } from "@/lib/customer-auth";

export default async function CustomerLoginPage() {
  const session = await getCustomerSession();

  if (session) {
    redirect("/account");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 py-10 text-white">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#111111] p-6 shadow-2xl sm:p-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-white/40 transition hover:text-[#d4a72c]"
        >
          <ArrowLeft size={17} />
          Return home
        </Link>

        <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4a72c]/10 text-[#e6bd4f]">
          <LockKeyhole size={25} />
        </div>

        <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#d4a72c]">
          Customer portal
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          Welcome back
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/40">
          Sign in to manage your account and shipments.
        </p>

        <CustomerAuthForm mode="login" />

        <Link
          href="/tracking"
          className="mt-7 flex items-center justify-center gap-2 border-t border-white/10 pt-7 text-sm font-bold text-white/40 transition hover:text-[#d4a72c]"
        >
          <PackageSearch size={18} />
          Track without signing in
        </Link>
      </div>
    </main>
  );
}