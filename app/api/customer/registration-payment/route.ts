import { NextResponse } from "next/server";
import { z } from "zod";

import { getCustomerSession } from "@/lib/customer-auth";
import { connectToDatabase } from "@/lib/db";
import { Customer } from "@/models/customer";
import { RegistrationPayment } from "@/models/registration-payment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_RECEIPT_SIZE = 2 * 1024 * 1024;

const acceptedReceiptTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const paymentMethodSchema = z.object({
  method: z.enum([
    "paypal",
    "cash_app",
    "bank_transfer",
    "bitcoin",
    "usdt",
  ]),
});

function generateReferenceCode() {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const randomValue = crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `REG-${timestamp}-${randomValue}`;
}

async function getAuthorizedCustomer() {
  const session = await getCustomerSession();

  if (!session) {
    return null;
  }

  await connectToDatabase();

  return Customer.findById(session.customerId);
}

export async function GET() {
  try {
    const customer = await getAuthorizedCustomer();

    if (!customer) {
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

    const payment =
      await RegistrationPayment.findOne({
        customerId: customer._id,
      })
        .select("-paymentProof.data")
        .lean();

    return NextResponse.json({
      success: true,
      amount: 1000,
      currency: "USD",
      payment,
    });
  } catch (error) {
    console.error(
      "Retrieve registration payment error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to retrieve your payment information.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const customer = await getAuthorizedCustomer();

    if (!customer) {
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

    if (customer.accountStatus === "active") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your registration payment has already been approved.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      customer.accountStatus === "suspended" ||
      customer.accountStatus === "rejected"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This account cannot create a payment request.",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json();
    const result = paymentMethodSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Select a valid payment method.",
        },
        {
          status: 400,
        },
      );
    }

    const existingPayment =
      await RegistrationPayment.findOne({
        customerId: customer._id,
      });

    if (existingPayment?.status === "under_review") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your payment is already being reviewed.",
        },
        {
          status: 409,
        },
      );
    }

    if (existingPayment?.status === "approved") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your registration payment has already been approved.",
        },
        {
          status: 409,
        },
      );
    }

    let payment = existingPayment;

    if (!payment) {
      payment = await RegistrationPayment.create({
        customerId: customer._id,
        referenceCode: generateReferenceCode(),
        amount: 1000,
        currency: "USD",
        method: result.data.method,
        status: "awaiting_details",
      });
    } else {
      payment.method = result.data.method;
      payment.amount = 1000;
      payment.currency = "USD";
      payment.status = "awaiting_details";

      payment.paymentDetails = undefined;
      payment.paymentProof = undefined;
      payment.assignedAt = undefined;
      payment.expiresAt = undefined;
      payment.submittedAt = undefined;
      payment.rejectionReason = undefined;
      payment.reviewedAt = undefined;
      payment.reviewedBy = undefined;

      await payment.save();
    }

    customer.registrationPaymentStatus =
      "awaiting_details";

    await customer.save();

    const safePayment =
      await RegistrationPayment.findById(payment._id)
        .select("-paymentProof.data")
        .lean();

    return NextResponse.json({
      success: true,
      message:
        "Your payment method was selected successfully.",
      payment: safePayment,
    });
  } catch (error) {
    console.error(
      "Create registration payment error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to prepare your payment request.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const customer = await getAuthorizedCustomer();

    if (!customer) {
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

    const formData = await request.formData();
    const paymentProof = formData.get("paymentProof");

    if (!(paymentProof instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Select a screenshot of your payment receipt.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !acceptedReceiptTypes.includes(paymentProof.type)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The receipt must be a JPEG, PNG or WebP image.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      paymentProof.size === 0 ||
      paymentProof.size > MAX_RECEIPT_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The receipt image must be smaller than 2 MB.",
        },
        {
          status: 400,
        },
      );
    }

    const payment =
      await RegistrationPayment.findOne({
        customerId: customer._id,
      });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment request not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (payment.status !== "awaiting_payment") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment details have not been assigned yet, or this payment has already been submitted.",
        },
        {
          status: 409,
        },
      );
    }

    const imageBuffer = Buffer.from(
      await paymentProof.arrayBuffer(),
    );

    payment.paymentProof = {
      data: imageBuffer,
      contentType: paymentProof.type,
      fileName: paymentProof.name.slice(0, 180),
      size: paymentProof.size,
      uploadedAt: new Date(),
    };

    payment.submittedAt = new Date();
    payment.status = "under_review";

    await payment.save();

    customer.registrationPaymentStatus =
      "under_review";

    await customer.save();

    const safePayment =
      await RegistrationPayment.findById(payment._id)
        .select("-paymentProof.data")
        .lean();

    return NextResponse.json({
      success: true,
      message:
        "Your payment receipt was submitted for verification.",
      payment: safePayment,
    });
  } catch (error) {
    console.error(
      "Upload payment receipt error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to upload your payment receipt.",
      },
      {
        status: 500,
      },
    );
  }
}