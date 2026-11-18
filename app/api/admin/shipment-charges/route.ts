import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import {
  CHARGE_PAYMENT_STATUSES,
  ShipmentCharge,
} from "@/models/shipment-charge";

export const dynamic = "force-dynamic";

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

export async function GET(request: Request) {
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

    const status = new URL(request.url).searchParams.get("status");
    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      if (
        !CHARGE_PAYMENT_STATUSES.includes(
          status as (typeof CHARGE_PAYMENT_STATUSES)[number],
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid payment status filter.",
          },
          { status: 400 },
        );
      }

      filter.paymentStatus = status;
    }

    const charges = await ShipmentCharge.find(filter)
      .sort({ createdAt: -1 })
      .select(
        [
          "_id",
          "shipmentId",
          "trackingNumber",
          "category",
          "title",
          "description",
          "amount",
          "currency",
          "issueStatus",
          "paymentStatus",
          "selectedPaymentMethod",
          "paymentDetails.recipientName",
          "paymentDetails.paymentAddress",
          "paymentDetails.providerName",
          "paymentDetails.instructions",
          "paymentDetails.assignedAt",
          "paymentDetails.expiresAt",
          "paymentReceipt.contentType",
          "rejectionReason",
          "submittedAt",
          "paidAt",
          "createdAt",
          "updatedAt",
        ].join(" "),
      )
      .lean();

    return NextResponse.json({
      success: true,
      charges: charges.map((charge) => ({
        id: charge._id.toString(),
        shipmentId: isValidObjectId(charge.shipmentId)
          ? charge.shipmentId.toString()
          : "",
        trackingNumber: charge.trackingNumber,
        category: charge.category,
        title: charge.title,
        description: charge.description,
        amount: charge.amount,
        currency: charge.currency,
        issueStatus: charge.issueStatus,
        paymentStatus: charge.paymentStatus,
        selectedPaymentMethod: charge.selectedPaymentMethod,
        paymentDetails: charge.paymentDetails
          ? {
              recipientName:
                charge.paymentDetails.recipientName,
              paymentAddress:
                charge.paymentDetails.paymentAddress,
              providerName:
                charge.paymentDetails.providerName,
              instructions:
                charge.paymentDetails.instructions,
              assignedAt:
                charge.paymentDetails.assignedAt,
              expiresAt:
                charge.paymentDetails.expiresAt,
            }
          : undefined,
        hasReceipt: Boolean(
          charge.paymentReceipt?.contentType,
        ),
        rejectionReason: charge.rejectionReason,
        submittedAt: charge.submittedAt,
        paidAt: charge.paidAt,
        createdAt: charge.createdAt,
        updatedAt: charge.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Admin shipment charge list error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve shipment fee payments.",
      },
      { status: 500 },
    );
  }
}
