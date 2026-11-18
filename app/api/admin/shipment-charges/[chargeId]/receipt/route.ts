import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { ShipmentCharge } from "@/models/shipment-charge";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    chargeId: string;
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

export async function GET(
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
        { status: 401 },
      );
    }

    const { chargeId } = await context.params;

    if (!isValidObjectId(chargeId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid charge ID.",
        },
        { status: 400 },
      );
    }

    const charge = await ShipmentCharge.findById(chargeId)
      .select(
        "+paymentReceipt.data paymentReceipt.contentType paymentReceipt.fileName",
      )
      .lean();

    if (
      !charge?.paymentReceipt?.data ||
      !charge.paymentReceipt.contentType ||
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(charge.paymentReceipt.contentType)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment receipt not found.",
        },
        { status: 404 },
      );
    }

    const fileName =
      charge.paymentReceipt.fileName
        ?.replace(/[^A-Za-z0-9._-]/g, "_")
        .slice(0, 180) || "payment-receipt";

    return new Response(
      new Uint8Array(charge.paymentReceipt.data),
      {
        headers: {
          "Content-Type": charge.paymentReceipt.contentType,
          "Content-Disposition": `inline; filename="${fileName}"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    console.error("Admin payment receipt retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve the payment receipt.",
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
