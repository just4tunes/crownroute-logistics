import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { Shipment } from "@/models/shipment";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    trackingNumber: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const { trackingNumber } = await context.params;

    const normalizedTrackingNumber = decodeURIComponent(trackingNumber)
      .trim()
      .toUpperCase();

    if (
      !normalizedTrackingNumber ||
      !/^[A-Z0-9-]{5,40}$/.test(normalizedTrackingNumber)
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
    })
      .select(
        [
          "trackingNumber",
          "recipient.name",
          "origin",
          "destination",
          "packageDescription",
          "weight",
          "serviceMode",
          "status",
          "estimatedDelivery",
          "progress",
          "currentLocation",
          "checkpoints",
          "notifications",
          "createdAt",
          "updatedAt",
        ].join(" "),
      )
      .lean();

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

    return NextResponse.json({
      success: true,
      shipment,
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