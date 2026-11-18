import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { generateRouteCheckpoints } from "@/lib/route-generator";
import { generateTrackingNumber } from "@/lib/tracking-number";
import {
  isParcelImageContentType,
  matchesParcelImageSignature,
  MAX_PARCEL_IMAGE_SIZE,
  type ParcelImageContentType,
} from "@/lib/parcel-image";
import { Admin } from "@/models/admin";
import { Shipment } from "@/models/shipment";

export const dynamic = "force-dynamic";

function coordinateNumber(min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1)
    .transform(Number)
    .pipe(z.number().finite().min(min).max(max));
}

const optionalWeight = z.preprocess(
  (value) =>
    typeof value === "string" && !value.trim()
      ? undefined
      : value,
  z
    .string()
    .trim()
    .min(1)
    .transform(Number)
    .pipe(z.number().finite().positive())
    .optional(),
);

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
  originLatitude: coordinateNumber(-90, 90),
  originLongitude: coordinateNumber(-180, 180),

  destinationCity: z.string().trim().min(2).max(100),
  destinationCountry: z.string().trim().min(2).max(100),
  destinationLatitude: coordinateNumber(-90, 90),
  destinationLongitude: coordinateNumber(-180, 180),

  packageDescription: z.string().trim().min(2).max(300),

  weight: optionalWeight,

  serviceMode: z.enum([
    "parcel",
    "air",
    "ocean",
    "rail",
    "express",
  ]),

  departureDate: z.string().datetime(),
  arrivalDate: z.string().datetime(),

  autoProgressEnabled: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

function getFormText(
  formData: FormData,
  fieldName: string,
) {
  const values = formData.getAll(fieldName);

  if (values.length > 1) {
    return values;
  }

  return values[0];
}

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

    const requestContentType = request.headers
      .get("content-type")
      ?.split(";")[0]
      .trim()
      .toLowerCase();

    if (requestContentType !== "multipart/form-data") {
      return NextResponse.json(
        {
          success: false,
          error: "Shipment details must be sent as multipart form data.",
        },
        {
          status: 400,
        },
      );
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "The shipment form data could not be read.",
        },
        {
          status: 400,
        },
      );
    }

    const result = shipmentSchema.safeParse({
      senderName: getFormText(formData, "senderName"),
      senderEmail: getFormText(formData, "senderEmail"),
      recipientName: getFormText(formData, "recipientName"),
      recipientEmail: getFormText(formData, "recipientEmail"),
      originCity: getFormText(formData, "originCity"),
      originCountry: getFormText(formData, "originCountry"),
      originLatitude: getFormText(formData, "originLatitude"),
      originLongitude: getFormText(formData, "originLongitude"),
      destinationCity: getFormText(formData, "destinationCity"),
      destinationCountry: getFormText(formData, "destinationCountry"),
      destinationLatitude: getFormText(formData, "destinationLatitude"),
      destinationLongitude: getFormText(formData, "destinationLongitude"),
      packageDescription: getFormText(
        formData,
        "packageDescription",
      ),
      weight: getFormText(formData, "weight"),
      serviceMode: getFormText(formData, "serviceMode"),
      departureDate: getFormText(formData, "departureDate"),
      arrivalDate: getFormText(formData, "arrivalDate"),
      autoProgressEnabled: getFormText(
        formData,
        "autoProgressEnabled",
      ),
    });

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
    const imageEntries = formData.getAll("parcelImage");

    if (imageEntries.length > 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Only one parcel photograph can be uploaded.",
        },
        {
          status: 400,
        },
      );
    }

    const imageEntry = imageEntries[0] ?? null;
    let parcelImage:
      | {
          data: Buffer;
          contentType: ParcelImageContentType;
          fileName: string;
          size: number;
          uploadedAt: Date;
        }
      | undefined;

    if (imageEntry !== null) {
      if (!(imageEntry instanceof File)) {
        return NextResponse.json(
          {
            success: false,
            error: "The parcel photograph is invalid.",
          },
          {
            status: 400,
          },
        );
      }

      if (imageEntry.size > MAX_PARCEL_IMAGE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: "The parcel photograph must be 3 MB or smaller.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        imageEntry.size === 0 ||
        !isParcelImageContentType(imageEntry.type)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The parcel photograph must be a JPEG, PNG or WebP image.",
          },
          {
            status: 400,
          },
        );
      }

      const imageBuffer = Buffer.from(
        await imageEntry.arrayBuffer(),
      );

      if (
        !matchesParcelImageSignature(
          imageBuffer,
          imageEntry.type,
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The parcel photograph contents do not match its image format.",
          },
          {
            status: 400,
          },
        );
      }

      parcelImage = {
        data: imageBuffer,
        contentType: imageEntry.type,
        fileName: imageEntry.name || "parcel-image",
        size: imageEntry.size,
        uploadedAt: new Date(),
      };
    }

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
      parcelImage,

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