"use server";

import { revalidatePath } from "next/cache";

import { getVerifiedClaims } from "@/features/auth/session";
import type { ActionResult } from "@/lib/action-result";
import { createClient } from "@/utils/supabase/server";

import { RESOURCE_BUCKET } from "./constants";
import {
  createResourceSchema,
  moderateResourceSchema,
  resourceIdSchema,
  updateResourceSchema,
} from "./schemas";

function validationErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1])),
  );
}

function refreshResources(id?: string) {
  revalidatePath("/app/resources");
  revalidatePath("/app/admin/resources");
  if (id) revalidatePath(`/app/resources/${id}`);
}

async function authenticatedUser(): Promise<ActionResult<{ id: string; role: "student" | "admin" }>> {
  const claims = await getVerifiedClaims();
  const userId = claims?.sub;

  if (typeof userId !== "string") return { ok: false, error: "Your session expired. Sign in again and retry." };

  const supabase = await createClient();
  const profile = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();

  if (profile.error || !profile.data) return { ok: false, error: "Your CampusSphere profile could not be loaded." };
  return { ok: true, data: { id: userId, role: profile.data.role } };
}

function databaseMessage(error: { code?: string; message?: string }, fallback: string) {
  console.error("[Resource Hub] database mutation failed", error.code ?? "unknown");
  if (error.code === "42501") return "You do not have permission to perform this action.";
  if (error.code === "23505") return "This file is already attached to a resource.";
  if (error.code === "23514") return "The resource metadata did not pass database validation.";
  return fallback;
}

export async function createResource(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createResourceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the resource fields and try again.", fieldErrors: validationErrors(parsed.error) };
  }

  const auth = await authenticatedUser();
  if (!auth.ok) return auth;

  const expectedPrefix = `${auth.data.id}/${parsed.data.id}/`;
  if (!parsed.data.filePath.startsWith(expectedPrefix)) {
    return { ok: false, error: "The uploaded file path is invalid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("resources").insert({
    id: parsed.data.id,
    user_id: auth.data.id,
    title: parsed.data.title,
    description: parsed.data.description,
    subject: parsed.data.subject,
    branch: parsed.data.branch,
    semester: parsed.data.semester,
    resource_type: parsed.data.resourceType,
    file_path: parsed.data.filePath,
    file_name: parsed.data.fileName,
    mime_type: parsed.data.mimeType,
    file_size_bytes: parsed.data.fileSizeBytes,
    is_hidden: false,
  });

  if (error) return { ok: false, error: databaseMessage(error, "The resource could not be published.") };

  refreshResources(parsed.data.id);
  return { ok: true, data: { id: parsed.data.id } };
}

export async function updateResource(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = updateResourceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the resource fields and try again.", fieldErrors: validationErrors(parsed.error) };
  }

  const auth = await authenticatedUser();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      subject: parsed.data.subject,
      branch: parsed.data.branch,
      semester: parsed.data.semester,
      resource_type: parsed.data.resourceType,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", auth.data.id)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: databaseMessage(error ?? {}, "The resource could not be updated.") };

  refreshResources(parsed.data.id);
  return { ok: true, data: { id: parsed.data.id } };
}

export async function deleteResource(id: string): Promise<ActionResult<{ warning?: string }>> {
  const parsedId = resourceIdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "This resource link is invalid." };

  const auth = await authenticatedUser();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const existing = await supabase.from("resources").select("file_path").eq("id", parsedId.data).maybeSingle();
  if (existing.error || !existing.data) return { ok: false, error: "Resource not found or access denied." };

  const deletion = await supabase.from("resources").delete().eq("id", parsedId.data).select("id").maybeSingle();
  if (deletion.error || !deletion.data) {
    return { ok: false, error: databaseMessage(deletion.error ?? {}, "The resource could not be deleted.") };
  }

  const fileRemoval = await supabase.storage.from(RESOURCE_BUCKET).remove([existing.data.file_path]);
  refreshResources(parsedId.data);

  return {
    ok: true,
    data: {
      warning: fileRemoval.error
        ? "The resource was deleted, but its file requires administrator cleanup."
        : undefined,
    },
  };
}

export async function moderateResource(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = moderateResourceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "The moderation request is invalid." };
  }

  const auth = await authenticatedUser();
  if (!auth.ok) return auth;
  if (auth.data.role !== "admin") return { ok: false, error: "Administrator access is required." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .update({
      is_hidden: parsed.data.action === "hide",
      hidden_reason: parsed.data.action === "hide" ? parsed.data.reason : null,
    })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, error: databaseMessage(error ?? {}, "The resource could not be moderated.") };

  refreshResources(parsed.data.id);
  return { ok: true, data: { id: parsed.data.id } };
}
