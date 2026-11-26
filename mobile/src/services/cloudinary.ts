import type { PropertyImage } from "../types";

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

export const CLOUDINARY_CONFIGURED = Boolean(CLOUD_NAME && UPLOAD_PRESET);

type CloudinaryResponse = {
  secure_url?: string;
  error?: { message?: string };
};

/**
 * Uploads a property photo to Cloudinary using an unsigned upload preset.
 * The preset (not this code) controls folder, moderation and derived formats.
 * Remote URLs are passed through untouched.
 */
export async function uploadToCloudinary(image: PropertyImage): Promise<string> {
  if (/^https?:\/\//i.test(image.uri)) return image.uri;
  if (!image.base64) {
    throw new Error("Photo could not be read. Please pick it again.");
  }
  const body = new FormData();
  body.append("file", `data:${image.mimeType ?? "image/jpeg"};base64,${image.base64}`);
  body.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body }
  );
  const json = (await response.json().catch(() => null)) as CloudinaryResponse | null;
  if (!response.ok || !json?.secure_url) {
    throw new Error(json?.error?.message ?? "Photo upload failed. Please try again.");
  }
  return json.secure_url;
}
