"use client";

import {
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  CheckCircle2,
  LoaderCircle,
  Send,
} from "lucide-react";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  service: "general",
  message: "",
  website: "",
};

export function ContactForm() {
  const [form, setForm] =
    useState(initialForm);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  function updateField(
    event: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >,
  ) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/contact",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        setError(
          data?.error ??
            "Unable to send your enquiry.",
        );

        return;
      }

      setSuccess(
        data?.message ??
          "Your enquiry has been received.",
      );

      setForm(initialForm);
    } catch (requestError) {
      console.error(
        "Contact form error:",
        requestError,
      );

      setError(
        "Unable to connect to the server.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white/10 bg-[#111111] p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Full name"
          name="name"
          value={form.name}
          onChange={updateField}
          required
        />

        <FormField
          label="Email address"
          name="email"
          type="email"
          value={form.email}
          onChange={updateField}
          required
        />

        <FormField
          label="Phone number"
          name="phone"
          value={form.phone}
          onChange={updateField}
          placeholder="Optional"
        />

        <FormField
          label="Company"
          name="company"
          value={form.company}
          onChange={updateField}
          placeholder="Optional"
        />

        <div className="sm:col-span-2">
          <label
            htmlFor="service"
            className="mb-2 block text-xs font-bold text-white/55"
          >
            Service required
          </label>

          <select
            id="service"
            name="service"
            value={form.service}
            onChange={updateField}
            className="h-14 w-full rounded-xl border border-white/10 bg-[#181818] px-4 text-sm outline-none focus:border-[#d4a72c]/70"
          >
            <option value="general">
              General enquiry
            </option>

            <option value="parcel">
              Parcel delivery
            </option>

            <option value="air">
              Air freight
            </option>

            <option value="ocean">
              Ocean freight
            </option>

            <option value="rail">
              Rail freight
            </option>

            <option value="express">
              Express delivery
            </option>

            <option value="freight">
              Freight coordination
            </option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="message"
            className="mb-2 block text-xs font-bold text-white/55"
          >
            Shipment information
          </label>

          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={updateField}
            required
            rows={6}
            placeholder="Tell us what you are shipping, the origin, destination and expected delivery date."
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-white/20 focus:border-[#d4a72c]/70"
          />
        </div>

        <div
          className="absolute -left-[9999px]"
          aria-hidden="true"
        >
          <label htmlFor="website">
            Website
          </label>

          <input
            id="website"
            name="website"
            value={form.website}
            onChange={updateField}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />

          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#d4a72c] px-7 text-sm font-black text-black transition hover:bg-[#efc95d] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <LoaderCircle
            size={18}
            className="animate-spin"
          />
        ) : (
          <Send size={18} />
        )}

        {submitting
          ? "Sending enquiry..."
          : "Send enquiry"}
      </button>
    </form>
  );
}

type FormFieldProps = {
  label: string;
  name: string;
  value: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
};

function FormField({
  label,
  name,
  value,
  type = "text",
  placeholder,
  required,
  onChange,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold text-white/55"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={onChange}
        className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none transition placeholder:text-white/20 focus:border-[#d4a72c]/70"
      />
    </div>
  );
}