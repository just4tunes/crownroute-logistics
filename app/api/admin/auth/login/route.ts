import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";

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

    const admin = await Admin.findOne({
      email,
    }).select("+passwordHash");

    if (!admin || !admin.isActive) {
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
      admin.passwordHash,
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

    await createAdminSession({
      adminId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    admin.lastLoginAt = new Date();
    await admin.save();

    return NextResponse.json({
      success: true,
      admin: {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

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