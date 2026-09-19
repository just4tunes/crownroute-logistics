import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { generateRouteCheckpoints } from "@/lib/route-generator";
import { generateTrackingNumber } from "@/lib/tracking-number";
import { Admin } from "@/models/admin";
import { Shipment } from "@/models/shipment";

export const dynamic = "force-dynamic";

const shipmentSchema = z.object({
  senderName: z.string().trim().min(2).max(100),

  senderEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("")),

  recipientName: z.string().trim().min(2).max(100),

  recipientEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("")),

  originCity: z.string().trim().min(2).max(100),
  originCountry: z.string().trim().min(2).max(100),
  originLatitude: z.number().min(-90).max(90),
  originLongitude: z.number().min(-180).max(180),

  destinationCity: z.string().trim().min(2).max(100),
  destinationCountry: z.string().trim().min(2).max(100),
  destinationLatitude: z.number().min(-90).max(90),
  destinationLongitude: z.number().min(-180).max(180),

  packageDescription: z.string().trim().min(2).max(300),

  weight: z.number().positive().optional(),

  serviceMode: z.enum([
    "parcel",
    "air",
    "ocean",
    "rail",
    "express",
  ]),

  departureDate: z.string().datetime(),
  arrivalDate: z.string().datetime(),

  autoProgressEnabled: z.boolean().optional().default(true),
});

async function authorizeAdmin() {
  const session = await getAdminSession();

  if (!session) {
    return null;
  }

  await connectToDatabase();

  const admin = await Admin.findOne({
    _id: session.adminId,
    isActive: true,
  })
    .select("_id name email role")
    .lean();

  return admin ? session : null;
}

export async function GET() {
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

    const shipments = await Shipment.find({})
      .sort({
        createdAt: -1,
      })
      .select(
        [
          "trackingNumber",
          "recipient",
          "origin",
          "destination",
          "serviceMode",
          "status",
          "progress",
          "departureDate",
          "arrivalDate",
          "estimatedDelivery",
          "autoProgressEnabled",
          "createdAt",
        ].join(" "),
      )
      .lean();

    return NextResponse.json({
      success: true,
      shipments,
    });
  } catch (error) {
    console.error("Admin shipment list error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve shipments.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const result = shipmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Check the shipment information and try again.",
          details: result.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const data = result.data;

    const departureDate = new Date(data.departureDate);
    const arrivalDate = new Date(data.arrivalDate);

    if (arrivalDate.getTime() <= departureDate.getTime()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The arrival date must be later than the departure date.",
        },
        {
          status: 400,
        },
      );
    }

    const origin = {
      city: data.originCity,
      country: data.originCountry,
      latitude: data.originLatitude,
      longitude: data.originLongitude,
    };

    const destination = {
      city: data.destinationCity,
      country: data.destinationCountry,
      latitude: data.destinationLatitude,
      longitude: data.destinationLongitude,
    };

    const checkpoints = generateRouteCheckpoints({
      serviceMode: data.serviceMode,
      origin,
      destination,
      departureDate,
      arrivalDate,
    });

    let trackingNumber = generateTrackingNumber();

    while (
      await Shipment.exists({
        trackingNumber,
      })
    ) {
      trackingNumber = generateTrackingNumber();
    }

    const now = new Date();

    const initialStatus =
      departureDate.getTime() <= now.getTime()
        ? "in_transit"
        : "processing";

    const shipment = await Shipment.create({
      trackingNumber,

      sender: {
        name: data.senderName,
        email: data.senderEmail || undefined,
      },

      recipient: {
        name: data.recipientName,
        email: data.recipientEmail || undefined,
      },

      origin,
      destination,

      packageDescription: data.packageDescription,
      weight: data.weight,
      serviceMode: data.serviceMode,
      status: initialStatus,

      departureDate,
      arrivalDate,

      // Kept so older tracking components that still use
      // estimatedDelivery continue to work.
      estimatedDelivery: arrivalDate,

      progress: 0,
      autoProgressEnabled: data.autoProgressEnabled,

      currentLocation: {
        name: `${origin.city}, ${origin.country}`,
        latitude: origin.latitude,
        longitude: origin.longitude,
        source: "admin",
      },

      checkpoints,

      notifications: [
        {
          title: "Shipment created",
          message:
            "Your shipment has been registered with CrownRoute Logistics.",
          type: "information",
          showAsPopup: false,
          createdAt: now,
        },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Shipment created successfully.",
        shipment: {
          id: shipment._id.toString(),
          trackingNumber: shipment.trackingNumber,
          departureDate: shipment.departureDate,
          arrivalDate: shipment.arrivalDate,
          autoProgressEnabled: shipment.autoProgressEnabled,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create shipment error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create the shipment.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}