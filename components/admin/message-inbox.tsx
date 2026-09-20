"use client";

import {
  Building2,
  CheckCheck,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Mail,
  MailOpen,
  MessageSquare,
  Phone,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

type MessageStatus = "new" | "read" | "replied";

export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
};

type MessageInboxProps = {
  initialMessages: AdminMessage[];
};

export function MessageInbox({
  initialMessages,
}: MessageInboxProps) {
  const [messages, setMessages] =
    useState(initialMessages);

  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const counts = useMemo(
    () => ({
      total: messages.length,
      new: messages.filter(
        (message) => message.status === "new",
      ).length,
      read: messages.filter(
        (message) => message.status === "read",
      ).length,
      replied: messages.filter(
        (message) => message.status === "replied",
      ).length,
    }),
    [messages],
  );

  async function updateStatus(
    messageId: string,
    status: MessageStatus,
  ) {
    setBusyId(messageId);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/messages/${messageId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to update message.",
        );
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                status,
              }
            : message,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update message.",
      );
    } finally {
      setBusyId("");
    }
  }

  async function deleteMessage(messageId: string) {
    const confirmed = window.confirm(
      "Delete this contact message permanently?",
    );

    if (!confirmed) {
      return;
    }

    setBusyId(messageId);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/messages/${messageId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to delete message.",
        );
      }

      setMessages((currentMessages) =>
        currentMessages.filter(
          (message) => message.id !== messageId,
        ),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete message.",
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticCard
          label="All messages"
          value={counts.total}
          Icon={MessageSquare}
          color="text-[#e6bd4f]"
          background="bg-[#d4a72c]/10"
        />

        <StatisticCard
          label="New"
          value={counts.new}
          Icon={Mail}
          color="text-blue-300"
          background="bg-blue-400/10"
        />

        <StatisticCard
          label="Read"
          value={counts.read}
          Icon={MailOpen}
          color="text-amber-300"
          background="bg-amber-400/10"
        />

        <StatisticCard
          label="Replied"
          value={counts.replied}
          Icon={CheckCheck}
          color="text-emerald-300"
          background="bg-emerald-400/10"
        />
      </section>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {messages.length === 0 ? (
        <section className="mt-8 flex min-h-96 flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#111111] px-6 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#d4a72c]/10 text-[#e6bd4f]">
            <Mail size={34} />
          </span>

          <h2 className="mt-6 text-2xl font-black">
            No contact messages
          </h2>

          <p className="mt-3 max-w-md text-sm leading-7 text-white/40">
            Messages submitted through the contact page will
            appear here.
          </p>
        </section>
      ) : (
        <section className="mt-8 space-y-5">
          {messages.map((message) => {
            const loading = busyId === message.id;

            return (
              <article
                key={message.id}
                className={`rounded-3xl border bg-[#111111] p-6 transition ${
                  message.status === "new"
                    ? "border-[#d4a72c]/45"
                    : "border-white/10"
                }`}
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-black">
                        {message.name}
                      </h2>

                      <StatusBadge status={message.status} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/45">
                      <a
                        href={`mailto:${message.email}`}
                        className="flex items-center gap-2 transition hover:text-[#e6bd4f]"
                      >
                        <Mail size={15} />
                        {message.email}
                      </a>

                      {message.phone && (
                        <a
                          href={`tel:${message.phone}`}
                          className="flex items-center gap-2 transition hover:text-[#e6bd4f]"
                        >
                          <Phone size={15} />
                          {message.phone}
                        </a>
                      )}

                      {message.company && (
                        <span className="flex items-center gap-2">
                          <Building2 size={15} />
                          {message.company}
                        </span>
                      )}

                      <span className="flex items-center gap-2">
                        <Clock3 size={15} />
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
                      Requested service
                    </p>

                    <p className="mt-2 text-sm font-bold text-[#e6bd4f]">
                      {message.service}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-white/65">
                    {message.message}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {message.status === "new" && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        void updateStatus(
                          message.id,
                          "read",
                        )
                      }
                      className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-black text-white/65 transition hover:border-[#d4a72c]/50 hover:text-[#e6bd4f] disabled:opacity-50"
                    >
                      <MailOpen size={15} />
                      Mark as read
                    </button>
                  )}

                  {message.status !== "replied" && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        void updateStatus(
                          message.id,
                          "replied",
                        )
                      }
                      className="flex items-center gap-2 rounded-full border border-emerald-400/25 px-4 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-50"
                    >
                      <CheckCheck size={15} />
                      Mark replied
                    </button>
                  )}

                  <a
                    href={`mailto:${message.email}?subject=${encodeURIComponent(
                      `CrownRoute enquiry: ${message.service}`,
                    )}`}
                    className="flex items-center gap-2 rounded-full bg-[#d4a72c] px-4 py-2 text-xs font-black text-black transition hover:bg-[#efc95d]"
                  >
                    <ExternalLink size={15} />
                    Reply by email
                  </a>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      void deleteMessage(message.id)
                    }
                    className="flex items-center gap-2 rounded-full border border-red-400/25 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                  >
                    {loading ? (
                      <LoaderCircle
                        size={15}
                        className="animate-spin"
                      />
                    ) : (
                      <Trash2 size={15} />
                    )}

                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}

type StatisticCardProps = {
  label: string;
  value: number;
  Icon: React.ComponentType<{
    size?: number;
    className?: string;
  }>;
  color: string;
  background: string;
};

function StatisticCard({
  label,
  value,
  Icon,
  color,
  background,
}: StatisticCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#111111] p-5">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${background} ${color}`}
      >
        <Icon size={20} />
      </div>

      <p className="mt-5 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold text-white/45">
        {label}
      </p>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status: MessageStatus;
}) {
  const styles: Record<MessageStatus, string> = {
    new: "bg-blue-400/10 text-blue-300",
    read: "bg-amber-400/10 text-amber-300",
    replied: "bg-emerald-400/10 text-emerald-300",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}