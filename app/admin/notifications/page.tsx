import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  ExternalLink,
  Info,
  MessageSquareWarning,
} from "lucide-react";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { Shipment } from "@/models/shipment";

export const dynamic = "force-dynamic";

type NotificationRecord = {
  _id?: {
    toString(): string;
  };
  title: string;
  message: string;
  type:
    | "information"
    | "success"
    | "warning"
    | "critical";
  showAsPopup: boolean;
  createdAt: Date;
};

type NotificationShipment = {
  _id: {
    toString(): string;
  };
  trackingNumber: string;
  recipient: {
    name: string;
  };
  notifications: NotificationRecord[];
};

type FlattenedNotification = NotificationRecord & {
  key: string;
  shipmentId: string;
  trackingNumber: string;
  recipientName: string;
};

export default async function NotificationsPage() {
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

  const shipmentResults = await Shipment.find({
    "notifications.0": {
      $exists: true,
    },
  })
    .select(
      "trackingNumber recipient.name notifications",
    )
    .lean();

  const shipments =
    shipmentResults as unknown as NotificationShipment[];

  const notifications: FlattenedNotification[] =
    shipments
      .flatMap((shipment) =>
        shipment.notifications.map(
          (notification, index) => ({
            ...notification,
            key:
              notification._id?.toString() ??
              `${shipment._id.toString()}-${index}`,
            shipmentId:
              shipment._id.toString(),
            trackingNumber:
              shipment.trackingNumber,
            recipientName:
              shipment.recipient.name,
          }),
        ),
      )
      .sort(
        (first, second) =>
          new Date(
            second.createdAt,
          ).getTime() -
          new Date(first.createdAt).getTime(),
      );

  const popupCount = notifications.filter(
    (notification) =>
      notification.showAsPopup,
  ).length;

  const warningCount = notifications.filter(
    (notification) =>
      notification.type === "warning" ||
      notification.type === "critical",
  ).length;

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
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
              Shipment notifications
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-white/40">
              Review notifications published to customer
              tracking pages.
            </p>
          </div>

          <Link
            href="/admin/shipments"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-black text-black transition hover:bg-[#efc95d]"
          >
            <BellRing size={17} />
            Choose shipment
          </Link>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Statistic
            label="Total notifications"
            value={notifications.length}
            Icon={BellRing}
            color="text-[#e6bd4f]"
            background="bg-[#d4a72c]/10"
          />

          <Statistic
            label="Popup notifications"
            value={popupCount}
            Icon={ExternalLink}
            color="text-blue-300"
            background="bg-blue-400/10"
          />

          <Statistic
            label="Warnings and critical"
            value={warningCount}
            Icon={AlertTriangle}
            color="text-red-300"
            background="bg-red-400/10"
          />
        </section>

        {notifications.length === 0 ? (
          <section className="mt-8 flex min-h-96 flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#111111] px-6 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#d4a72c]/10 text-[#e6bd4f]">
              <BellRing size={34} />
            </span>

            <h2 className="mt-6 text-2xl font-black">
              No notifications published
            </h2>

            <p className="mt-3 max-w-md text-sm leading-7 text-white/40">
              Choose a shipment and publish a notification
              from its management page.
            </p>

            <Link
              href="/admin/shipments"
              className="mt-6 rounded-full bg-[#d4a72c] px-6 py-3 text-sm font-black text-black"
            >
              View shipments
            </Link>
          </section>
        ) : (
          <section className="mt-8 space-y-4">
            {notifications.map((notification) => (
              <article
                key={`${notification.shipmentId}-${notification.key}`}
                className={`rounded-3xl border p-6 ${
                  notificationStyles[
                    notification.type
                  ]
                }`}
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div className="flex min-w-0 gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/20">
                      <NotificationIcon
                        type={notification.type}
                      />
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-black">
                          {notification.title}
                        </h2>

                        <span className="rounded-full bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                          {notification.type}
                        </span>

                        {notification.showAsPopup && (
                          <span className="rounded-full bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                            Popup
                          </span>
                        )}
                      </div>

                      <p className="mt-3 max-w-3xl text-sm leading-7 opacity-70">
                        {notification.message}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs opacity-50">
                        <span>
                          Tracking:{" "}
                          {notification.trackingNumber}
                        </span>

                        <span>
                          Recipient:{" "}
                          {notification.recipientName}
                        </span>

                        <span>
                          {formatDate(
                            notification.createdAt,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/admin/shipments/${notification.shipmentId}`}
                    className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-current/25 px-4 py-2 text-xs font-black transition hover:bg-black/20"
                  >
                    Manage shipment
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

const notificationStyles = {
  information:
    "border-blue-400/20 bg-blue-400/10 text-blue-200",
  success:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  warning:
    "border-amber-400/20 bg-amber-400/10 text-amber-200",
  critical:
    "border-red-400/20 bg-red-400/10 text-red-200",
};

function NotificationIcon({
  type,
}: {
  type:
    | "information"
    | "success"
    | "warning"
    | "critical";
}) {
  if (type === "success") {
    return <CheckCircle2 size={20} />;
  }

  if (type === "warning") {
    return <MessageSquareWarning size={20} />;
  }

  if (type === "critical") {
    return <AlertTriangle size={20} />;
  }

  return <Info size={20} />;
}

type StatisticProps = {
  label: string;
  value: number;
  Icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  color: string;
  background: string;
};

function Statistic({
  label,
  value,
  Icon,
  color,
  background,
}: StatisticProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#111111] p-5">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${background} ${color}`}
      >
        <Icon size={20} />
      </span>

      <p className="mt-5 text-3xl font-black">
        {value}
      </p>

      <p className="mt-1 text-xs font-bold text-white/45">
        {label}
      </p>
    </article>
  );
}

function formatDate(value: Date) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}