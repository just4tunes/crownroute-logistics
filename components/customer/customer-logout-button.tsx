"use client";

import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  LogOut,
} from "lucide-react";
import { useState } from "react";

export default function CustomerLogoutButton() {
  const router = useRouter();

  const [isLoading, setIsLoading] =
    useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      await fetch("/api/customer/auth/logout", {
        method: "POST",
      });

      router.push("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-bold text-white/55 transition hover:border-red-400/30 hover:text-red-300 disabled:opacity-50"
    >
      {isLoading ? (
        <LoaderCircle
          size={17}
          className="animate-spin"
        />
      ) : (
        <LogOut size={17} />
      )}

      Sign out
    </button>
  );
}