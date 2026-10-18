"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import {
  FormEvent,
  useState,
} from "react";

type AuthMode = "register" | "login";

type ApiResponse = {
  success?: boolean;
  error?: string;
  nextPath?: string;
};

export default function CustomerAuthForm({
  mode,
}: {
  mode: AuthMode;
}) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const password = String(
      formData.get("password") ?? "",
    );

    if (mode === "register") {
      const confirmPassword = String(
        formData.get("confirmPassword") ?? "",
      );

      if (password !== confirmPassword) {
        setError("Your passwords do not match.");
        setIsSubmitting(false);
        return;
      }
    }

    const payload =
      mode === "register"
        ? {
            fullName: String(
              formData.get("fullName") ?? "",
            ),
            email: String(formData.get("email") ?? ""),
            phone: String(formData.get("phone") ?? ""),
            country: String(
              formData.get("country") ?? "",
            ),
            address: String(
              formData.get("address") ?? "",
            ),
            password,
          }
        : {
            email: String(formData.get("email") ?? ""),
            password,
          };

    try {
      const response = await fetch(
        `/api/customer/auth/${mode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data =
        (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        setError(
          data.error ??
            "Something went wrong. Please try again.",
        );
        return;
      }

      router.push(data.nextPath ?? "/account");
      router.refresh();
    } catch {
      setError(
        "Unable to connect to the server. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5"
    >
      {isRegister && (
        <>
          <FormField
            name="fullName"
            label="Full name"
            placeholder="Enter your full name"
            icon={<UserRound size={18} />}
            autoComplete="name"
          />

          <FormField
            name="phone"
            label="Phone number"
            placeholder="Enter your phone number"
            icon={<Phone size={18} />}
            autoComplete="tel"
          />

          <FormField
            name="country"
            label="Country"
            placeholder="Enter your country"
            icon={<MapPin size={18} />}
            autoComplete="country-name"
          />

          <div>
            <label
              htmlFor="address"
              className="text-xs font-bold uppercase tracking-[0.14em] text-white/45"
            >
              Full address
            </label>

            <div className="mt-2 flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 focus-within:border-[#d4a72c]/70">
              <MapPin
                size={18}
                className="mt-4 shrink-0 text-[#d4a72c]"
              />

              <textarea
                id="address"
                name="address"
                required
                minLength={5}
                maxLength={300}
                rows={3}
                autoComplete="street-address"
                placeholder="Enter your complete residential address"
                className="w-full resize-none bg-transparent px-3 py-3.5 text-sm text-white outline-none placeholder:text-white/20"
              />
            </div>
          </div>
        </>
      )}

      <FormField
        name="email"
        label="Email address"
        type="email"
        placeholder="Enter your email address"
        icon={<Mail size={18} />}
        autoComplete="email"
      />

      <div>
        <label
          htmlFor="password"
          className="text-xs font-bold uppercase tracking-[0.14em] text-white/45"
        >
          Password
        </label>

        <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 focus-within:border-[#d4a72c]/70">
          <LockKeyhole
            size={18}
            className="shrink-0 text-[#d4a72c]"
          />

          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            maxLength={128}
            autoComplete={
              isRegister
                ? "new-password"
                : "current-password"
            }
            placeholder="Minimum of 8 characters"
            className="h-14 w-full bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/20"
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((current) => !current)
            }
            className="text-white/35 transition hover:text-[#d4a72c]"
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

      {isRegister && (
        <FormField
          name="confirmPassword"
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password again"
          icon={<LockKeyhole size={18} />}
          autoComplete="new-password"
        />
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#d4a72c] px-6 text-sm font-black text-black transition hover:bg-[#efc95d] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle
              size={18}
              className="animate-spin"
            />
            Please wait
          </>
        ) : (
          <>
            {isRegister
              ? "Create customer account"
              : "Sign in to your account"}
            <ArrowRight size={18} />
          </>
        )}
      </button>

      <p className="text-center text-sm text-white/40">
        {isRegister
          ? "Already registered?"
          : "Do not have an account?"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-bold text-[#e6bd4f] hover:text-[#f2cf68]"
        >
          {isRegister ? "Sign in" : "Create account"}
        </Link>
      </p>
    </form>
  );
}

function FormField({
  name,
  label,
  placeholder,
  icon,
  type = "text",
  autoComplete,
}: {
  name: string;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="text-xs font-bold uppercase tracking-[0.14em] text-white/45"
      >
        {label}
      </label>

      <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 focus-within:border-[#d4a72c]/70">
        <span className="shrink-0 text-[#d4a72c]">
          {icon}
        </span>

        <input
          id={name}
          name={name}
          type={type}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-14 w-full bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/20"
        />
      </div>
    </div>
  );
}