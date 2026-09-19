import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import {
  Shipment,
  type ShipmentCheckpoint,
} from "@/models/shipment";

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
    locationName: z.string().trim().min(2).max(150),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),

  z.object({
    action: z.literal("add_notification"),
    title: z.string().trim().min(2).max(120),
    message: z.string().trim().min(2).max(500),
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

function checkpointId(checkpoint: ShipmentCheckpoint) {
  return (
    checkpoint as CheckpointWithId
  )._id?.toString();
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

    const { shipmentId } = await context.params;

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
    const result = updateSchema.safeParse(body);

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

    const shipment = await Shipment.findById(shipmentId);

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

    if (update.action === "update_status") {
      shipment.status = update.status;

      if (update.status === "delivered") {
        shipment.progress = 100;

        shipment.checkpoints.forEach((checkpoint) => {
          checkpoint.status = "completed";

          if (!checkpoint.completedAt) {
            checkpoint.completedAt = new Date();
          }
        });

        shipment.notifications.push({
          title: "Shipment delivered",
          message:
            "Your shipment has been successfully delivered.",
          type: "success",
          showAsPopup: true,
          createdAt: new Date(),
        });

        shipment.markModified("checkpoints");
        shipment.markModified("notifications");
      }
    }

    if (update.action === "record_location") {
      const selectedCheckpoint =
        shipment.checkpoints.find(
          (checkpoint) =>
            checkpointId(checkpoint) ===
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
      };

      shipment.markModified("checkpoints");
      shipment.markModified("currentLocation");
    }

    if (update.action === "complete_checkpoint") {
      const selectedIndex =
        shipment.checkpoints.findIndex(
          (checkpoint) =>
            checkpointId(checkpoint) ===
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

      if (selectedCheckpoint.status !== "active") {
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

      selectedCheckpoint.status = "completed";
      selectedCheckpoint.completedAt = new Date();

      shipment.currentLocation = {
        name: selectedCheckpoint.location,
        latitude: selectedCheckpoint.latitude,
        longitude: selectedCheckpoint.longitude,
      };

      const nextCheckpoint =
        shipment.checkpoints[selectedIndex + 1];

      if (nextCheckpoint) {
        nextCheckpoint.status = "active";

        if (
          shipment.status === "created" ||
          shipment.status === "processing"
        ) {
          shipment.status = "in_transit";
        }
      } else {
        shipment.status = "delivered";
      }

      const completedCount =
        shipment.checkpoints.filter(
          (checkpoint) =>
            checkpoint.status === "completed",
        ).length;

      shipment.progress = Math.round(
        (completedCount /
          shipment.checkpoints.length) *
          100,
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
        createdAt: new Date(),
      });

      shipment.markModified("checkpoints");
      shipment.markModified("currentLocation");
      shipment.markModified("notifications");
    }

    if (update.action === "add_notification") {
      shipment.notifications.push({
        title: update.title,
        message: update.message,
        type: update.type,
        showAsPopup: update.showAsPopup,
        createdAt: new Date(),
      });

      shipment.markModified("notifications");
    }

    await shipment.save();

    return NextResponse.json({
      success: true,
      message: "Shipment updated successfully.",
      shipment,
    });
  } catch (error) {
    console.error("Update shipment error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update the shipment.",
      },
      {
        status: 500,
      },
    );
  }
}