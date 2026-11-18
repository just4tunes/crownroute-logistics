import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { applyAutomaticShipmentProgress } from "@/lib/shipment-progress";
import { Shipment } from "@/models/shipment";
import { ShipmentCharge } from "@/models/shipment-charge";

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
        "parcelImage.contentType",
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

    const charges = await ShipmentCharge.find({
      shipmentId: shipment._id,
    })
      .sort({ createdAt: -1 })
      .select(
        "_id category title description amount currency issueStatus paymentStatus createdAt updatedAt",
      )
      .lean();

    const {
      parcelImage,
      ...safeShipment
    } = shipment.toObject();

    return NextResponse.json({
      success: true,
      shipment: {
        ...safeShipment,
        hasParcelImage: Boolean(parcelImage?.contentType),
      },
      charges: charges.map((charge) => ({
        id: charge._id.toString(),
        category: charge.category,
        title: charge.title,
        description: charge.description,
        amount: charge.amount,
        currency: charge.currency,
        issueStatus: charge.issueStatus,
        paymentStatus: charge.paymentStatus,
        createdAt: charge.createdAt,
        updatedAt: charge.updatedAt,
      })),
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