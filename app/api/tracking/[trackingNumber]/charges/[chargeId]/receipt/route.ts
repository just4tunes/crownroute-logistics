import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { validatePaymentReceipt } from "@/lib/payment-receipt";
import { Shipment } from "@/models/shipment";
import { ShipmentCharge } from "@/models/shipment-charge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    trackingNumber: string;
    chargeId: string;
  }>;
};

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

    const contentType = request.headers
      .get("content-type")
      ?.split(";")[0]
      .trim()
      .toLowerCase();

    if (contentType !== "multipart/form-data") {
      return NextResponse.json(
        {
          success: false,
          error: "Submit the receipt as multipart form data.",
        },
        { status: 400 },
      );
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "The receipt form data could not be read.",
        },
        { status: 400 },
      );
    }

    const receiptEntries = formData.getAll("paymentReceipt");

    if (receiptEntries.length !== 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Select one payment receipt to submit.",
        },
        { status: 400 },
      );
    }

    const validation = await validatePaymentReceipt(
      receiptEntries[0],
    );

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const shipment = await Shipment.findOne({
      trackingNumber: normalizedTrackingNumber,
    }).select("_id");

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
          error: "Receipts can only be submitted for open issues.",
        },
        { status: 409 },
      );
    }

    if (
      charge.paymentStatus !== "awaiting_payment" &&
      charge.paymentStatus !== "rejected"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This charge is not accepting a payment receipt right now.",
        },
        { status: 409 },
      );
    }

    if (
      !charge.paymentDetails?.assignedAt ||
      !charge.paymentDetails.paymentAddress
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment details must be assigned before submitting a receipt.",
        },
        { status: 409 },
      );
    }

    const { receipt } = validation;
    charge.paymentReceipt = receipt;
    charge.submittedAt = receipt.uploadedAt;
    charge.paymentStatus = "under_review";
    charge.rejectionReason = undefined;
    charge.reviewedAt = undefined;
    charge.reviewedBy = undefined;

    await charge.save();

    return NextResponse.json({
      success: true,
      message: "Payment receipt submitted for verification.",
      charge: {
        id: charge._id.toString(),
        paymentStatus: charge.paymentStatus,
        hasReceipt: true,
        submittedAt: charge.submittedAt,
        receipt: {
          contentType: receipt.contentType,
          fileName: receipt.fileName,
          size: receipt.size,
          uploadedAt: receipt.uploadedAt,
        },
      },
    });
  } catch (error) {
    console.error("Submit shipment fee receipt error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to submit the shipment fee receipt.",
      },
      { status: 500 },
    );
  }
}
