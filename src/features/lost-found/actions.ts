"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-result";
import { getVerifiedClaims } from "@/features/auth/session";
import { createClient } from "@/utils/supabase/server";

import { LOST_FOUND_BUCKET, MAX_ITEM_IMAGES } from "./constants";
import {
  claimSchema,
  createReportSchema,
  itemIdSchema,
  reviewClaimSchema,
  updateReportSchema,
} from "./schemas";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1])),
  );
}

function refreshLostFound(id?: string) {
  revalidatePath("/app/lost-found");
  if (id) revalidatePath(`/app/lost-found/${id}`);
}

async function authenticatedUserId(): Promise<ActionResult<string>> {
  const claims = await getVerifiedClaims();
  const userId = claims?.sub;

  if (typeof userId !== "string") {
    return { ok: false, error: "Your session expired. Sign in again and retry." };
  }

  return { ok: true, data: userId };
}

function databaseMessage(error: { code?: string; message?: string }, fallback: string) {
  console.error("[Lost & Found] database mutation failed", error.code ?? "unknown");
  if (error.code === "42501") return "You do not have permission to perform this action.";
  if (error.code === "23505") return "This request already exists.";
  return fallback;
}

export async function createLostFoundReport(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the report fields and try again.", fieldErrors: fieldErrors(parsed.error) };

  const auth = await authenticatedUserId();
  if (!auth.ok) return auth;

  const expectedPrefix = `${auth.data}/${parsed.data.id}/`;
  const uniquePaths = [...new Set(parsed.data.imagePaths)];

  if (
    uniquePaths.length !== parsed.data.imagePaths.length ||
    uniquePaths.length > MAX_ITEM_IMAGES ||
    uniquePaths.some((path) => !path.startsWith(expectedPrefix))
  ) {
    return { ok: false, error: "One or more uploaded image paths are invalid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lost_found_items").insert({
    id: parsed.data.id,
    user_id: auth.data,
    item_type: parsed.data.itemType,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    location: parsed.data.location,
    incident_date: parsed.data.incidentDate || null,
    image_path: uniquePaths[0] ?? null,
    status: "open",
    is_hidden: false,
  });

  if (error) {
    return { ok: false, error: databaseMessage(error, "The report could not be created. Please try again.") };
  }

  if (uniquePaths.length) {
    const images = uniquePaths.map((objectPath, sortOrder) => ({
      item_id: parsed.data.id,
      uploaded_by: auth.data,
      object_path: objectPath,
      sort_order: sortOrder,
    }));
    const imageResult = await supabase.from("lost_found_item_images").insert(images);

    if (imageResult.error) {
      await supabase.from("lost_found_items").delete().eq("id", parsed.data.id).eq("user_id", auth.data);
      return { ok: false, error: databaseMessage(imageResult.error, "Image metadata could not be saved. Please retry the report.") };
    }
  }

  refreshLostFound(parsed.data.id);
  return { ok: true, data: { id: parsed.data.id } };
}

export async function updateLostFoundReport(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = updateReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the report fields and try again.", fieldErrors: fieldErrors(parsed.error) };

  const auth = await authenticatedUserId();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lost_found_items")
    .update({
      item_type: parsed.data.itemType,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      location: parsed.data.location,
      incident_date: parsed.data.incidentDate || null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", auth.data)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: databaseMessage(error ?? {}, "The report could not be updated.") };
  }

  refreshLostFound(parsed.data.id);
  return { ok: true, data: { id: parsed.data.id } };
}

export async function resolveLostFoundReport(id: string): Promise<ActionResult<{ id: string }>> {
  const parsedId = itemIdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "This report link is invalid." };

  const auth = await authenticatedUserId();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lost_found_items")
    .update({ status: "resolved" })
    .eq("id", parsedId.data)
    .eq("user_id", auth.data)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: databaseMessage(error ?? {}, "The report could not be resolved.") };
  }

  refreshLostFound(parsedId.data);
  return { ok: true, data: { id: parsedId.data } };
}

export async function deleteLostFoundReport(id: string): Promise<ActionResult<{ warning?: string }>> {
  const parsedId = itemIdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "This report link is invalid." };

  const auth = await authenticatedUserId();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const imageResult = await supabase
    .from("lost_found_item_images")
    .select("object_path")
    .eq("item_id", parsedId.data);
  const { data, error } = await supabase
    .from("lost_found_items")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", auth.data)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: databaseMessage(error ?? {}, "The report could not be deleted.") };
  }

  let warning: string | undefined;
  const paths = imageResult.data?.map((image) => image.object_path) ?? [];

  if (paths.length) {
    const removal = await supabase.storage.from(LOST_FOUND_BUCKET).remove(paths);
    if (removal.error) warning = "The report was deleted, but an image requires administrator cleanup.";
  }

  refreshLostFound(parsedId.data);
  return { ok: true, data: { warning } };
}

export async function submitLostFoundClaim(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = claimSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the claim fields and try again.", fieldErrors: fieldErrors(parsed.error) };

  const auth = await authenticatedUserId();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lost_found_claims")
    .insert({
      item_id: parsed.data.itemId,
      claimant_id: auth.data,
      statement: parsed.data.statement,
      identifying_details: parsed.data.identifyingDetails,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: databaseMessage(error, "Your private claim could not be submitted.") };
  }

  refreshLostFound(parsed.data.itemId);
  return { ok: true, data: { id: data.id } };
}

export async function reviewLostFoundClaim(input: unknown): Promise<ActionResult<{ itemId: string }>> {
  const parsed = reviewClaimSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "This claim decision is invalid." };

  const auth = await authenticatedUserId();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("review_lost_found_claim", {
    claim_id: parsed.data.claimId,
    decision: parsed.data.decision,
  });

  if (error || !data) {
    return { ok: false, error: databaseMessage(error ?? {}, "The claim could not be reviewed.") };
  }

  refreshLostFound(data.item_id);
  return { ok: true, data: { itemId: data.item_id } };
}
