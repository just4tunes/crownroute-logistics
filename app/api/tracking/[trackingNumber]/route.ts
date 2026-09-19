import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { applyAutomaticShipmentProgress } from "@/lib/shipment-progress";
import { Shipment } from "@/models/shipment";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    trackingNumber: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { trackingNumber } = await context.params;

    const normalizedTrackingNumber = decodeURIComponent(
      trackingNumber,
    )
      .trim()
      .toUpperCase();

    if (
      !normalizedTrackingNumber ||
      !/^[A-Z0-9-]{5,40}$/.test(
        normalizedTrackingNumber,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid tracking number.",
        },
        {
          status: 400,
        },
      );
    }

    await connectToDatabase();

    const shipment = await Shipment.findOne({
      trackingNumber: normalizedTrackingNumber,
    }).select(
      [
        "trackingNumber",
        "recipient.name",
        "origin",
        "destination",
        "packageDescription",
        "weight",
        "serviceMode",
        "status",
        "departureDate",
        "arrivalDate",
        "estimatedDelivery",
        "progress",
        "autoProgressEnabled",
        "lastAutomaticUpdateAt",
        "currentLocation",
        "checkpoints",
        "notifications",
        "createdAt",
        "updatedAt",
      ].join(" "),
    );

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

    const shipmentWasUpdated =
      applyAutomaticShipmentProgress(shipment);

    if (shipmentWasUpdated) {
      await shipment.save();
    }

    return NextResponse.json({
      success: true,
      shipment: shipment.toObject(),
    });
  } catch (error) {
    console.error("Tracking API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve shipment information.",
      },
      {
        status: 500,
      },
    );
  }
}