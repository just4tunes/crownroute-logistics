import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { Customer } from "@/models/customer";
import { RegistrationPayment } from "@/models/registration-payment";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    paymentId: string;
  }>;
};

const paymentMethods = [
  "paypal",
  "cash_app",
  "bank_transfer",
  "bitcoin",
  "usdt",
] as const;

const updateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("assign_details"),

    method: z.enum(paymentMethods),

    recipientName: z
      .string()
      .trim()
      .min(2)
      .max(150),

    paymentAddress: z
      .string()
      .trim()
      .min(3)
      .max(300),

    bankName: z
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

    reason: z
      .string()
      .trim()
      .min(3)
      .max(500),
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

    const { paymentId } = await context.params;

    if (!isValidObjectId(paymentId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment request ID.",
        },
        {
          status: 400,
        },
      );
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Check the payment information and try again.",
          details: result.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const payment =
      await RegistrationPayment.findById(paymentId);

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

    const customer = await Customer.findById(
      payment.customerId,
    );

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer account not found.",
        },
        {
          status: 404,
        },
      );
    }

    const update = result.data;

    if (update.action === "assign_details") {
      if (payment.status === "approved") {
        return NextResponse.json(
          {
            success: false,
            error:
              "An approved payment cannot be changed.",
          },
          {
            status: 409,
          },
        );
      }

      if (payment.status === "under_review") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Reject the submitted payment before assigning different details.",
          },
          {
            status: 409,
          },
        );
      }

      payment.method = update.method;

      payment.paymentDetails = {
        recipientName: update.recipientName,
        paymentAddress: update.paymentAddress,
        bankName: update.bankName || undefined,
        instructions:
          update.instructions || undefined,
      };

      payment.amount = 1000;
      payment.currency = "USD";
      payment.status = "awaiting_payment";
      payment.assignedAt = new Date();

      payment.expiresAt = update.expiresAt
        ? new Date(update.expiresAt)
        : undefined;

      payment.rejectionReason = undefined;

      customer.registrationPaymentStatus =
        "awaiting_payment";
    }

    if (update.action === "approve_payment") {
      if (payment.status !== "under_review") {
        return NextResponse.json(
          {
            success: false,
            error:
              "The customer must submit a payment reference before approval.",
          },
          {
            status: 409,
          },
        );
      }

      payment.status = "approved";
      payment.reviewedAt = new Date();
      payment.reviewedBy = session.adminId;

      customer.registrationPaymentStatus =
        "approved";

      customer.accountStatus = "active";
    }

    if (update.action === "reject_payment") {
      if (payment.status === "approved") {
        return NextResponse.json(
          {
            success: false,
            error:
              "An approved payment cannot be rejected.",
          },
          {
            status: 409,
          },
        );
      }

      payment.status = "rejected";
      payment.rejectionReason = update.reason;
      payment.reviewedAt = new Date();
      payment.reviewedBy = session.adminId;

      customer.registrationPaymentStatus =
        "rejected";

      customer.accountStatus = "pending_payment";
    }

    await payment.save();
    await customer.save();

    return NextResponse.json({
      success: true,
      message: getSuccessMessage(update.action),
      payment,
      customer: {
        id: customer._id.toString(),
        fullName: customer.fullName,
        accountStatus: customer.accountStatus,
        registrationPaymentStatus:
          customer.registrationPaymentStatus,
      },
    });
  } catch (error) {
    console.error(
      "Admin registration payment update error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update the registration payment.",
      },
      {
        status: 500,
      },
    );
  }
}

function getSuccessMessage(action: string) {
  if (action === "assign_details") {
    return "Payment details assigned successfully.";
  }

  if (action === "approve_payment") {
    return "Payment approved and customer activated.";
  }

  return "Payment rejected.";
}