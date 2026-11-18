import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  BellRing,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Mail,
  PackagePlus,
  Route,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { AdminNavigation } from "@/components/admin/admin-navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { ContactInquiry } from "@/models/contact-inquiry";
import { RegistrationPayment } from "@/models/registration-payment";
import { Shipment } from "@/models/shipment";
import { ShipmentCharge } from "@/models/shipment-charge";

export const dynamic = "force-dynamic";

type RecentShipment = {
  _id: {
    toString(): string;
  };
  trackingNumber: string;
  recipient: {
    name: string;
  };
  origin: {
    city: string;
    country: string;
  };
  destination: {
    city: string;
    country: string;
  };
  status: string;
  progress: number;
  createdAt: Date;
};

const activeShipmentStatuses = [
  "created",
  "processing",
  "in_transit",
  "customs",
  "out_for_delivery",
] as const;
const registrationAttentionStatuses = [
  "awaiting_details",
  "awaiting_payment",
  "under_review",
  "rejected",
] as const;
const shipmentAttentionStatuses = ["held", "delayed", "customs"] as const;

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  await connectToDatabase();

  const admin = await Admin.findById(session.adminId)
    .select("name role isActive")
    .lean();

  if (!admin || !admin.isActive) {
    redirect("/admin/login");
  }

  const [
    totalShipments,
    activeShipments,
    shipmentAttention,
    openCharges,
    paymentsAwaitingDetails,
    receiptsUnderReview,
    registrationPaymentsNeedingAttention,
    unreadMessages,
    deliveredShipments,
    recentShipmentsResult,
  ] = await Promise.all([
    Shipment.countDocuments(),
    Shipment.countDocuments({
      status: { $in: activeShipmentStatuses },
    }),
    Shipment.countDocuments({
      status: { $in: shipmentAttentionStatuses },
    }),
    ShipmentCharge.countDocuments({
      issueStatus: "open",
    }),
    ShipmentCharge.countDocuments({
      paymentStatus: "awaiting_details",
    }),
    ShipmentCharge.countDocuments({
      paymentStatus: "under_review",
    }),
    RegistrationPayment.countDocuments({
      status: { $in: registrationAttentionStatuses },
    }),
    ContactInquiry.countDocuments({
      status: "new",
    }),
    Shipment.countDocuments({
      status: "delivered",
    }),
    Shipment.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        "trackingNumber recipient.name origin destination status progress createdAt",
      )
      .lean(),
  ]);

  const recentShipments =
    recentShipmentsResult as unknown as RecentShipment[];

  const statistics: {
    label: string;
    value: number;
    description: string;
    Icon: ComponentType<{ size?: number; className?: string }>;
    color: string;
    background: string;
  }[] = [
    {
      label: "Total shipments",
      value: totalShipments,
      description: "All shipment records",
      Icon: Boxes,
      color: "text-[#e6bd4f]",
      background: "bg-[#d4a72c]/10",
    },
    {
      label: "Active shipments",
      value: activeShipments,
      description: "Created through out for delivery",
      Icon: Truck,
      color: "text-blue-300",
      background: "bg-blue-400/10",
    },
    {
      label: "Held, delayed or customs",
      value: shipmentAttention,
      description: "Shipment status needs attention",
      Icon: AlertTriangle,
      color: "text-red-300",
      background: "bg-red-400/10",
    },
    {
      label: "Open shipment issues",
      value: openCharges,
      description: "Unresolved shipment charges",
      Icon: CircleDollarSign,
      color: "text-amber-300",
      background: "bg-amber-400/10",
    },
    {
      label: "Payments awaiting details",
      value: paymentsAwaitingDetails,
      description: "Fee payment account details requested",
      Icon: Clock3,
      color: "text-violet-300",
      background: "bg-violet-400/10",
    },
    {
      label: "Receipts under review",
      value: receiptsUnderReview,
      description: "Fee receipts awaiting approval",
      Icon: CreditCard,
      color: "text-orange-300",
      background: "bg-orange-400/10",
    },
    {
      label: "Registration payments needing attention",
      value: registrationPaymentsNeedingAttention,
      description: "Awaiting details, payment, review or follow-up",
      Icon: ShieldCheck,
      color: "text-cyan-300",
      background: "bg-cyan-400/10",
    },
    {
      label: "Unread messages",
      value: unreadMessages,
      description: "New contact inquiries",
      Icon: Mail,
      color: "text-pink-300",
      background: "bg-pink-400/10",
    },
    {
      label: "Delivered",
      value: deliveredShipments,
      description: "Successfully completed",
      Icon: CheckCircle2,
      color: "text-emerald-300",
      background: "bg-emerald-400/10",
    },
  ];

  const attentionItems = [
    {
      label: "Shipment payments waiting for account details",
      count: paymentsAwaitingDetails,
      href: "/admin/shipment-charges",
      Icon: CircleDollarSign,
    },
    {
      label: "Receipts waiting for approval",
      count: receiptsUnderReview,
      href: "/admin/shipment-charges",
      Icon: CreditCard,
    },
    {
      label: "Registration payments needing attention",
      count: registrationPaymentsNeedingAttention,
      href: "/admin/registration-payments",
      Icon: ShieldCheck,
    },
    {
      label: "Held, delayed or customs shipments",
      count: shipmentAttention,
      href: "/admin/shipments",
      Icon: AlertTriangle,
    },
    {
      label: "Unread contact messages",
      count: unreadMessages,
      href: "/admin/messages",
      Icon: Mail,
    },
  ].filter((item) => item.count > 0);

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <AdminNavigation />
      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-7 lg:px-10 lg:py-10">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
              Operations dashboard
            </p>
            <h1 className="mt-2 break-words text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Welcome back, {admin.name.split(" ")[0]}
            </h1>
            <p className="mt-2 text-sm text-white/40">
              Monitor and manage CrownRoute shipment operations.
            </p>
          </div>
          <Link
            href="/admin/shipments/new"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-black text-black transition hover:bg-[#efc95d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6bd4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
          >
            <PackagePlus size={18} />
            Create shipment
          </Link>
        </header>

        <section
          aria-label="Operations summary"
          className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"
        >
          {statistics.map(
            ({ label, value, description, Icon, color, background }) => (
              <article
                key={label}
                className="min-w-0 rounded-3xl border border-white/10 bg-[#111111] p-5 sm:p-6"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${background} ${color}`}
                >
                  <Icon size={22} />
                </div>
                <p className="mt-5 break-words text-3xl font-black">{value}</p>
                <p className="mt-2 break-words text-sm font-bold">{label}</p>
                <p className="mt-1 break-words text-xs text-white/35">
                  {description}
                </p>
              </article>
            ),
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#111111] p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-black">Quick actions</h2>
            <p className="mt-1 text-sm text-white/40">
              Jump directly to a common admin task.
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <QuickAction
              href="/admin/shipments/new"
              Icon={PackagePlus}
              label="Create shipment"
            />
            <QuickAction
              href="/admin/shipments"
              Icon={Boxes}
              label="Manage shipments"
            />
            <QuickAction
              href="/admin/shipment-charges"
              Icon={CircleDollarSign}
              label="Review shipment fee payments"
            />
            <QuickAction
              href="/admin/registration-payments"
              Icon={CreditCard}
              label="Review registration payments"
            />
            <QuickAction
              href="/admin/messages"
              Icon={Mail}
              label="View messages"
            />
            <QuickAction
              href="/admin/routes"
              Icon={Route}
              label="Manage routes"
            />
            <QuickAction
              href="/admin/notifications"
              Icon={BellRing}
              label="Manage notifications"
            />
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#111111] p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-black">Attention required</h2>
            <p className="mt-1 text-sm text-white/40">
              Items that may need an administrator&apos;s review.
            </p>
          </div>
          {attentionItems.length === 0 ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4 text-emerald-200">
              <CheckCircle2 size={20} className="shrink-0" />
              <p className="text-sm font-bold">Everything is up to date</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {attentionItems.map(({ label, count, href, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4 transition hover:border-[#d4a72c]/50 hover:bg-[#d4a72c]/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6bd4f]"
                >
                  <Icon
                    size={19}
                    className="shrink-0 text-[#e6bd4f]"
                  />
                  <span className="min-w-0 flex-1 break-words text-sm font-semibold text-white/75">
                    {label}
                  </span>
                  <span className="shrink-0 rounded-full bg-[#d4a72c]/15 px-3 py-1 text-sm font-black text-[#e6bd4f]">
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#111111]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-black">Recent shipments</h2>
              <p className="mt-1 text-xs text-white/40">
                The latest shipment records
              </p>
            </div>
            <Link
              href="/admin/shipments"
              className="text-xs font-bold text-[#d4a72c] transition hover:text-[#efc95d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6bd4f]"
            >
              View all
            </Link>
          </div>

          {recentShipments.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <Boxes size={30} className="text-[#e6bd4f]" />
              <h3 className="mt-4 font-black">No shipments created</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
                Create the first shipment to begin tracking its route and
                checkpoints.
              </p>
              <Link
                href="/admin/shipments/new"
                className="mt-5 rounded-full border border-[#d4a72c]/40 px-5 py-2.5 text-xs font-black text-[#e6bd4f] transition hover:bg-[#d4a72c]/10"
              >
                Create shipment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {recentShipments.map((shipment) => (
                <Link
                  key={shipment._id.toString()}
                  href={`/admin/shipments/${shipment._id.toString()}`}
                  className="block min-w-0 p-5 transition hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e6bd4f]"
                >
                  <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-black text-[#e6bd4f]">
                        {shipment.trackingNumber}
                      </p>
                      <p className="mt-1 break-words text-xs text-white/45">
                        {shipment.origin.city}, {shipment.origin.country}
                        {" → "}
                        {shipment.destination.city},{" "}
                        {shipment.destination.country}
                      </p>
                      <p className="mt-1 break-words text-xs text-white/30">
                        Recipient: {shipment.recipient.name}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <StatusBadge status={shipment.status} />
                      <span className="text-sm font-black">
                        {shipment.progress}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d4a72c]/15 bg-[#d4a72c]/[0.04] p-4">
          <div className="flex items-center gap-3 text-[#e6bd4f]">
            <ShieldCheck size={18} />
            <p className="text-xs font-black uppercase tracking-wider">
              Session security
            </p>
          </div>
          <p className="text-xs leading-5 text-white/40">
            Admin sessions expire automatically after eight hours.
          </p>
        </div>
      </div>
    </main>
  );
}

function QuickAction({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm font-bold text-white/70 transition hover:border-[#d4a72c]/45 hover:bg-[#d4a72c]/[0.05] hover:text-[#e6bd4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6bd4f]"
    >
      <Icon size={18} className="shrink-0" />
      <span className="min-w-0 break-words">{label}</span>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
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

  const label = status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
        styles[status] ?? styles.created
      }`}
    >
      {label}
    </span>
  );
}
