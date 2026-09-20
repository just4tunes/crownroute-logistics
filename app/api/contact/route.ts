import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db";
import { ContactInquiry } from "@/models/contact-inquiry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100),

  email: z
    .string()
    .trim()
    .email()
    .max(150),

  phone: z
    .string()
    .trim()
    .max(50)
    .optional()
    .or(z.literal("")),

  company: z
    .string()
    .trim()
    .max(150)
    .optional()
    .or(z.literal("")),

  service: z.enum([
    "parcel",
    "air",
    "ocean",
    "rail",
    "express",
    "freight",
    "general",
  ]),

  message: z
    .string()
    .trim()
    .min(10)
    .max(2000),

  website: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("")),
});

export async function POST(
  request: Request,
) {
  try {
    const body = await request.json();

    const result =
      contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Check your information and try again.",
          details:
            result.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const data = result.data;

    // Hidden spam-trap field.
    if (data.website) {
      return NextResponse.json({
        success: true,
        message:
          "Your enquiry has been received.",
      });
    }

    await connectToDatabase();

    await ContactInquiry.create({
      name: data.name,
      email: data.email,
      phone:
        data.phone || undefined,
      company:
        data.company || undefined,
      service: data.service,
      message: data.message,
      status: "new",
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your enquiry has been received. Our team will contact you shortly.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Contact enquiry error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to send your enquiry right now.",
      },
      {
        status: 500,
      },
    );
  }
}