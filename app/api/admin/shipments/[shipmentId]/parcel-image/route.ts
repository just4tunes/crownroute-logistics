import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import {
  isParcelImageContentType,
  matchesParcelImageSignature,
  MAX_PARCEL_IMAGE_SIZE,
} from "@/lib/parcel-image";
import { Admin } from "@/models/admin";
import { Shipment } from "@/models/shipment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    shipmentId: string;
  }>;
};

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

export async function PUT(
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

    const contentType = request.headers
      .get("content-type")
      ?.split(";")[0]
      .trim()
      .toLowerCase();

    if (contentType !== "multipart/form-data") {
      return NextResponse.json(
        {
          success: false,
          error: "Upload the parcel photograph as form data.",
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
          error: "The parcel photograph form data is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    const imageEntries = formData.getAll("parcelImage");

    if (
      imageEntries.length !== 1 ||
      !(imageEntries[0] instanceof File)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Select one parcel photograph to upload.",
        },
        {
          status: 400,
        },
      );
    }

    const imageFile = imageEntries[0];

    if (
      imageFile.size === 0 ||
      imageFile.size > MAX_PARCEL_IMAGE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "The parcel photograph must be no larger than 3 MB.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isParcelImageContentType(imageFile.type)) {
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
      await imageFile.arrayBuffer(),
    );

    if (
      !matchesParcelImageSignature(
        imageBuffer,
        imageFile.type,
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

    const uploadedAt = new Date();
    const fileName =
      imageFile.name.replace(/[\r\n"]/g, "_") ||
      "parcel-image";

    shipment.parcelImage = {
      data: imageBuffer,
      contentType: imageFile.type,
      fileName,
      size: imageFile.size,
      uploadedAt,
    };

    await shipment.save();

    return NextResponse.json({
      success: true,
      message: "Parcel photograph uploaded successfully.",
      hasParcelImage: true,
      contentType: imageFile.type,
      fileName,
      size: imageFile.size,
      uploadedAt,
    });
  } catch (error) {
    console.error("Admin parcel image upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to upload the parcel photograph.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
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

    shipment.parcelImage = undefined;
    await shipment.save();

    return NextResponse.json({
      success: true,
      message: "Parcel photograph removed successfully.",
      hasParcelImage: false,
    });
  } catch (error) {
    console.error("Admin parcel image removal error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to remove the parcel photograph.",
      },
      {
        status: 500,
      },
    );
  }
}
