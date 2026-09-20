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
    .min(2, "Please enter your full name.")
    .max(100),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
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
    .min(
      10,
      "Your message must contain at least 10 characters.",
    )
    .max(2000),

  website: z
    .string()
    .max(200)
    .optional()
    .or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors =
        result.error.flatten().fieldErrors;

      const firstError = Object.values(fieldErrors)
        .flat()
        .find(Boolean);

      return NextResponse.json(
        {
          success: false,
          error:
            firstError ??
            "Check your information and try again.",
          details: fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const data = result.data;

    // Honeypot field: silently accept bot submissions.
    if (data.website) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Your enquiry has been received.",
        },
        {
          status: 201,
        },
      );
    }

    await connectToDatabase();

    await ContactInquiry.create({
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      company: data.company || undefined,
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