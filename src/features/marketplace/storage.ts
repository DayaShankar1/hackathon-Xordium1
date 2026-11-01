"use client";

import { createClient } from "@/utils/supabase/client";

import {
  ALLOWED_IMAGE_TYPES,
  MARKETPLACE_BUCKET,
  MAX_IMAGE_SIZE,
} from "./constants";

const extensionByType: Record<(typeof ALLOWED_IMAGE_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateListingImage(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Photographs must be JPEG, PNG, or WebP files.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Photograph must be 5 MB or smaller.";
  }

  return null;
}

export async function uploadListingImage(file: File, userId: string, listingId: string) {
  const validationError = validateListingImage(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const extension = extensionByType[file.type as keyof typeof extensionByType] || "jpg";
  const path = `${userId}/${listingId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(MARKETPLACE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);
  return path;
}

