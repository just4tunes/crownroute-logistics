"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to sign in.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080808] px-5 py-12 text-white">
      <div className="absolute left-[-120px] top-[-120px] h-96 w-96 rounded-full bg-[#d4a72c]/10 blur-[120px]" />

      <div className="absolute bottom-[-160px] right-[-100px] h-96 w-96 rounded-full bg-[#d4a72c]/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-white/45 transition hover:text-[#e6bd4f]"
        >
          <ArrowLeft size={17} />
          Return to CrownRoute
        </Link>

        <div className="rounded-[2rem] border border-white/10 bg-[#111111] p-6 shadow-2xl sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4a72c]/30 bg-[#d4a72c]/10 text-[#e6bd4f]">
            <ShieldCheck size={27} />
          </div>

          <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
            Secure access
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">
            Admin login
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/40">
            Sign in to manage shipments, checkpoints and customer
            notifications.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-bold text-white/55"
              >
                Email address
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 focus-within:border-[#d4a72c]/70">
                <Mail size={18} className="text-white/30" />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-white/25"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-bold text-white/55"
              >
                Password
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 focus-within:border-[#d4a72c]/70">
                <LockKeyhole size={18} className="text-white/30" />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  required
                  minLength={8}
                  autoComplete="current-password"
                  className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-white/25"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="text-white/35 transition hover:text-[#e6bd4f]"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#d4a72c] text-sm font-black text-black transition hover:bg-[#efc95d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <LoaderCircle size={18} className="animate-spin" />
              )}

              {submitting ? "Signing in..." : "Sign in securely"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-white/25">
            Access is restricted to authorized CrownRoute administrators.
          </p>
        </div>
      </div>
    </main>
  );
}