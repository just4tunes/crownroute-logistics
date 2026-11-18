import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { isParcelImageContentType } from "@/lib/parcel-image";
import { Shipment } from "@/models/shipment";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    trackingNumber: string;
  }>;
};

function normalizeTrackingNumber(value: string) {
  let decodedTrackingNumber: string;

  try {
    decodedTrackingNumber = decodeURIComponent(value);
  } catch {
    return null;
  }

  const normalizedTrackingNumber =
    decodedTrackingNumber.trim().toUpperCase();

  return /^[A-Z0-9-]{5,40}$/.test(
    normalizedTrackingNumber,
  )
    ? normalizedTrackingNumber
    : null;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { trackingNumber } = await context.params;
    const normalizedTrackingNumber =
      normalizeTrackingNumber(trackingNumber);

    if (!normalizedTrackingNumber) {
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
      "+parcelImage.data parcelImage.contentType parcelImage.fileName",
    );

    const image = shipment?.parcelImage;

    if (
      !image ||
      !Buffer.isBuffer(image.data) ||
      !isParcelImageContentType(image.contentType)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Parcel photograph not found.",
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    }

    const fileName =
      image.fileName
        .replace(/[^A-Za-z0-9._-]/g, "_")
        .slice(0, 128) || "parcel-image";

    return new Response(new Uint8Array(image.data), {
      headers: {
        "Content-Type": image.contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Parcel image API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve the parcel photograph.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  }
}
