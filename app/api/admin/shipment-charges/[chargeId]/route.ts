import { isValidObjectId, Types } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { Shipment } from "@/models/shipment";
import { ShipmentCharge } from "@/models/shipment-charge";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    chargeId: string;
  }>;
};

const updateChargeSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("resolve_issue"),
  }),
  z.object({
    action: z.literal("waive_charge"),
  }),
  z.object({
    action: z.literal("cancel_charge"),
  }),
]);

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

export async function PATCH(
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

    const { chargeId } = await context.params;

    if (!isValidObjectId(chargeId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid charge ID.",
        },
        {
          status: 400,
        },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body.",
        },
        {
          status: 400,
        },
      );
    }

    const result = updateChargeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid shipment charge action.",
          details: result.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const charge = await ShipmentCharge.findById(chargeId);

    if (!charge) {
      return NextResponse.json(
        {
          success: false,
          error: "Shipment charge not found.",
        },
        {
          status: 404,
        },
      );
    }

    const shipment = await Shipment.findById(
      charge.shipmentId,
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

    const action = result.data.action;
    const now = new Date();
    let notificationTitle: string;
    let notificationMessage: string;
    let notificationType: "information" | "success";

    if (action === "resolve_issue") {
      charge.issueStatus = "resolved";
      charge.resolvedAt = now;
      charge.resolvedBy = new Types.ObjectId(session.adminId);
      notificationTitle = "Shipment issue resolved";
      notificationMessage = `The shipment issue "${charge.title}" has been resolved.`;
      notificationType = "information";
    } else if (action === "waive_charge") {
      if (charge.paymentStatus === "paid") {
        return NextResponse.json(
          {
            success: false,
            error: "A paid charge cannot be waived.",
          },
          {
            status: 409,
          },
        );
      }

      charge.paymentStatus = "waived";
      charge.issueStatus = "resolved";
      charge.resolvedAt = now;
      charge.resolvedBy = new Types.ObjectId(session.adminId);
      notificationTitle = "Shipment fee waived";
      notificationMessage = `The fee for "${charge.title}" was waived and the issue has been resolved.`;
      notificationType = "success";
    } else {
      if (charge.paymentStatus === "paid") {
        return NextResponse.json(
          {
            success: false,
            error: "A paid charge cannot be cancelled.",
          },
          {
            status: 409,
          },
        );
      }

      charge.issueStatus = "cancelled";
      notificationTitle = "Shipment issue cancelled";
      notificationMessage = `The shipment issue "${charge.title}" has been cancelled.`;
      notificationType = "information";
    }

    shipment.notifications.push({
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      showAsPopup: false,
      createdAt: now,
    });
    shipment.markModified("notifications");

    await Promise.all([
      charge.save(),
      shipment.save({ timestamps: false }),
    ]);

    return NextResponse.json({
      success: true,
      message: notificationMessage,
      charge: {
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
      },
    });
  } catch (error) {
    console.error("Admin shipment charge update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update the shipment charge.",
      },
      {
        status: 500,
      },
    );
  }
}
