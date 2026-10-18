import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const SESSION_COOKIE = "crownroute_customer_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;

export type CustomerSession = {
  customerId: string;
  email: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is missing from your environment variables.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createCustomerSession(
  session: CustomerSession,
) {
  const token = await new SignJWT({
    customerId: session.customerId,
    email: session.email,
    sessionType: "customer",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
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

export async function getCustomerSession(): Promise<CustomerSession | null> {
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

    if (
      payload.sessionType !== "customer" ||
      typeof payload.customerId !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return {
      customerId: payload.customerId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export async function deleteCustomerSession() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
  });
}