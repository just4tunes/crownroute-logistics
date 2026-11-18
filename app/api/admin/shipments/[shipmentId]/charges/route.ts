import { isValidObjectId, Types } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { Shipment } from "@/models/shipment";
import {
  CHARGE_CATEGORIES,
  ShipmentCharge,
} from "@/models/shipment-charge";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    shipmentId: string;
  }>;
};

const createChargeSchema = z.object({
  category: z.enum(CHARGE_CATEGORIES),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(700),
  amount: z.number().finite().positive(),
  currency: z
    .string()
    .regex(/^[A-Za-z]{3}$/)
    .transform((value) => value.toUpperCase()),
});

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

function formatFee(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function serializeCharge(charge: {
  _id: Types.ObjectId;
  category: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  issueStatus: string;
  paymentStatus: string;
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
    createdAt: charge.createdAt,
    updatedAt: charge.updatedAt,
  };
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

    const shipment = await Shipment.findById(shipmentId)
      .select("_id")
      .lean();

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

    const charges = await ShipmentCharge.find({
      shipmentId: shipment._id,
    })
      .sort({ createdAt: -1 })
      .select(
        "_id category title description amount currency issueStatus paymentStatus createdAt updatedAt",
      )
      .lean();

    return NextResponse.json({
      success: true,
      charges: charges.map(serializeCharge),
    });
  } catch (error) {
    console.error("Admin shipment charges list error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve shipment charges.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
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

    const result = createChargeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Check the charge information and try again.",
          details: result.error.flatten(),
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

    const data = result.data;
    const charge = await ShipmentCharge.create({
      shipmentId: shipment._id,
      trackingNumber: shipment.trackingNumber,
      category: data.category,
      title: data.title,
      description: data.description,
      amount: data.amount,
      currency: data.currency,
      issueStatus: "open",
      paymentStatus: "unpaid",
      createdBy: new Types.ObjectId(session.adminId),
    });

    const fee = formatFee(data.amount, data.currency);
    shipment.notifications.push({
      title: `Shipment issue: ${data.title}`,
      message: `${data.description} Fee: ${fee}.`,
      type: "critical",
      showAsPopup: true,
      createdAt: new Date(),
    });
    shipment.markModified("notifications");
    await shipment.save({ timestamps: false });

    return NextResponse.json(
      {
        success: true,
        charge: serializeCharge(charge),
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Admin shipment charge creation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create the shipment charge.",
      },
      {
        status: 500,
      },
    );
  }
}
