"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
      });

      router.replace("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/45 transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
    >
      {loading ? (
        <LoaderCircle size={18} className="animate-spin" />
      ) : (
        <LogOut size={18} />
      )}

      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}