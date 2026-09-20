import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BellRing,
  Boxes,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LayoutDashboard,
  MapPinned,
  PackagePlus,
  Route,
  ShieldCheck,
  TriangleAlert,
  Truck,
  Users,
  Mail,
} from "lucide-react";

import { LogoutButton } from "@/components/admin/logout-button";
import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { Shipment } from "@/models/shipment";
import { ContactInquiry } from "@/models/contact-inquiry";

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

const sidebarLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    Icon: LayoutDashboard,
    active: true,
  },
  {
    label: "New shipment",
    href: "/admin/shipments/new",
    Icon: PackagePlus,
  },
  {
    label: "All shipments",
    href: "/admin/shipments",
    Icon: Boxes,
  },
  {
    label: "Route management",
    href: "/admin/routes",
    Icon: Route,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    Icon: BellRing,
  },
  {
    label: "Admin accounts",
    href: "/admin/admins",
    Icon: Users,
  },
  {
    label: "Messages",
    href: "/admin/messages",
    Icon: Mail,
  },
];

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  await connectToDatabase();

  const admin = await Admin.findById(session.adminId)
    .select("name email role isActive")
    .lean();

  if (!admin || !admin.isActive) {
    redirect("/admin/login");
  }

  const [
    totalShipments,
    activeShipments,
    deliveredShipments,
    attentionRequired,
    newMessageCount,
    recentShipmentsResult,
  ] = await Promise.all([
    Shipment.countDocuments(),

    Shipment.countDocuments({
      status: {
        $in: ["processing", "in_transit", "customs", "out_for_delivery"],
      },
    }),

    Shipment.countDocuments({
      status: "delivered",
    }),

    Shipment.countDocuments({
      status: {
        $in: ["held", "delayed"],
      },
    }),

    ContactInquiry.countDocuments({
      status: "new",
    }),

    Shipment.find({})
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .select(
        "trackingNumber recipient.name origin destination status progress createdAt",
      )
      .lean(),
  ]);

  const recentShipments = recentShipmentsResult as unknown as RecentShipment[];

  const statistics = [
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
      description: "Currently being transported",
      Icon: Truck,
      color: "text-blue-300",
      background: "bg-blue-400/10",
    },
    {
      label: "Delivered",
      value: deliveredShipments,
      description: "Successfully completed",
      Icon: CheckCircle2,
      color: "text-emerald-300",
      background: "bg-emerald-400/10",
    },
    {
      label: "Needs attention",
      value: attentionRequired,
      description: "Held or delayed shipments",
      Icon: TriangleAlert,
      color: "text-red-300",
      background: "bg-red-400/10",
    },
  ];

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[270px_1fr]">
        <aside className="border-b border-white/10 bg-[#0c0c0c] p-5 lg:border-b-0 lg:border-r lg:p-6">
          <div className="flex items-center justify-between lg:block">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d4a72c]/40 bg-[#d4a72c]/10 text-lg font-black text-[#e6bd4f]">
                CR
              </span>

              <span>
                <span className="block text-sm font-black uppercase tracking-[0.12em]">
                  CrownRoute
                </span>

                <span className="block text-[9px] uppercase tracking-[0.3em] text-[#d4a72c]">
                  Operations
                </span>
              </span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-bold text-white/40 transition hover:text-[#e6bd4f] lg:hidden"
            >
              Website
              <ExternalLink size={14} />
            </Link>
          </div>

          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a72c]/10 text-[#e6bd4f]">
                <ShieldCheck size={19} />
              </span>

              <div className="min-w-0">
                <p className="truncate text-sm font-black">{admin.name}</p>

                <p className="truncate text-xs text-white/35">{admin.email}</p>
              </div>
            </div>

            <span className="mt-3 inline-flex rounded-full border border-[#d4a72c]/25 bg-[#d4a72c]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#e6bd4f]">
              {admin.role}
            </span>
          </div>

          <nav className="mt-7 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {sidebarLinks.map(({ label, href, Icon, active }) => (
              <Link
                key={label}
                href={href}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-[#d4a72c] text-black"
                    : "text-white/45 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
                {label === "Messages" && newMessageCount > 0 && (
                  <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
                    {newMessageCount > 99 ? "99+" : newMessageCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="mt-6 border-t border-white/10 pt-5 lg:mt-10">
            <Link
              href="/"
              className="mb-2 hidden items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/45 transition hover:bg-white/[0.05] hover:text-white lg:flex"
            >
              <ExternalLink size={18} />
              View website
            </Link>

            <LogoutButton />
          </div>
        </aside>

        <section className="min-w-0 p-5 sm:p-7 lg:p-10">
          <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
                Operations dashboard
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Welcome back, {admin.name.split(" ")[0]}
              </h1>

              <p className="mt-2 text-sm text-white/40">
                Monitor and manage CrownRoute shipment operations.
              </p>
            </div>

            <Link
              href="/admin/shipments/new"
              className="flex w-fit items-center gap-2 rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-black text-black transition hover:bg-[#efc95d]"
            >
              <PackagePlus size={18} />
              Create shipment
            </Link>
          </header>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statistics.map(
              ({ label, value, description, Icon, color, background }) => (
                <article
                  key={label}
                  className="rounded-3xl border border-white/10 bg-[#111111] p-6"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${background} ${color}`}
                  >
                    <Icon size={22} />
                  </div>

                  <p className="mt-6 text-3xl font-black">{value}</p>

                  <p className="mt-2 text-sm font-bold">{label}</p>

                  <p className="mt-1 text-xs text-white/30">{description}</p>
                </article>
              ),
            )}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.5fr]">
            <section className="rounded-3xl border border-white/10 bg-[#111111]">
              <div className="flex items-center justify-between border-b border-white/10 p-6">
                <div>
                  <h2 className="text-lg font-black">Recent shipments</h2>

                  <p className="mt-1 text-xs text-white/35">
                    The latest shipment records
                  </p>
                </div>

                <Link
                  href="/admin/shipments"
                  className="text-xs font-bold text-[#d4a72c]"
                >
                  View all
                </Link>
              </div>

              {recentShipments.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d4a72c]/10 text-[#e6bd4f]">
                    <Boxes size={27} />
                  </span>

                  <h3 className="mt-5 font-black">No shipments created</h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/35">
                    Create the first shipment to begin tracking its route and
                    checkpoints.
                  </p>

                  <Link
                    href="/admin/shipments/new"
                    className="mt-5 rounded-full border border-[#d4a72c]/40 px-5 py-2.5 text-xs font-black text-[#e6bd4f]"
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
                      className="block p-5 transition hover:bg-white/[0.025]"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-sm font-black text-[#e6bd4f]">
                            {shipment.trackingNumber}
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            {shipment.origin.city}, {shipment.origin.country}
                            {" → "}
                            {shipment.destination.city},{" "}
                            {shipment.destination.country}
                          </p>

                          <p className="mt-1 text-xs text-white/25">
                            Recipient: {shipment.recipient.name}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
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

            <aside className="rounded-3xl border border-white/10 bg-[#111111] p-6">
              <h2 className="text-lg font-black">Quick actions</h2>

              <div className="mt-6 space-y-3">
                <QuickAction
                  href="/admin/shipments/new"
                  Icon={PackagePlus}
                  label="Create shipment"
                />

                <QuickAction
                  href="/admin/shipments"
                  Icon={MapPinned}
                  label="Update tracking"
                />

                <QuickAction
                  href="/admin/notifications"
                  Icon={BellRing}
                  label="Publish notification"
                />

                <QuickAction
                  href="/admin/admins"
                  Icon={Users}
                  label="Manage admins"
                />

                <QuickAction
                  href="/admin/messages"
                  Icon={Mail}
                  label={
                    newMessageCount > 0
                      ? `Messages (${newMessageCount} new)`
                      : "Messages"
                  }
                />
              </div>

              <div className="mt-7 rounded-2xl border border-[#d4a72c]/20 bg-[#d4a72c]/[0.07] p-4">
                <div className="flex items-center gap-2 text-[#e6bd4f]">
                  <Clock3 size={17} />
                  <p className="text-xs font-black uppercase tracking-wider">
                    Session security
                  </p>
                </div>

                <p className="mt-3 text-xs leading-6 text-white/40">
                  This admin session expires automatically after eight hours.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

type QuickActionProps = {
  href: string;
  Icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  label: string;
};

function QuickAction({ href, Icon, label }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-sm font-bold text-white/65 transition hover:border-[#d4a72c]/40 hover:text-[#e6bd4f]"
    >
      <Icon size={18} />
      {label}
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
