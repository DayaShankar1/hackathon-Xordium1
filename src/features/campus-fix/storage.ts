"use client";

import { createClient } from "@/utils/supabase/client";

import { CAMPUS_FIX_BUCKET, ISSUE_IMAGE_TYPES, MAX_ISSUE_IMAGES, MAX_ISSUE_IMAGE_SIZE } from "./constants";

const extensions: Record<(typeof ISSUE_IMAGE_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateEvidenceFiles(files: File[]) {
  if (files.length > MAX_ISSUE_IMAGES) return `Upload up to ${MAX_ISSUE_IMAGES} images.`;
  for (const file of files) {
    if (!ISSUE_IMAGE_TYPES.includes(file.type as (typeof ISSUE_IMAGE_TYPES)[number])) return "Evidence must be JPEG, PNG, or WebP.";
    if (file.size > MAX_ISSUE_IMAGE_SIZE) return "Each evidence image must be 5 MB or smaller.";
  }
  return null;
}

export async function uploadEvidence(files: File[], userId: string, issueId: string) {
  const error = validateEvidenceFiles(files);
  if (error) throw new Error(error);
  const supabase = createClient();
  const uploaded: Array<{ id: string; object_path: string; file_name: string; mime_type: (typeof ISSUE_IMAGE_TYPES)[number]; file_size_bytes: number }> = [];

  try {
    for (const file of files) {
      const id = crypto.randomUUID();
      const extension = extensions[file.type as keyof typeof extensions];
      const path = `${userId}/${issueId}/${id}/${crypto.randomUUID()}.${extension}`;
      const result = await supabase.storage.from(CAMPUS_FIX_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (result.error) throw new Error(result.error.message);
      uploaded.push({ id, object_path: path, file_name: file.name, mime_type: file.type as (typeof ISSUE_IMAGE_TYPES)[number], file_size_bytes: file.size });
    }
    return uploaded;
  } catch (uploadError) {
    if (uploaded.length) await supabase.storage.from(CAMPUS_FIX_BUCKET).remove(uploaded.map((item) => item.object_path));
    throw uploadError;
  }
}

export async function removeEvidence(paths: string[]) {
  if (!paths.length) return;
  await createClient().storage.from(CAMPUS_FIX_BUCKET).remove(paths);
}
