export const MAX_PARCEL_IMAGE_SIZE = 3 * 1024 * 1024;

export const PARCEL_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ParcelImageContentType =
  (typeof PARCEL_IMAGE_CONTENT_TYPES)[number];

export function isParcelImageContentType(
  contentType: string,
): contentType is ParcelImageContentType {
  return PARCEL_IMAGE_CONTENT_TYPES.some(
    (supportedType) => supportedType === contentType,
  );
}

export function matchesParcelImageSignature(
  data: Uint8Array,
  contentType: ParcelImageContentType,
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
