import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Mail,
} from "lucide-react";

import {
  MessageInbox,
  type AdminMessage,
} from "@/components/admin/message-inbox";
import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { ContactInquiry } from "@/models/contact-inquiry";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  await connectToDatabase();

  const admin = await Admin.findOne({
    _id: session.adminId,
    isActive: true,
  })
    .select("name email role")
    .lean();

  if (!admin) {
    redirect("/admin/login");
  }

  const inquiryResults = await ContactInquiry.find({})
    .sort({
      createdAt: -1,
    })
    .lean();

  const messages: AdminMessage[] = inquiryResults.map(
    (inquiry) => ({
      id: inquiry._id.toString(),
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      company: inquiry.company,
      service: inquiry.service,
      message: inquiry.message,
      status: inquiry.status,
      createdAt: new Date(
        inquiry.createdAt,
      ).toISOString(),
    }),
  );

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-[#e6bd4f]"
            >
              <ArrowLeft size={17} />
              Back to dashboard
            </Link>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
              Customer communication
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Contact messages
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
              Review enquiries submitted through the CrownRoute
              contact page and follow up with prospective
              customers.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111111] p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4a72c]/10 text-[#e6bd4f]">
              <Mail size={20} />
            </span>

            <div>
              <p className="text-sm font-black">{admin.name}</p>

              <p className="text-xs text-white/35">
                {admin.email}
              </p>
            </div>
          </div>
        </header>

        <MessageInbox initialMessages={messages} />

        <div className="mt-8 flex justify-center">
          <Link
            href="/contact"
            target="_blank"
            className="inline-flex items-center gap-2 text-xs font-bold text-white/35 transition hover:text-[#e6bd4f]"
          >
            Open public contact page
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}