"use client";

import { createClient } from "@/utils/supabase/client";

import {
  MAX_RESOURCE_FILE_SIZE,
  RESOURCE_BUCKET,
  RESOURCE_MIME_TYPES,
} from "./constants";

const extensionByType: Record<(typeof RESOURCE_MIME_TYPES)[number], string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

export function validateResourceFile(file?: File | null) {
  if (!file) return "Choose a document to upload.";
  if (!RESOURCE_MIME_TYPES.includes(file.type as (typeof RESOURCE_MIME_TYPES)[number])) {
    return "Upload a PDF, DOC, DOCX, PPT, or PPTX document.";
  }
  if (file.size > MAX_RESOURCE_FILE_SIZE) return "The document must be 20 MB or smaller.";
  if (file.size < 1) return "The selected document is empty.";
  return null;
}

export async function uploadResourceFile(file: File, userId: string, resourceId: string) {
  const validationError = validateResourceFile(file);
  if (validationError) throw new Error(validationError);

  const extension = extensionByType[file.type as keyof typeof extensionByType];
  const path = `${userId}/${resourceId}/${crypto.randomUUID()}.${extension}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from(RESOURCE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);
  return path;
}

export async function removeResourceFile(path: string) {
  const supabase = createClient();
  await supabase.storage.from(RESOURCE_BUCKET).remove([path]);
}
