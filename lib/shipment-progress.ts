import type {
  IShipment,
  ShipmentCheckpoint,
  ShipmentStatus,
} from "@/models/shipment";

const pausedStatuses: ShipmentStatus[] = [
  "held",
  "delayed",
  "cancelled",
];

function getStatusFromCheckpoint(
  checkpoint: ShipmentCheckpoint | undefined,
): ShipmentStatus {
  if (!checkpoint) {
    return "in_transit";
  }

  const checkpointName =
    `${checkpoint.location} ${checkpoint.description}`.toLowerCase();

  if (checkpointName.includes("customs")) {
    return "customs";
  }

  if (checkpointName.includes("out for delivery")) {
    return "out_for_delivery";
  }

  if (checkpointName.includes("final delivery")) {
    return "delivered";
  }

  return "in_transit";
}

export function applyAutomaticShipmentProgress(
  shipment: IShipment,
  currentTime = new Date(),
): boolean {
  if (!shipment.autoProgressEnabled) {
    return false;
  }

  if (pausedStatuses.includes(shipment.status)) {
    return false;
  }

  if (
    !shipment.departureDate ||
    !shipment.arrivalDate ||
    !shipment.checkpoints.length
  ) {
    return false;
  }

  const now = currentTime.getTime();
  const departureTime = new Date(
    shipment.departureDate,
  ).getTime();

  const arrivalTime = new Date(
    shipment.arrivalDate,
  ).getTime();

  if (
    Number.isNaN(departureTime) ||
    Number.isNaN(arrivalTime)
  ) {
    return false;
  }

  let changed = false;
  let automaticallyCompletedCheckpoint:
    | ShipmentCheckpoint
    | undefined;

  if (now < departureTime) {
    if (
      shipment.status === "created" ||
      shipment.status === "in_transit"
    ) {
      shipment.status = "processing";
      changed = true;
    }

    return changed;
  }

  for (const checkpoint of shipment.checkpoints) {
    if (!checkpoint.estimatedArrival) {
      continue;
    }

    const checkpointTime = new Date(
      checkpoint.estimatedArrival,
    ).getTime();

    if (
      !Number.isNaN(checkpointTime) &&
      checkpointTime <= now &&
      checkpoint.status !== "completed"
    ) {
      checkpoint.status = "completed";
      checkpoint.completedAt = currentTime;
      checkpoint.completionSource = "automatic";

      automaticallyCompletedCheckpoint = checkpoint;
      changed = true;
    }
  }

  const completedCheckpoints =
    shipment.checkpoints.filter(
      (checkpoint) => checkpoint.status === "completed",
    );

  const nextCheckpoint = shipment.checkpoints.find(
    (checkpoint) => checkpoint.status !== "completed",
  );

  for (const checkpoint of shipment.checkpoints) {
    if (checkpoint.status === "completed") {
      continue;
    }

    const nextStatus =
      checkpoint === nextCheckpoint ? "active" : "pending";

    if (checkpoint.status !== nextStatus) {
      checkpoint.status = nextStatus;
      changed = true;
    }
  }

  const newProgress = Math.min(
    100,
    Math.round(
      (completedCheckpoints.length /
        shipment.checkpoints.length) *
        100,
    ),
  );

  if (shipment.progress !== newProgress) {
    shipment.progress = newProgress;
    changed = true;
  }

  if (automaticallyCompletedCheckpoint) {
    shipment.currentLocation = {
      name: `${automaticallyCompletedCheckpoint.location}, ${automaticallyCompletedCheckpoint.city}, ${automaticallyCompletedCheckpoint.country}`,
      latitude:
        automaticallyCompletedCheckpoint.latitude,
      longitude:
        automaticallyCompletedCheckpoint.longitude,
      source: "automatic",
    };
  }

  if (
    completedCheckpoints.length ===
      shipment.checkpoints.length ||
    now >= arrivalTime
  ) {
    if (shipment.status !== "delivered") {
      shipment.status = "delivered";
      changed = true;
    }

    if (shipment.progress !== 100) {
      shipment.progress = 100;
      changed = true;
    }
  } else {
    const latestCompletedCheckpoint =
      completedCheckpoints[
        completedCheckpoints.length - 1
      ];

    const automaticStatus = getStatusFromCheckpoint(
      latestCompletedCheckpoint ?? nextCheckpoint,
    );

    if (shipment.status !== automaticStatus) {
      shipment.status = automaticStatus;
      changed = true;
    }
  }

  if (changed) {
    shipment.lastAutomaticUpdateAt = currentTime;
  }

  return changed;
}