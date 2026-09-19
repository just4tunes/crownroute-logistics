"use client";

import Link from "next/link";
import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  LoaderCircle,
  MapPin,
  PackagePlus,
  Route,
  UserRound,
} from "lucide-react";

const initialForm = {
  senderName: "",
  senderEmail: "",
  recipientName: "",
  recipientEmail: "",
  originCity: "",
  originCountry: "",
  originLatitude: "",
  originLongitude: "",
  destinationCity: "",
  destinationCountry: "",
  destinationLatitude: "",
  destinationLongitude: "",
  packageDescription: "",
  weight: "",
  serviceMode: "air",
  departureDate: "",
  arrivalDate: "",
};

type CreatedShipment = {
  id: string;
  trackingNumber: string;
};

export function CreateShipmentForm() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdShipment, setCreatedShipment] =
    useState<CreatedShipment | null>(null);
  const [copied, setCopied] = useState(false);

  function updateField(
    event: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

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
    setSubmitting(true);

    try {
      const requiredFields = [
        form.senderName,
        form.recipientName,
        form.originCity,
        form.originCountry,
        form.originLatitude,
        form.originLongitude,
        form.destinationCity,
        form.destinationCountry,
        form.destinationLatitude,
        form.destinationLongitude,
        form.packageDescription,
        form.departureDate,
        form.arrivalDate,
      ];

      if (
        requiredFields.some((field) => !field.trim())
      ) {
        setError(
          "Complete all required shipment fields.",
        );
        return;
      }

      const originLatitude = Number(
        form.originLatitude,
      );

      const originLongitude = Number(
        form.originLongitude,
      );

      const destinationLatitude = Number(
        form.destinationLatitude,
      );

      const destinationLongitude = Number(
        form.destinationLongitude,
      );

      const coordinates = [
        originLatitude,
        originLongitude,
        destinationLatitude,
        destinationLongitude,
      ];

      if (
        coordinates.some((coordinate) =>
          Number.isNaN(coordinate),
        )
      ) {
        setError(
          "Enter valid origin and destination coordinates.",
        );
        return;
      }

      if (
        originLatitude < -90 ||
        originLatitude > 90 ||
        destinationLatitude < -90 ||
        destinationLatitude > 90
      ) {
        setError(
          "Latitude must be between -90 and 90.",
        );
        return;
      }

      if (
        originLongitude < -180 ||
        originLongitude > 180 ||
        destinationLongitude < -180 ||
        destinationLongitude > 180
      ) {
        setError(
          "Longitude must be between -180 and 180.",
        );
        return;
      }

      if (
        form.senderEmail &&
        !form.senderEmail.includes("@")
      ) {
        setError(
          "Enter a valid sender email or leave it blank.",
        );
        return;
      }

      if (
        form.recipientEmail &&
        !form.recipientEmail.includes("@")
      ) {
        setError(
          "Enter a valid recipient email or leave it blank.",
        );
        return;
      }

      const weight = form.weight
        ? Number(form.weight)
        : undefined;

      if (
        weight !== undefined &&
        (Number.isNaN(weight) || weight <= 0)
      ) {
        setError(
          "Weight must be greater than zero or left blank.",
        );
        return;
      }

      const departureDate = new Date(
        form.departureDate,
      );

      const arrivalDate = new Date(
        form.arrivalDate,
      );

      if (
        Number.isNaN(departureDate.getTime()) ||
        Number.isNaN(arrivalDate.getTime())
      ) {
        setError(
          "Enter valid departure and arrival dates.",
        );
        return;
      }

      if (
        arrivalDate.getTime() <=
        departureDate.getTime()
      ) {
        setError(
          "The arrival date must be later than the departure date.",
        );
        return;
      }

      const response = await fetch(
        "/api/admin/shipments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderName: form.senderName.trim(),
            senderEmail: form.senderEmail.trim(),

            recipientName:
              form.recipientName.trim(),
            recipientEmail:
              form.recipientEmail.trim(),

            originCity: form.originCity.trim(),
            originCountry:
              form.originCountry.trim(),
            originLatitude,
            originLongitude,

            destinationCity:
              form.destinationCity.trim(),
            destinationCountry:
              form.destinationCountry.trim(),
            destinationLatitude,
            destinationLongitude,

            packageDescription:
              form.packageDescription.trim(),

            weight,
            serviceMode: form.serviceMode,

            departureDate:
              departureDate.toISOString(),

            arrivalDate:
              arrivalDate.toISOString(),

            autoProgressEnabled: true,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        console.error(
          "Create shipment API response:",
          data,
        );

        setError(
          data?.error ??
            `Unable to create the shipment. Server returned ${response.status}.`,
        );

        return;
      }

      if (!data?.shipment?.trackingNumber) {
        setError(
          "The shipment was created, but no tracking number was returned.",
        );
        return;
      }

      setCreatedShipment(data.shipment);
    } catch (submitError) {
      console.error(
        "Create shipment request failed:",
        submitError,
      );

      setError(
        "Unable to connect to the server. Check the terminal for details.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyTrackingNumber() {
    if (!createdShipment) {
      return;
    }

    await navigator.clipboard.writeText(
      createdShipment.trackingNumber,
    );

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  if (createdShipment) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 py-12 text-white">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#111111] p-7 text-center shadow-2xl sm:p-10">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 size={36} />
          </span>

          <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
            Shipment created
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Tracking is ready
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/40">
            CrownRoute generated the tracking number
            and scheduled the route checkpoints between
            the selected departure and arrival dates.
          </p>

          <div className="mt-7 rounded-2xl border border-[#d4a72c]/25 bg-[#d4a72c]/[0.07] p-5">
            <p className="text-xs uppercase tracking-wider text-white/35">
              Tracking number
            </p>

            <p className="mt-2 text-2xl font-black text-[#e6bd4f]">
              {createdShipment.trackingNumber}
            </p>

            <button
              type="button"
              onClick={copyTrackingNumber}
              className="mx-auto mt-4 flex items-center gap-2 text-xs font-bold text-white/50 transition hover:text-white"
            >
              <Copy size={15} />

              {copied
                ? "Copied"
                : "Copy tracking number"}
            </button>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/tracking?number=${encodeURIComponent(
                createdShipment.trackingNumber,
              )}`}
              className="rounded-xl bg-[#d4a72c] px-5 py-3.5 text-sm font-black text-black transition hover:bg-[#efc95d]"
            >
              View public tracking
            </Link>

            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                setCreatedShipment(null);
                setCopied(false);
                setError("");
              }}
              className="rounded-xl border border-white/15 px-5 py-3.5 text-sm font-black text-white/65 transition hover:border-[#d4a72c]/50 hover:text-[#e6bd4f]"
            >
              Create another
            </button>
          </div>

          <Link
            href="/admin"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/35 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Return to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-[#e6bd4f]"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <header className="mt-7">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
            Shipment management
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Create a new shipment
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
            Enter the shipment information.
            CrownRoute will generate the tracking number
            and distribute the route checkpoints between
            the departure and arrival dates.
          </p>
        </header>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="mt-9 space-y-6"
        >
          <FormSection
            icon={<UserRound size={21} />}
            title="Sender and recipient"
            description="Basic information about the shipment parties."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Sender name"
                name="senderName"
                value={form.senderName}
                onChange={updateField}
                required
              />

              <FormField
                label="Sender email"
                name="senderEmail"
                type="email"
                value={form.senderEmail}
                onChange={updateField}
              />

              <FormField
                label="Recipient name"
                name="recipientName"
                value={form.recipientName}
                onChange={updateField}
                required
              />

              <FormField
                label="Recipient email"
                name="recipientEmail"
                type="email"
                value={form.recipientEmail}
                onChange={updateField}
              />
            </div>
          </FormSection>

          <FormSection
            icon={<MapPin size={21} />}
            title="Origin and destination"
            description="Coordinates are used to generate the planned route."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Origin city"
                name="originCity"
                value={form.originCity}
                onChange={updateField}
                required
              />

              <FormField
                label="Origin country"
                name="originCountry"
                value={form.originCountry}
                onChange={updateField}
                required
              />

              <FormField
                label="Origin latitude"
                name="originLatitude"
                type="number"
                step="any"
                placeholder="Example: 40.7128"
                value={form.originLatitude}
                onChange={updateField}
                required
              />

              <FormField
                label="Origin longitude"
                name="originLongitude"
                type="number"
                step="any"
                placeholder="Example: -74.0060"
                value={form.originLongitude}
                onChange={updateField}
                required
              />

              <FormField
                label="Destination city"
                name="destinationCity"
                value={form.destinationCity}
                onChange={updateField}
                required
              />

              <FormField
                label="Destination country"
                name="destinationCountry"
                value={form.destinationCountry}
                onChange={updateField}
                required
              />

              <FormField
                label="Destination latitude"
                name="destinationLatitude"
                type="number"
                step="any"
                placeholder="Example: 51.5074"
                value={form.destinationLatitude}
                onChange={updateField}
                required
              />

              <FormField
                label="Destination longitude"
                name="destinationLongitude"
                type="number"
                step="any"
                placeholder="Example: -0.1278"
                value={form.destinationLongitude}
                onChange={updateField}
                required
              />
            </div>
          </FormSection>

          <FormSection
            icon={<PackagePlus size={21} />}
            title="Package information"
            description="Shipment type, weight and scheduled journey dates."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="packageDescription"
                  className="mb-2 block text-xs font-bold text-white/55"
                >
                  Package description
                </label>

                <textarea
                  id="packageDescription"
                  name="packageDescription"
                  value={form.packageDescription}
                  onChange={updateField}
                  required
                  rows={4}
                  placeholder="Describe the parcel or cargo"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-[#d4a72c]/70"
                />
              </div>

              <FormField
                label="Weight in kilograms"
                name="weight"
                type="number"
                step="0.01"
                placeholder="Optional"
                value={form.weight}
                onChange={updateField}
              />

              <div>
                <label
                  htmlFor="serviceMode"
                  className="mb-2 block text-xs font-bold text-white/55"
                >
                  Service mode
                </label>

                <select
                  id="serviceMode"
                  name="serviceMode"
                  value={form.serviceMode}
                  onChange={updateField}
                  className="h-14 w-full rounded-xl border border-white/10 bg-[#151515] px-4 text-sm outline-none focus:border-[#d4a72c]/70"
                >
                  <option value="parcel">
                    Parcel
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
                    Express
                  </option>
                </select>
              </div>

              <FormField
                label="Departure date and time"
                name="departureDate"
                type="datetime-local"
                value={form.departureDate}
                onChange={updateField}
                required
              />

              <FormField
                label="Arrival date and time"
                name="arrivalDate"
                type="datetime-local"
                value={form.arrivalDate}
                onChange={updateField}
                required
              />
            </div>
          </FormSection>

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#d4a72c]/20 bg-[#d4a72c]/[0.06] p-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Route
                size={21}
                className="mt-0.5 shrink-0 text-[#e6bd4f]"
              />

              <div>
                <p className="text-sm font-black">
                  Automatic route generation
                </p>

                <p className="mt-1 text-xs leading-5 text-white/35">
                  Checkpoints will be distributed between
                  the selected departure and arrival dates.
                  Automatic progress will be enabled.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#d4a72c] px-7 text-sm font-black text-black transition hover:bg-[#efc95d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <PackagePlus size={18} />
              )}

              {submitting
                ? "Creating shipment..."
                : "Create shipment"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

type FormSectionProps = {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
};

function FormSection({
  icon,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#111111] p-6 sm:p-8">
      <div className="mb-7 flex items-start gap-4 border-b border-white/10 pb-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d4a72c]/10 text-[#e6bd4f]">
          {icon}
        </span>

        <div>
          <h2 className="font-black">{title}</h2>

          <p className="mt-1 text-xs leading-5 text-white/35">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

type FormFieldProps = {
  label: string;
  name: string;
  value: string;
  type?: string;
  step?: string;
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
  step,
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
        step={step}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={onChange}
        className="h-14 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none transition placeholder:text-white/20 focus:border-[#d4a72c]/70"
      />
    </div>
  );
}