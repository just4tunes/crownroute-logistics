import { randomBytes } from "crypto";

export function generateTrackingNumber() {
  const year = new Date().getFullYear();

  const randomPart = randomBytes(4)
    .toString("hex")
    .toUpperCase();

  return `CRL-${year}-${randomPart}`;
}