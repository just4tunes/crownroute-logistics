import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createCustomerSession } from "@/lib/customer-auth";
import { connectToDatabase } from "@/lib/db";
import { Customer } from "@/models/customer";

const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(150),
  phone: z.string().trim().min(7).max(30),
  country: z.string().trim().min(2).max(100),
  address: z.string().trim().min(5).max(300),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registrationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please check your registration information and try again.",
          details: result.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    await connectToDatabase();

    const data = result.data;
    const email = data.email.toLowerCase();

    const existingCustomer = await Customer.exists({
      email,
    });

    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An account already exists with this email address.",
        },
        {
          status: 409,
        },
      );
    }

    const passwordHash = await hash(data.password, 12);

    const customer = await Customer.create({
      fullName: data.fullName,
      email,
      phone: data.phone,
      country: data.country,
      address: data.address,
      passwordHash,
      accountStatus: "pending_payment",
      registrationPaymentStatus: "not_started",
    });

    await createCustomerSession({
      customerId: customer._id.toString(),
      email: customer.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your account was created successfully.",
        nextPath: "/account",
        customer: {
          id: customer._id.toString(),
          fullName: customer.fullName,
          email: customer.email,
          accountStatus: customer.accountStatus,
          registrationPaymentStatus:
            customer.registrationPaymentStatus,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Customer registration error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An account already exists with this email address.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create your account right now.",
      },
      {
        status: 500,
      },
    );
  }
}