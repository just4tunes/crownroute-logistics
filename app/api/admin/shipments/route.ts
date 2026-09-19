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

  weight: z
    .number()
    .positive()
    .optional(),

  serviceMode: z.enum([
    "parcel",
    "air",
    "ocean",
    "rail",
    "express",
  ]),

  estimatedDelivery: z.string().datetime(),
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
        "trackingNumber recipient origin destination serviceMode status progress estimatedDelivery createdAt",
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
    const estimatedDelivery = new Date(data.estimatedDelivery);

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
      estimatedDelivery,
    });

    let trackingNumber = generateTrackingNumber();

    while (
      await Shipment.exists({
        trackingNumber,
      })
    ) {
      trackingNumber = generateTrackingNumber();
    }

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
      status: "processing",
      estimatedDelivery,
      progress: 0,

      currentLocation: {
        name: `${origin.city}, ${origin.country}`,
        latitude: origin.latitude,
        longitude: origin.longitude,
      },

      checkpoints,

      notifications: [
        {
          title: "Shipment created",
          message:
            "Your shipment has been registered with CrownRoute Logistics.",
          type: "information",
          showAsPopup: false,
          createdAt: new Date(),
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
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create shipment error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create the shipment.",
      },
      {
        status: 500,
      },
    );
  }
}