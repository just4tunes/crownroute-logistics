import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { Customer } from "@/models/customer";
import { RegistrationPayment } from "@/models/registration-payment";

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

export async function GET() {
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

    const payments = await RegistrationPayment.find({})
      .sort({
        createdAt: -1,
      })
      .populate({
        path: "customerId",
        model: Customer,
        select:
          "fullName email phone country address accountStatus registrationPaymentStatus",
      })
      .lean();

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error(
      "Admin registration payment list error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to retrieve registration payments.",
      },
      {
        status: 500,
      },
    );
  }
}