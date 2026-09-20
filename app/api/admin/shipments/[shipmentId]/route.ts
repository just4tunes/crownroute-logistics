import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import {
  Shipment,
  type IShipment,
  type ShipmentCheckpoint,
  type ShipmentStatus,
} from "@/models/shipment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    shipmentId: string;
  }>;
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
] as const;

const updateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update_status"),
    status: z.enum(shipmentStatuses),
  }),

  z.object({
    action: z.literal("complete_checkpoint"),
    checkpointId: z.string().min(1),
  }),

  z.object({
    action: z.literal("record_location"),
    checkpointId: z.string().min(1),
    locationName: z
      .string()
      .trim()
      .min(2)
      .max(150),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),

  z.object({
    action: z.literal("add_notification"),
    title: z
      .string()
      .trim()
      .min(2)
      .max(120),
    message: z
      .string()
      .trim()
      .min(2)
      .max(500),
    type: z.enum([
      "information",
      "success",
      "warning",
      "critical",
    ]),
    showAsPopup: z.boolean(),
  }),
]);

type CheckpointWithId = ShipmentCheckpoint & {
  _id?: {
    toString(): string;
  };
};

function getCheckpointId(
  checkpoint: ShipmentCheckpoint,
) {
  return (
    checkpoint as CheckpointWithId
  )._id?.toString();
}

function isPausedStatus(
  status: ShipmentStatus,
) {
  return status === "held" || status === "delayed";
}

function isTerminalStatus(
  status: ShipmentStatus,
) {
  return (
    status === "delivered" ||
    status === "cancelled"
  );
}

function shiftDate(
  value: Date | undefined,
  durationMs: number,
) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Date(date.getTime() + durationMs);
}

function resumeShipmentSchedule(
  shipment: IShipment,
  currentTime: Date,
) {
  const currentTimeMs = currentTime.getTime();

  const possiblePauseTimes = [
    shipment.lastAutomaticUpdateAt,
    shipment.updatedAt,
  ]
    .filter(Boolean)
    .map((value) => new Date(value as Date).getTime())
    .filter(
      (value) =>
        !Number.isNaN(value) &&
        value <= currentTimeMs,
    );

  const pauseStartedAt =
    possiblePauseTimes.length > 0
      ? Math.max(...possiblePauseTimes)
      : currentTimeMs;

  const pausedDurationMs = Math.max(
    0,
    currentTimeMs - pauseStartedAt,
  );

  if (pausedDurationMs > 0) {
    const shiftedArrivalDate = shiftDate(
      shipment.arrivalDate,
      pausedDurationMs,
    );

    if (shiftedArrivalDate) {
      shipment.arrivalDate =
        shiftedArrivalDate;
    }

    const shiftedEstimatedDelivery =
      shiftDate(
        shipment.estimatedDelivery,
        pausedDurationMs,
      );

    if (shiftedEstimatedDelivery) {
      shipment.estimatedDelivery =
        shiftedEstimatedDelivery;
    }

    shipment.checkpoints.forEach(
      (checkpoint) => {
        if (
          checkpoint.status === "completed" ||
          !checkpoint.estimatedArrival
        ) {
          return;
        }

        const shiftedCheckpointDate =
          shiftDate(
            checkpoint.estimatedArrival,
            pausedDurationMs,
          );

        if (shiftedCheckpointDate) {
          checkpoint.estimatedArrival =
            shiftedCheckpointDate;
        }
      },
    );

    shipment.markModified("checkpoints");
  }

  shipment.lastAutomaticUpdateAt =
    currentTime;

  return pausedDurationMs;
}

function formatPausedDuration(
  durationMs: number,
) {
  const totalMinutes = Math.max(
    1,
    Math.round(durationMs / 60000),
  );

  if (totalMinutes < 60) {
    return `${totalMinutes} minute${
      totalMinutes === 1 ? "" : "s"
    }`;
  }

  const totalHours = Math.round(
    totalMinutes / 60,
  );

  if (totalHours < 24) {
    return `${totalHours} hour${
      totalHours === 1 ? "" : "s"
    }`;
  }

  const totalDays = Math.round(
    totalHours / 24,
  );

  return `${totalDays} day${
    totalDays === 1 ? "" : "s"
  }`;
}

function addResumeNotification(
  shipment: IShipment,
  currentTime: Date,
  pausedDurationMs: number,
) {
  shipment.notifications.push({
    title: "Shipment resumed",
    message:
      pausedDurationMs > 0
        ? `Your shipment has resumed its route. The remaining schedule has been adjusted by ${formatPausedDuration(
            pausedDurationMs,
          )}.`
        : "Your shipment has resumed its route and automatic tracking will continue.",
    type: "information",
    showAsPopup: true,
    createdAt: currentTime,
  });

  shipment.markModified("notifications");
}

async function authorizeAdmin() {
  const session = await getAdminSession();

  if (!session) {
    return null;
  }

  await connectToDatabase();

  const admin = await Admin.exists({
    _id: session.adminId,
    isActive: true,
  });

  return admin ? session : null;
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await authorizeAdmin();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const { shipmentId } =
      await context.params;

    if (!isValidObjectId(shipmentId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid shipment ID.",
        },
        {
          status: 400,
        },
      );
    }

    const body = await request.json();
    const result =
      updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid shipment update.",
          details: result.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const shipment =
      await Shipment.findById(shipmentId);

    if (!shipment) {
      return NextResponse.json(
        {
          success: false,
          error: "Shipment not found.",
        },
        {
          status: 404,
        },
      );
    }

    const update = result.data;
    const currentTime = new Date();

    if (update.action === "update_status") {
      const previousStatus =
        shipment.status;

      const wasPaused =
        isPausedStatus(previousStatus);

      const willBePaused =
        isPausedStatus(update.status);

      const willBeTerminal =
        isTerminalStatus(update.status);

      if (!wasPaused && willBePaused) {
        // Store the exact time at which automatic
        // progress was paused.
        shipment.lastAutomaticUpdateAt =
          currentTime;
      }

      if (
        wasPaused &&
        !willBePaused &&
        !willBeTerminal
      ) {
        const pausedDurationMs =
          resumeShipmentSchedule(
            shipment,
            currentTime,
          );

        addResumeNotification(
          shipment,
          currentTime,
          pausedDurationMs,
        );
      }

      shipment.status = update.status;

      if (update.status === "delivered") {
        shipment.progress = 100;
        shipment.lastAutomaticUpdateAt =
          currentTime;

        shipment.checkpoints.forEach(
          (checkpoint) => {
            const wasAlreadyCompleted =
              checkpoint.status === "completed";

            checkpoint.status = "completed";

            if (!checkpoint.completedAt) {
              checkpoint.completedAt =
                currentTime;
            }

            if (
              !wasAlreadyCompleted ||
              !checkpoint.completionSource
            ) {
              checkpoint.completionSource =
                "admin";
            }
          },
        );

        const finalCheckpoint =
          shipment.checkpoints[
            shipment.checkpoints.length - 1
          ];

        if (finalCheckpoint) {
          shipment.currentLocation = {
            name: finalCheckpoint.location,
            latitude:
              finalCheckpoint.latitude,
            longitude:
              finalCheckpoint.longitude,
            source: "admin",
          };
        }

        if (
          previousStatus !== "delivered"
        ) {
          shipment.notifications.push({
            title: "Shipment delivered",
            message:
              "Your shipment has been successfully delivered.",
            type: "success",
            showAsPopup: true,
            createdAt: currentTime,
          });
        }

        shipment.markModified("checkpoints");
        shipment.markModified(
          "currentLocation",
        );
        shipment.markModified(
          "notifications",
        );
      }

      if (
        update.status === "held" &&
        previousStatus !== "held"
      ) {
        shipment.notifications.push({
          title: "Shipment held",
          message:
            "Your shipment has been temporarily held. Automatic route progress has been paused until the hold is removed.",
          type: "warning",
          showAsPopup: true,
          createdAt: currentTime,
        });

        shipment.markModified(
          "notifications",
        );
      }

      if (
        update.status === "delayed" &&
        previousStatus !== "delayed"
      ) {
        shipment.notifications.push({
          title: "Shipment delayed",
          message:
            "Your shipment has experienced a delay. Its remaining checkpoint and delivery dates will be adjusted when the shipment resumes.",
          type: "warning",
          showAsPopup: true,
          createdAt: currentTime,
        });

        shipment.markModified(
          "notifications",
        );
      }

      if (
        update.status === "cancelled" &&
        previousStatus !== "cancelled"
      ) {
        shipment.lastAutomaticUpdateAt =
          currentTime;

        shipment.notifications.push({
          title: "Shipment cancelled",
          message:
            "This shipment has been cancelled.",
          type: "critical",
          showAsPopup: true,
          createdAt: currentTime,
        });

        shipment.markModified(
          "notifications",
        );
      }
    }

    if (update.action === "record_location") {
      const selectedCheckpoint =
        shipment.checkpoints.find(
          (checkpoint) =>
            getCheckpointId(checkpoint) ===
            update.checkpointId,
        );

      if (!selectedCheckpoint) {
        return NextResponse.json(
          {
            success: false,
            error: "Checkpoint not found.",
          },
          {
            status: 404,
          },
        );
      }

      selectedCheckpoint.location =
        update.locationName;
      selectedCheckpoint.latitude =
        update.latitude;
      selectedCheckpoint.longitude =
        update.longitude;

      shipment.currentLocation = {
        name: update.locationName,
        latitude: update.latitude,
        longitude: update.longitude,
        source: "admin",
      };

      shipment.markModified("checkpoints");
      shipment.markModified(
        "currentLocation",
      );
    }

    if (
      update.action ===
      "complete_checkpoint"
    ) {
      const selectedIndex =
        shipment.checkpoints.findIndex(
          (checkpoint) =>
            getCheckpointId(checkpoint) ===
            update.checkpointId,
        );

      if (selectedIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            error: "Checkpoint not found.",
          },
          {
            status: 404,
          },
        );
      }

      const selectedCheckpoint =
        shipment.checkpoints[selectedIndex];

      if (
        selectedCheckpoint.status !==
        "active"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only the currently active checkpoint can be completed.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        isPausedStatus(shipment.status)
      ) {
        const pausedDurationMs =
          resumeShipmentSchedule(
            shipment,
            currentTime,
          );

        addResumeNotification(
          shipment,
          currentTime,
          pausedDurationMs,
        );
      }

      selectedCheckpoint.status =
        "completed";
      selectedCheckpoint.completedAt =
        currentTime;
      selectedCheckpoint.completionSource =
        "admin";

      shipment.currentLocation = {
        name: selectedCheckpoint.location,
        latitude:
          selectedCheckpoint.latitude,
        longitude:
          selectedCheckpoint.longitude,
        source: "admin",
      };

      const nextCheckpoint =
        shipment.checkpoints[
          selectedIndex + 1
        ];

      if (nextCheckpoint) {
        nextCheckpoint.status = "active";
        shipment.status = "in_transit";
      } else {
        shipment.status = "delivered";
      }

      const completedCount =
        shipment.checkpoints.filter(
          (checkpoint) =>
            checkpoint.status ===
            "completed",
        ).length;

      shipment.progress = Math.min(
        100,
        Math.round(
          (completedCount /
            shipment.checkpoints.length) *
            100,
        ),
      );

      if (!nextCheckpoint) {
        shipment.progress = 100;
      }

      shipment.notifications.push({
        title: nextCheckpoint
          ? "Shipment checkpoint completed"
          : "Shipment delivered",

        message: nextCheckpoint
          ? `Your shipment has completed ${selectedCheckpoint.location} and is progressing toward ${nextCheckpoint.location}.`
          : "Your shipment has completed its route and has been delivered.",

        type: nextCheckpoint
          ? "information"
          : "success",

        showAsPopup: !nextCheckpoint,
        createdAt: currentTime,
      });

      shipment.markModified("checkpoints");
      shipment.markModified(
        "currentLocation",
      );
      shipment.markModified(
        "notifications",
      );
    }

    if (
      update.action ===
      "add_notification"
    ) {
      shipment.notifications.push({
        title: update.title,
        message: update.message,
        type: update.type,
        showAsPopup:
          update.showAsPopup,
        createdAt: currentTime,
      });

      shipment.markModified(
        "notifications",
      );
    }

    await shipment.save();

    return NextResponse.json({
      success: true,
      message:
        "Shipment updated successfully.",
      shipment: shipment.toObject(),
    });
  } catch (error) {
    console.error(
      "Update shipment error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update the shipment.",
      },
      {
        status: 500,
      },
    );
  }
}