export const MAX_PAYMENT_RECEIPT_SIZE = 2 * 1024 * 1024;

export const PAYMENT_RECEIPT_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type PaymentReceiptContentType =
  (typeof PAYMENT_RECEIPT_CONTENT_TYPES)[number];

export type ValidatedPaymentReceipt = {
  data: Buffer;
  contentType: PaymentReceiptContentType;
  fileName: string;
  size: number;
  uploadedAt: Date;
};

function isPaymentReceiptContentType(
  contentType: string,
): contentType is PaymentReceiptContentType {
  return PAYMENT_RECEIPT_CONTENT_TYPES.some(
    (supportedType) => supportedType === contentType,
  );
}

function matchesPaymentReceiptSignature(
  data: Uint8Array,
  contentType: PaymentReceiptContentType,
) {
  if (contentType === "image/jpeg") {
    return (
      data.length >= 3 &&
      data[0] === 0xff &&
      data[1] === 0xd8 &&
      data[2] === 0xff
    );
  }

  if (contentType === "image/png") {
    return (
      data.length >= 8 &&
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47 &&
      data[4] === 0x0d &&
      data[5] === 0x0a &&
      data[6] === 0x1a &&
      data[7] === 0x0a
    );
  }

  return (
    data.length >= 12 &&
    data[0] === 0x52 &&
    data[1] === 0x49 &&
    data[2] === 0x46 &&
    data[3] === 0x46 &&
    data[8] === 0x57 &&
    data[9] === 0x45 &&
    data[10] === 0x42 &&
    data[11] === 0x50
  );
}

export async function validatePaymentReceipt(
  value: FormDataEntryValue | null,
): Promise<
  | { success: true; receipt: ValidatedPaymentReceipt }
  | { success: false; error: string }
> {
  if (!(value instanceof File)) {
    return {
      success: false,
      error: "Select a screenshot of your payment receipt.",
    };
  }

  if (
    value.size === 0 ||
    value.size > MAX_PAYMENT_RECEIPT_SIZE
  ) {
    return {
      success: false,
      error: "The receipt image must be no larger than 2 MB.",
    };
  }

  if (!isPaymentReceiptContentType(value.type)) {
    return {
      success: false,
      error: "The receipt must be a JPEG, PNG or WebP image.",
    };
  }

  const data = Buffer.from(await value.arrayBuffer());

  if (!matchesPaymentReceiptSignature(data, value.type)) {
    return {
      success: false,
      error: "The receipt contents do not match its image format.",
    };
  }

  return {
    success: true,
    receipt: {
      data,
      contentType: value.type,
      fileName:
        value.name.replace(/[\r\n"]/g, "_").slice(0, 180) ||
        "payment-receipt",
      size: value.size,
      uploadedAt: new Date(),
    },
  };
}
