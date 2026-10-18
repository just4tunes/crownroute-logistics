import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createCustomerSession } from "@/lib/customer-auth";
import { connectToDatabase } from "@/lib/db";
import { Customer } from "@/models/customer";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a valid email and password.",
        },
        {
          status: 400,
        },
      );
    }

    await connectToDatabase();

    const email = result.data.email.toLowerCase();

    const customer = await Customer.findOne({
      email,
    }).select("+passwordHash");

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password.",
        },
        {
          status: 401,
        },
      );
    }

    const passwordMatches = await compare(
      result.data.password,
      customer.passwordHash,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password.",
        },
        {
          status: 401,
        },
      );
    }

    if (customer.accountStatus === "suspended") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This account has been suspended. Please contact support.",
        },
        {
          status: 403,
        },
      );
    }

    if (customer.accountStatus === "rejected") {
      return NextResponse.json(
        {
          success: false,
          error:
            "This registration could not be approved. Please contact support.",
        },
        {
          status: 403,
        },
      );
    }

    await createCustomerSession({
      customerId: customer._id.toString(),
      email: customer.email,
    });

    customer.lastLoginAt = new Date();
    await customer.save();

    return NextResponse.json({
      success: true,
      message: "Signed in successfully.",
      nextPath: "/account",
      customer: {
        id: customer._id.toString(),
        fullName: customer.fullName,
        email: customer.email,
        accountStatus: customer.accountStatus,
        registrationPaymentStatus:
          customer.registrationPaymentStatus,
      },
    });
  } catch (error) {
    console.error("Customer login error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to sign in right now.",
      },
      {
        status: 500,
      },
    );
  }
}