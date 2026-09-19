import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { applyAutomaticShipmentProgress } from "@/lib/shipment-progress";
import { Shipment } from "@/models/shipment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET is not configured.");

      return NextResponse.json(
        {
          success: false,
          error: "Cron service is not configured.",
        },
        {
          status: 500,
        },
      );
    }

    const authorization =
      request.headers.get("authorization");

    if (
      authorization !== `Bearer ${cronSecret}`
    ) {
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

    await connectToDatabase();

    const shipments = await Shipment.find({
      autoProgressEnabled: true,

      departureDate: {
        $exists: true,
        $ne: null,
      },

      arrivalDate: {
        $exists: true,
        $ne: null,
      },

      status: {
        $nin: [
          "delivered",
          "cancelled",
          "held",
          "delayed",
        ],
      },
    }).limit(1000);

    let updatedShipments = 0;
    let failedShipments = 0;

    const currentTime = new Date();

    for (const shipment of shipments) {
      try {
        const changed =
          applyAutomaticShipmentProgress(
            shipment,
            currentTime,
          );

        if (changed) {
          await shipment.save();
          updatedShipments += 1;
        }
      } catch (shipmentError) {
        failedShipments += 1;

        console.error(
          `Automatic update failed for ${shipment.trackingNumber}:`,
          shipmentError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Automatic shipment check completed.",
      checkedShipments: shipments.length,
      updatedShipments,
      failedShipments,
      checkedAt: currentTime.toISOString(),
    });
  } catch (error) {
    console.error(
      "Automatic shipment cron error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to run the automatic shipment check.",
      },
      {
        status: 500,
      },
    );
  }
}