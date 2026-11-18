import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db";
import { Shipment } from "@/models/shipment";
import {
  CHARGE_PAYMENT_METHODS,
  ShipmentCharge,
} from "@/models/shipment-charge";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    trackingNumber: string;
    chargeId: string;
  }>;
};

const paymentRequestSchema = z.object({
  method: z.enum(CHARGE_PAYMENT_METHODS),
});

function normalizeTrackingNumber(value: string) {
  let decodedValue: string;

  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    return null;
  }

  const normalizedValue = decodedValue.trim().toUpperCase();

  return /^[A-Z0-9-]{5,40}$/.test(normalizedValue)
    ? normalizedValue
    : null;
}

function serializeCharge(charge: {
  _id: { toString(): string };
  category: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  issueStatus: string;
  paymentStatus: string;
  selectedPaymentMethod?: string;
  rejectionReason?: string;
  paymentReceipt?: { contentType?: string };
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: charge._id.toString(),
    category: charge.category,
    title: charge.title,
    description: charge.description,
    amount: charge.amount,
    currency: charge.currency,
    issueStatus: charge.issueStatus,
    paymentStatus: charge.paymentStatus,
    selectedPaymentMethod: charge.selectedPaymentMethod,
    ...(charge.paymentStatus === "rejected" &&
    charge.rejectionReason
      ? { rejectionReason: charge.rejectionReason }
      : {}),
    hasReceipt: Boolean(charge.paymentReceipt?.contentType),
    createdAt: charge.createdAt,
    updatedAt: charge.updatedAt,
  };
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { trackingNumber, chargeId } = await context.params;
    const normalizedTrackingNumber =
      normalizeTrackingNumber(trackingNumber);

    if (!normalizedTrackingNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid tracking number.",
        },
        { status: 400 },
      );
    }

    if (!isValidObjectId(chargeId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid charge ID.",
        },
        { status: 400 },
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
        { status: 400 },
      );
    }

    const result = paymentRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Select a supported payment method.",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const shipment = await Shipment.findOne({
      trackingNumber: normalizedTrackingNumber,
    }).select("_id trackingNumber");

    if (!shipment) {
      return NextResponse.json(
        {
          success: false,
          error: "Shipment not found.",
        },
        { status: 404 },
      );
    }

    const charge = await ShipmentCharge.findOne({
      _id: chargeId,
      shipmentId: shipment._id,
      trackingNumber: normalizedTrackingNumber,
    });

    if (!charge) {
      return NextResponse.json(
        {
          success: false,
          error: "Shipment charge not found.",
        },
        { status: 404 },
      );
    }

    if (charge.issueStatus !== "open") {
      return NextResponse.json(
        {
          success: false,
          error: "Payment cannot be requested for a closed issue.",
        },
        { status: 409 },
      );
    }

    if (
      charge.paymentStatus === "paid" ||
      charge.paymentStatus === "waived"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "This shipment charge is no longer payable.",
        },
        { status: 409 },
      );
    }

    if (charge.paymentStatus === "under_review") {
      return NextResponse.json(
        {
          success: false,
          error: "A receipt for this charge is already under review.",
        },
        { status: 409 },
      );
    }

    const isNewRequest =
      charge.paymentStatus !== "awaiting_details" ||
      charge.selectedPaymentMethod !== result.data.method;

    charge.selectedPaymentMethod = result.data.method;
    charge.paymentStatus = "awaiting_details";

    if (isNewRequest) {
      charge.paymentDetails = undefined;
      charge.rejectionReason = undefined;
      charge.paymentReceipt = undefined;
      charge.submittedAt = undefined;
      charge.reviewedAt = undefined;
      charge.reviewedBy = undefined;
      charge.paidAt = undefined;
    }

    await charge.save();

    return NextResponse.json({
      success: true,
      message: "Preparing your payment details.",
      charge: serializeCharge(charge),
    });
  } catch (error) {
    console.error("Create shipment fee payment request error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to prepare the shipment fee payment.",
      },
      { status: 500 },
    );
  }
}
