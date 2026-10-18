import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
} from "lucide-react";

import RegistrationPaymentsManager from "@/components/admin/registration-payments-manager";
import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationPaymentsPage() {
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

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-white/40 transition hover:text-[#d4a72c]"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <header className="mt-8">
          <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-[#d4a72c]/10 text-[#e6bd4f]">
            <CreditCard size={25} />
          </span>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#d4a72c]">
            Customer registration
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Registration payments
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
            Assign one-time payment details, verify
            customer payments and activate customer
            accounts.
          </p>
        </header>

        <div className="mt-9">
          <RegistrationPaymentsManager />
        </div>
      </div>
    </main>
  );
}