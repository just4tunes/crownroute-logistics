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
    action: z.literal("assign_payment_details"),
    recipientName: z.string().trim().min(2).max(150),
    paymentAddress: z.string().trim().min(3).max(300),
    providerName: z
      .string()
      .trim()
      .max(150)
      .optional()
      .or(z.literal("")),
    instructions: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .or(z.literal("")),
    expiresAt: z
      .string()
      .datetime()
      .optional()
      .or(z.literal("")),
  }),
  z.object({
    action: z.literal("approve_payment"),
  }),
  z.object({
    action: z.literal("reject_payment"),
    reason: z.string().trim().min(3).max(500),
  }),
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
    let notificationType:
      | "information"
      | "success"
      | "warning";

    if (action === "assign_payment_details") {
      if (
        charge.issueStatus !== "open" ||
        ![
          "awaiting_details",
          "awaiting_payment",
          "rejected",
        ].includes(charge.paymentStatus)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Payment details can only be assigned to an open charge awaiting details, payment or a corrected receipt.",
          },
          {
            status: 409,
          },
        );
      }

      if (!charge.selectedPaymentMethod) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The receiver must select a payment method before details are assigned.",
          },
          {
            status: 409,
          },
        );
      }

      charge.paymentDetails = {
        recipientName: result.data.recipientName,
        paymentAddress: result.data.paymentAddress,
        providerName: result.data.providerName || undefined,
        instructions: result.data.instructions || undefined,
        assignedAt: now,
        expiresAt: result.data.expiresAt
          ? new Date(result.data.expiresAt)
          : undefined,
      };
      charge.paymentStatus = "awaiting_payment";
      charge.rejectionReason = undefined;
      notificationTitle = "Payment details prepared";
      notificationMessage = `One-time payment details are ready for the shipment fee "${charge.title}".`;
      notificationType = "information";
    } else if (action === "approve_payment") {
      if (
        charge.issueStatus !== "open" ||
        charge.paymentStatus !== "under_review"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only a submitted receipt for an open charge can be approved.",
          },
          {
            status: 409,
          },
        );
      }

      if (!charge.paymentReceipt?.contentType) {
        return NextResponse.json(
          {
            success: false,
            error: "A receipt is required before approving payment.",
          },
          {
            status: 409,
          },
        );
      }

      charge.paymentStatus = "paid";
      charge.paidAt = now;
      charge.reviewedAt = now;
      charge.reviewedBy = new Types.ObjectId(session.adminId);
      notificationTitle = "Shipment fee paid";
      notificationMessage = `The payment for shipment fee "${charge.title}" has been approved. The shipment issue may still need to be resolved separately.`;
      notificationType = "success";
    } else if (action === "reject_payment") {
      if (charge.paymentStatus !== "under_review") {
        return NextResponse.json(
          {
            success: false,
            error: "Only a receipt under review can be rejected.",
          },
          {
            status: 409,
          },
        );
      }

      charge.paymentStatus = "rejected";
      charge.rejectionReason = result.data.reason;
      charge.reviewedAt = now;
      charge.reviewedBy = new Types.ObjectId(session.adminId);
      notificationTitle = "Shipment fee payment needs attention";
      notificationMessage = `The receipt for "${charge.title}" could not be approved: ${result.data.reason}`;
      notificationType = "warning";
    } else if (action === "resolve_issue") {
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
      showAsPopup:
        action === "assign_payment_details" ||
        action === "approve_payment" ||
        action === "reject_payment",
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
