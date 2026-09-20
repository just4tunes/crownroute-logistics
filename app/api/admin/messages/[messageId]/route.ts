import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import { Admin } from "@/models/admin";
import { ContactInquiry } from "@/models/contact-inquiry";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    messageId: string;
  }>;
};

const updateSchema = z.object({
  status: z.enum(["new", "read", "replied"]),
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

    const { messageId } = await context.params;

    if (!isValidObjectId(messageId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid message ID.",
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
          error: "Invalid message status.",
        },
        {
          status: 400,
        },
      );
    }

    const inquiry =
      await ContactInquiry.findByIdAndUpdate(
        messageId,
        {
          status: result.data.status,
        },
        {
          new: true,
          runValidators: true,
        },
      );

    if (!inquiry) {
      return NextResponse.json(
        {
          success: false,
          error: "Message not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message status updated.",
      inquiry: {
        id: inquiry._id.toString(),
        status: inquiry.status,
      },
    });
  } catch (error) {
    console.error("Update contact message error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update the message.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
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

    const { messageId } = await context.params;

    if (!isValidObjectId(messageId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid message ID.",
        },
        {
          status: 400,
        },
      );
    }

    const inquiry =
      await ContactInquiry.findByIdAndDelete(messageId);

    if (!inquiry) {
      return NextResponse.json(
        {
          success: false,
          error: "Message not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully.",
    });
  } catch (error) {
    console.error("Delete contact message error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to delete the message.",
      },
      {
        status: 500,
      },
    );
  }
}