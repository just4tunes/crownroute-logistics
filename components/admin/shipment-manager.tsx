"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Navigation,
  Save,
  Truck,
} from "lucide-react";

type CheckpointStatus =
  | "pending"
  | "active"
  | "completed";

type CompletionSource =
  | "admin"
  | "automatic";

type NotificationType =
  | "information"
  | "success"
  | "warning"
  | "critical";

type Checkpoint = {
  _id: string;
  location: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  description: string;
  estimatedArrival?: string;
  completedAt?: string;
  status: CheckpointStatus;
  completionSource?: CompletionSource;
};

type ShipmentNotification = {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  showAsPopup: boolean;
  createdAt: string;
};

type ShipmentData = {
  _id: string;
  trackingNumber: string;

  sender: {
    name: string;
    email?: string;
  };

  recipient: {
    name: string;
    email?: string;
  };

  origin: {
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };

  destination: {
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };

  packageDescription: string;
  weight?: number;
  serviceMode: string;
  status: string;

  departureDate?: string;
  arrivalDate?: string;
  estimatedDelivery?: string;

  progress: number;
  autoProgressEnabled?: boolean;
  lastAutomaticUpdateAt?: string;

  currentLocation?: {
    name?: string;
    latitude?: number;
    longitude?: number;
    source?: CompletionSource;
  };

  checkpoints: Checkpoint[];
  notifications: ShipmentNotification[];
};

type ShipmentManagerProps = {
  initialShipment: ShipmentData;
};

const shipmentStatuses = [
  "created",
  "processing",
  "in_transit",
  "customs",
  "held",
  "delayed",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export function ShipmentManager({
  initialShipment,
}: ShipmentManagerProps) {
  const [shipment, setShipment] =
    useState(initialShipment);

  const [selectedStatus, setSelectedStatus] =
    useState(initialShipment.status);

  const [locationName, setLocationName] =
    useState("");

  const [latitude, setLatitude] =
    useState("");

  const [longitude, setLongitude] =
    useState("");

  const [
    notificationTitle,
    setNotificationTitle,
  ] = useState("");

  const [
    notificationMessage,
    setNotificationMessage,
  ] = useState("");

  const [
    notificationType,
    setNotificationType,
  ] = useState<NotificationType>(
    "information",
  );

  const [showAsPopup, setShowAsPopup] =
    useState(false);

  const [loadingAction, setLoadingAction] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeCheckpoint =
    shipment.checkpoints.find(
      (checkpoint) =>
        checkpoint.status === "active",
    ) ?? null;

  useEffect(() => {
    if (!activeCheckpoint) {
      setLocationName("");
      setLatitude("");
      setLongitude("");
      return;
    }

    setLocationName(activeCheckpoint.location);

    setLatitude(
      String(activeCheckpoint.latitude),
    );

    setLongitude(
      String(activeCheckpoint.longitude),
    );
  }, [
    activeCheckpoint?._id,
    activeCheckpoint?.location,
    activeCheckpoint?.latitude,
    activeCheckpoint?.longitude,
  ]);

  async function updateShipment(
    action: Record<string, unknown>,
    actionName: string,
  ) {
    setLoadingAction(actionName);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/shipments/${shipment._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(action),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        console.error(
          "Update shipment API response:",
          data,
        );

        setError(
          data?.error ??
            `Unable to update shipment. Server returned ${response.status}.`,
        );

        return null;
      }

      if (!data?.shipment) {
        setError(
          "The server did not return the updated shipment.",
        );

        return null;
      }

      setShipment(data.shipment);
      setSelectedStatus(data.shipment.status);

      setSuccess(
        data.message ??
          "Shipment updated successfully.",
      );

      return data.shipment as ShipmentData;
    } catch (requestError) {
      console.error(
        "Update shipment request failed:",
        requestError,
      );

      setError(
        "Unable to connect to the server.",
      );

      return null;
    } finally {
      setLoadingAction("");
    }
  }

  async function handleStatusUpdate() {
    await updateShipment(
      {
        action: "update_status",
        status: selectedStatus,
      },
      "status",
    );
  }

  async function handleLocationUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!activeCheckpoint) {
      setError(
        "There is no active checkpoint.",
      );

      return;
    }

    if (!locationName.trim()) {
      setError("Enter a location name.");
      return;
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (
      Number.isNaN(parsedLatitude) ||
      Number.isNaN(parsedLongitude)
    ) {
      setError(
        "Enter valid latitude and longitude values.",
      );

      return;
    }

    if (
      parsedLatitude < -90 ||
      parsedLatitude > 90
    ) {
      setError(
        "Latitude must be between -90 and 90.",
      );

      return;
    }

    if (
      parsedLongitude < -180 ||
      parsedLongitude > 180
    ) {
      setError(
        "Longitude must be between -180 and 180.",
      );

      return;
    }

    await updateShipment(
      {
        action: "record_location",
        checkpointId:
          activeCheckpoint._id,
        locationName: locationName.trim(),
        latitude: parsedLatitude,
        longitude: parsedLongitude,
      },
      "location",
    );
  }

  async function completeActiveCheckpoint() {
    if (!activeCheckpoint) {
      setError(
        "There is no active checkpoint.",
      );

      return;
    }

    await updateShipment(
      {
        action: "complete_checkpoint",
        checkpointId:
          activeCheckpoint._id,
      },
      "checkpoint",
    );
  }

  async function handleNotification(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !notificationTitle.trim() ||
      !notificationMessage.trim()
    ) {
      setError(
        "Enter a notification title and message.",
      );

      return;
    }

    const updatedShipment =
      await updateShipment(
        {
          action: "add_notification",
          title:
            notificationTitle.trim(),
          message:
            notificationMessage.trim(),
          type: notificationType,
          showAsPopup,
        },
        "notification",
      );

    if (updatedShipment) {
      setNotificationTitle("");
      setNotificationMessage("");

      setNotificationType(
        "information",
      );

      setShowAsPopup(false);
    }
  }

  const completedCheckpointCount =
    shipment.checkpoints.filter(
      (checkpoint) =>
        checkpoint.status === "completed",
    ).length;

  return (
    <main className="min-h-screen bg-[#080808] px-5 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <Link
              href="/admin/shipments"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-[#e6bd4f]"
            >
              <ArrowLeft size={17} />
              All shipments
            </Link>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.22em] text-[#d4a72c]">
              Shipment manager
            </p>

            <h1 className="mt-3 text-3xl font-black text-[#e6bd4f] sm:text-4xl">
              {shipment.trackingNumber}
            </h1>

            <p className="mt-3 text-sm text-white/40">
              {shipment.origin.city},{" "}
              {shipment.origin.country}
              {" → "}
              {shipment.destination.city},{" "}
              {shipment.destination.country}
            </p>
          </div>

          <Link
            href={`/tracking?number=${encodeURIComponent(
              shipment.trackingNumber,
            )}`}
            target="_blank"
            className="flex w-fit items-center gap-2 rounded-full border border-[#d4a72c]/40 px-6 py-3 text-sm font-black text-[#e6bd4f] transition hover:bg-[#d4a72c] hover:text-black"
          >
            View public tracking
            <ExternalLink size={17} />
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-7 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {success && (
          <div className="mt-7 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            {success}
          </div>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-white/10 bg-[#111111] p-6">
            <p className="text-xs uppercase tracking-wider text-white/30">
              Current status
            </p>

            <p className="mt-3 text-xl font-black">
              {formatLabel(
                shipment.status,
              )}
            </p>

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(
                  event.target.value,
                )
              }
              className="mt-5 h-12 w-full rounded-xl border border-white/10 bg-[#181818] px-4 text-sm outline-none focus:border-[#d4a72c]/60"
            >
              {shipmentStatuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {formatLabel(status)}
                  </option>
                ),
              )}
            </select>

            <button
              type="button"
              onClick={handleStatusUpdate}
              disabled={
                loadingAction === "status"
              }
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#d4a72c] text-sm font-black text-black disabled:opacity-50"
            >
              {loadingAction ===
              "status" ? (
                <LoaderCircle
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              Update status
            </button>
          </article>

          <article className="rounded-3xl border border-white/10 bg-[#111111] p-6">
            <p className="text-xs uppercase tracking-wider text-white/30">
              Route progress
            </p>

            <p className="mt-3 text-3xl font-black text-[#e6bd4f]">
              {shipment.progress}%
            </p>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#98700f] to-[#f2cf68] transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      shipment.progress,
                    ),
                  )}%`,
                }}
              />
            </div>

            <p className="mt-4 text-xs leading-5 text-white/35">
              {completedCheckpointCount} of{" "}
              {shipment.checkpoints.length}{" "}
              checkpoints completed.
            </p>
          </article>

          <article className="rounded-3xl border border-white/10 bg-[#111111] p-6">
            <p className="text-xs uppercase tracking-wider text-white/30">
              Current location
            </p>

            <p className="mt-3 font-black">
              {shipment.currentLocation
                ?.name ?? "Not recorded"}
            </p>

            <p className="mt-3 text-xs text-white/35">
              Latitude:{" "}
              {shipment.currentLocation
                ?.latitude ?? "Pending"}
            </p>

            <p className="mt-1 text-xs text-white/35">
              Longitude:{" "}
              {shipment.currentLocation
                ?.longitude ?? "Pending"}
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#d4a72c]">
              <Navigation size={15} />

              {shipment.currentLocation
                ?.source === "automatic"
                ? "Scheduled route position"
                : shipment.currentLocation
                      ?.source === "admin"
                  ? "Admin verified position"
                  : "Operational position"}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#111111] p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ScheduleDetail
              label="Departure"
              value={formatDate(
                shipment.departureDate,
              )}
            />

            <ScheduleDetail
              label="Arrival"
              value={formatDate(
                shipment.arrivalDate ??
                  shipment.estimatedDelivery,
              )}
            />

            <ScheduleDetail
              label="Automatic progress"
              value={
                shipment.autoProgressEnabled ===
                false
                  ? "Disabled"
                  : "Enabled"
              }
            />

            <ScheduleDetail
              label="Last automatic update"
              value={formatDate(
                shipment.lastAutomaticUpdateAt,
              )}
            />
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-white/10 bg-[#111111] p-6 sm:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#d4a72c]">
                Route management
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Shipment checkpoints
              </h2>
            </div>

            {shipment.checkpoints.length ===
            0 ? (
              <p className="mt-8 text-sm text-white/35">
                This shipment has no route
                checkpoints.
              </p>
            ) : (
              <div className="mt-9">
                {shipment.checkpoints.map(
                  (
                    checkpoint,
                    index,
                  ) => {
                    const completed =
                      checkpoint.status ===
                      "completed";

                    const active =
                      checkpoint.status ===
                      "active";

                    return (
                      <div
                        key={checkpoint._id}
                        className="relative flex gap-4 pb-9"
                      >
                        {index !==
                          shipment.checkpoints
                            .length -
                            1 && (
                          <span
                            className={`absolute left-[19px] top-10 h-full w-px ${
                              completed
                                ? "bg-[#d4a72c]"
                                : "bg-white/10"
                            }`}
                          />
                        )}

                        <span
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                            completed
                              ? "border-[#d4a72c] bg-[#d4a72c] text-black"
                              : active
                                ? "border-[#d4a72c] bg-[#d4a72c]/15 text-[#e6bd4f]"
                                : "border-white/15 bg-[#161616] text-white/25"
                          }`}
                        >
                          {completed ? (
                            <Check
                              size={18}
                              strokeWidth={3}
                            />
                          ) : active ? (
                            <Truck
                              size={17}
                            />
                          ) : (
                            <Clock3
                              size={17}
                            />
                          )}
                        </span>

                        <div className="flex-1">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row">
                            <div>
                              <p
                                className={`text-sm font-black ${
                                  active
                                    ? "text-[#e6bd4f]"
                                    : ""
                                }`}
                              >
                                {
                                  checkpoint.location
                                }
                              </p>

                              <p className="mt-1 text-xs text-white/35">
                                {
                                  checkpoint.city
                                }
                                ,{" "}
                                {
                                  checkpoint.country
                                }
                              </p>

                              <p className="mt-2 text-sm text-white/40">
                                {
                                  checkpoint.description
                                }
                              </p>
                            </div>

                            <span className="h-fit w-fit rounded-full bg-white/[0.05] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/45">
                              {
                                checkpoint.status
                              }
                            </span>
                          </div>

                          <p className="mt-3 text-xs text-white/25">
                            {formatCoordinate(
                              checkpoint.latitude,
                            )}
                            ,{" "}
                            {formatCoordinate(
                              checkpoint.longitude,
                            )}
                          </p>

                          <p className="mt-2 text-xs text-white/25">
                            Scheduled:{" "}
                            {formatDate(
                              checkpoint.estimatedArrival,
                            )}
                          </p>

                          {completed &&
                            checkpoint.completedAt && (
                              <p className="mt-2 text-xs text-emerald-300/60">
                                Completed{" "}
                                {formatDate(
                                  checkpoint.completedAt,
                                )}
                              </p>
                            )}

                          {completed &&
                            checkpoint.completionSource && (
                              <p className="mt-1 text-xs text-white/25">
                                {checkpoint.completionSource ===
                                "automatic"
                                  ? "Scheduled automatic update"
                                  : "Verified by administrator"}
                              </p>
                            )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <form
              noValidate
              onSubmit={
                handleLocationUpdate
              }
              className="rounded-3xl border border-white/10 bg-[#111111] p-6"
            >
              <div className="flex items-center gap-3">
                <MapPin className="text-[#d4a72c]" />

                <h2 className="font-black">
                  Active checkpoint
                </h2>
              </div>

              {activeCheckpoint ? (
                <>
                  <p className="mt-4 text-sm font-bold text-[#e6bd4f]">
                    {
                      activeCheckpoint.location
                    }
                  </p>

                  <div className="mt-5 space-y-4">
                    <AdminInput
                      label="Location name"
                      value={locationName}
                      onChange={
                        setLocationName
                      }
                    />

                    <AdminInput
                      label="Latitude"
                      value={latitude}
                      onChange={
                        setLatitude
                      }
                      type="number"
                    />

                    <AdminInput
                      label="Longitude"
                      value={longitude}
                      onChange={
                        setLongitude
                      }
                      type="number"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      loadingAction ===
                      "location"
                    }
                    className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#d4a72c]/40 text-sm font-black text-[#e6bd4f] disabled:opacity-50"
                  >
                    {loadingAction ===
                    "location" ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={17} />
                    )}

                    Save coordinates
                  </button>

                  <button
                    type="button"
                    onClick={
                      completeActiveCheckpoint
                    }
                    disabled={
                      loadingAction ===
                      "checkpoint"
                    }
                    className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d4a72c] text-sm font-black text-black disabled:opacity-50"
                  >
                    {loadingAction ===
                    "checkpoint" ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle2
                        size={18}
                      />
                    )}

                    Complete checkpoint
                  </button>
                </>
              ) : (
                <p className="mt-4 text-sm leading-6 text-white/35">
                  This shipment has no active
                  checkpoint.
                </p>
              )}
            </form>

            <form
              noValidate
              onSubmit={handleNotification}
              className="rounded-3xl border border-white/10 bg-[#111111] p-6"
            >
              <div className="flex items-center gap-3">
                <BellRing className="text-[#d4a72c]" />

                <h2 className="font-black">
                  Customer notification
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <AdminInput
                  label="Notification title"
                  value={notificationTitle}
                  onChange={
                    setNotificationTitle
                  }
                  required
                />

                <div>
                  <label className="mb-2 block text-xs font-bold text-white/50">
                    Message
                  </label>

                  <textarea
                    value={
                      notificationMessage
                    }
                    onChange={(event) =>
                      setNotificationMessage(
                        event.target.value,
                      )
                    }
                    required
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-[#d4a72c]/60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-white/50">
                    Notification type
                  </label>

                  <select
                    value={notificationType}
                    onChange={(event) =>
                      setNotificationType(
                        event.target
                          .value as NotificationType,
                      )
                    }
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#181818] px-4 text-sm outline-none"
                  >
                    <option value="information">
                      Information
                    </option>

                    <option value="success">
                      Success
                    </option>

                    <option value="warning">
                      Warning
                    </option>

                    <option value="critical">
                      Critical
                    </option>
                  </select>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-white/10 p-4">
                  <input
                    type="checkbox"
                    checked={showAsPopup}
                    onChange={(event) =>
                      setShowAsPopup(
                        event.target.checked,
                      )
                    }
                    className="h-4 w-4 accent-[#d4a72c]"
                  />

                  <span className="text-xs font-semibold text-white/60">
                    Display as a popup on the
                    tracking page
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={
                  loadingAction ===
                  "notification"
                }
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d4a72c] text-sm font-black text-black disabled:opacity-50"
              >
                {loadingAction ===
                "notification" ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <BellRing size={17} />
                )}

                Publish notification
              </button>
            </form>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#111111] p-6 sm:p-8">
          <h2 className="text-xl font-black">
            Notification history
          </h2>

          {shipment.notifications.length ===
          0 ? (
            <p className="mt-4 text-sm text-white/35">
              No notifications have been
              published.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {shipment.notifications
                .slice()
                .reverse()
                .map(
                  (notification) => (
                    <article
                      key={
                        notification._id
                      }
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black">
                          {
                            notification.title
                          }
                        </p>

                        <span className="text-[10px] font-black uppercase text-[#d4a72c]">
                          {
                            notification.type
                          }
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-white/40">
                        {
                          notification.message
                        }
                      </p>

                      <div className="mt-4 flex items-center justify-between text-xs text-white/25">
                        <span>
                          {formatDate(
                            notification.createdAt,
                          )}
                        </span>

                        {notification.showAsPopup && (
                          <span className="flex items-center gap-1 text-amber-300">
                            <AlertTriangle
                              size={13}
                            />
                            Popup
                          </span>
                        )}
                      </div>
                    </article>
                  ),
                )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

type ScheduleDetailProps = {
  label: string;
  value: string;
};

function ScheduleDetail({
  label,
  value,
}: ScheduleDetailProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-white/30">
        {label}
      </p>

      <p className="mt-2 text-sm font-black text-white/75">
        {value}
      </p>
    </div>
  );
}

type AdminInputProps = {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  onChange: (value: string) => void;
};

function AdminInput({
  label,
  value,
  type = "text",
  required,
  onChange,
}: AdminInputProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-white/50">
        {label}
      </label>

      <input
        type={type}
        step={
          type === "number"
            ? "any"
            : undefined
        }
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm outline-none focus:border-[#d4a72c]/60"
      />
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(value?: string) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatCoordinate(value: number) {
  if (!Number.isFinite(value)) {
    return "Pending";
  }

  return value.toFixed(4);
}