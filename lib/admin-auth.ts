import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

import type { AdminRole } from "@/models/admin";

const SESSION_COOKIE = "crownroute_admin_session";
const SESSION_DURATION = 60 * 60 * 8;

export type AdminSession = {
  adminId: string;
  email: string;
  role: AdminRole;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing from .env.local.");
  }

  return new TextEncoder().encode(secret);
}

export async function createAdminSession(
  session: AdminSession,
) {
  const token = await new SignJWT({
    adminId: session.adminId,
    email: session.email,
    role: session.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getJwtSecret());

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getJwtSecret(),
    );

    const validRoles: AdminRole[] = [
      "owner",
      "developer",
      "staff",
    ];

    if (
      typeof payload.adminId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      !validRoles.includes(payload.role as AdminRole)
    ) {
      return null;
    }

    return {
      adminId: payload.adminId,
      email: payload.email,
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
  });
}