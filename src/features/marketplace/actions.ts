"use server";

import { revalidatePath } from "next/cache";

import { getVerifiedClaims } from "@/features/auth/session";
import type { ActionResult } from "@/lib/action-result";
import { createClient } from "@/utils/supabase/server";

import { MARKETPLACE_BUCKET } from "./constants";
import { createListingSchema, listingIdSchema } from "./schemas";

function validationErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1])),
  );
}

function refreshMarketplace(id?: string) {
  revalidatePath("/app/marketplace");
  if (id) revalidatePath(`/app/marketplace/${id}`);
}

async function authenticatedUser(): Promise<ActionResult<{ id: string; role: "student" | "admin" }>> {
  const claims = await getVerifiedClaims();
  const userId = claims?.sub;

  if (typeof userId !== "string") return { ok: false, error: "Your session expired. Sign in again." };

  const supabase = await createClient();
  const profile = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();

  if (profile.error || !profile.data) return { ok: false, error: "Your CampusSphere profile could not be loaded." };
  return { ok: true, data: { id: userId, role: profile.data.role } };
}

export async function createListing(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createListingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the listing fields and try again.",
      fieldErrors: validationErrors(parsed.error),
    };
  }

  const auth = await authenticatedUser();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  const insertData = {
    ...(parsed.data.id ? { id: parsed.data.id } : {}),
    user_id: auth.data.id,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    condition: parsed.data.condition,
    price: parsed.data.price,
    image_path: parsed.data.imagePath || null,
    status: "available" as const,
  };

  const { data: newListing, error } = await supabase
    .from("marketplace_listings")
    .insert(insertData)
    .select("id")
    .single();

  if (error || !newListing) {
    console.error("[Marketplace] create listing failed:", error);
    return { ok: false, error: "Could not publish your listing. Please try again." };
  }

  refreshMarketplace();
  return { ok: true, data: { id: newListing.id } };
}

export async function markListingStatus(
  listingId: string,
  newStatus: "available" | "sold" | "hidden",
): Promise<ActionResult<{ status: string }>> {
  const parsedId = listingIdSchema.safeParse(listingId);
  if (!parsedId.success) return { ok: false, error: "Invalid listing ID." };

  const auth = await authenticatedUser();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  let query = supabase
    .from("marketplace_listings")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", parsedId.data);

  if (auth.data.role !== "admin") {
    query = query.eq("user_id", auth.data.id);
  }

  const { error } = await query;
  if (error) {
    console.error("[Marketplace] update status failed:", error);
    return { ok: false, error: "Could not update listing status." };
  }

  refreshMarketplace(parsedId.data);
  return { ok: true, data: { status: newStatus } };
}

export async function deleteListing(listingId: string): Promise<ActionResult<{ deleted: boolean }>> {
  const parsedId = listingIdSchema.safeParse(listingId);
  if (!parsedId.success) return { ok: false, error: "Invalid listing ID." };

  const auth = await authenticatedUser();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  // Find image to clean up if exists
  const { data: existing } = await supabase
    .from("marketplace_listings")
    .select("image_path, user_id")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "Listing not found." };
  }

  if (existing.user_id !== auth.data.id && auth.data.role !== "admin") {
    return { ok: false, error: "You are not authorized to delete this listing." };
  }

  let deleteQuery = supabase.from("marketplace_listings").delete().eq("id", parsedId.data);
  if (auth.data.role !== "admin") {
    deleteQuery = deleteQuery.eq("user_id", auth.data.id);
  }

  const { error } = await deleteQuery;
  if (error) {
    console.error("[Marketplace] delete failed:", error);
    return { ok: false, error: "Could not delete listing." };
  }

  if (existing.image_path) {
    await supabase.storage.from(MARKETPLACE_BUCKET).remove([existing.image_path]);
  }

  refreshMarketplace(parsedId.data);
  return { ok: true, data: { deleted: true } };
}

