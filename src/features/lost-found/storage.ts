"use client";

import { createClient } from "@/utils/supabase/client";

import {
  ALLOWED_IMAGE_TYPES,
  LOST_FOUND_BUCKET,
  MAX_IMAGE_SIZE,
  MAX_ITEM_IMAGES,
} from "./constants";

const extensionByType: Record<(typeof ALLOWED_IMAGE_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateItemImages(files: File[]) {
  if (files.length > MAX_ITEM_IMAGES) {
    return `Upload up to ${MAX_ITEM_IMAGES} photographs.`;
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return "Photographs must be JPEG, PNG, or WebP files.";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "Each photograph must be 5 MB or smaller.";
    }
  }

  return null;
}

export async function uploadItemImages(files: File[], userId: string, itemId: string) {
  const validationError = validateItemImages(files);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const uploadedPaths: string[] = [];

  try {
    for (const file of files) {
      const extension = extensionByType[file.type as keyof typeof extensionByType];
      const path = `${userId}/${itemId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from(LOST_FOUND_BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

      if (error) throw new Error(error.message);
      uploadedPaths.push(path);
    }

    return uploadedPaths;
  } catch (error) {
    if (uploadedPaths.length) await supabase.storage.from(LOST_FOUND_BUCKET).remove(uploadedPaths);
    throw error;
  }
}

export async function removeItemImages(paths: string[]) {
  if (!paths.length) return;
  const supabase = createClient();
  await supabase.storage.from(LOST_FOUND_BUCKET).remove(paths);
}
