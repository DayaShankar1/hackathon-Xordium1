import "server-only";

import type { ActionResult } from "@/lib/action-result";
import { getVerifiedClaims } from "@/features/auth/session";
import type { TableRow } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import { LOST_FOUND_BUCKET, LOST_FOUND_PAGE_SIZE } from "./constants";
import { itemIdSchema, type LostFoundFilters } from "./schemas";
import type {
  LostFoundClaimView,
  LostFoundImage,
  LostFoundItemView,
  PaginatedLostFoundItems,
} from "./types";

type ItemRow = TableRow<"lost_found_items">;

export async function getLostFoundViewer(): Promise<
  ActionResult<{ id: string; role: "student" | "admin" }>
> {
  const claims = await getVerifiedClaims();
  const userId = claims?.sub;

  if (typeof userId !== "string") return { ok: false, error: "Your session expired. Sign in again." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();

  if (error || !data) return { ok: false, error: "Your CampusSphere profile could not be loaded." };
  return { ok: true, data: { id: userId, role: data.role } };
}

function queryError(context: string, error: { code?: string; message?: string }) {
  console.error(`[Lost & Found] ${context}`, error.code ?? "unknown");
  return "CampusSphere could not load Lost & Found data. Please try again.";
}

async function hydrateItems(items: ItemRow[]): Promise<ActionResult<LostFoundItemView[]>> {
  if (!items.length) return { ok: true, data: [] };

  const supabase = await createClient();
  const itemIds = items.map((item) => item.id);
  const userIds = [...new Set(items.map((item) => item.user_id))];

  const [profilesResult, imagesResult] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", userIds),
    supabase
      .from("lost_found_item_images")
      .select("id, item_id, object_path, sort_order")
      .in("item_id", itemIds)
      .order("sort_order", { ascending: true }),
  ]);

  if (profilesResult.error) {
    return { ok: false, error: queryError("profile hydration failed", profilesResult.error) };
  }

  if (imagesResult.error) {
    return { ok: false, error: queryError("image hydration failed", imagesResult.error) };
  }

  const paths = imagesResult.data.map((image) => image.object_path);
  const signedUrlByPath = new Map<string, string>();

  if (paths.length) {
    const { data, error } = await supabase.storage.from(LOST_FOUND_BUCKET).createSignedUrls(paths, 3600);

    if (error) {
      console.error("[Lost & Found] signed image URL generation failed", error.message);
    } else {
      data.forEach((image) => {
        if (image.path && image.signedUrl) signedUrlByPath.set(image.path, image.signedUrl);
      });
    }
  }

  const profileById = new Map(profilesResult.data.map((profile) => [profile.id, profile.display_name]));
  const imagesByItem = new Map<string, LostFoundImage[]>();

  imagesResult.data.forEach((image) => {
    const view: LostFoundImage = {
      id: image.id,
      objectPath: image.object_path,
      signedUrl: signedUrlByPath.get(image.object_path) ?? null,
      sortOrder: image.sort_order,
    };
    const existing = imagesByItem.get(image.item_id) ?? [];
    existing.push(view);
    imagesByItem.set(image.item_id, existing);
  });

  return {
    ok: true,
    data: items.map((item) => ({
      ...item,
      images: imagesByItem.get(item.id) ?? [],
      reporterName: profileById.get(item.user_id) ?? "CampusSphere student",
    })),
  };
}

export async function getLostFoundItems(
  filters: LostFoundFilters,
  currentUserId: string,
): Promise<ActionResult<PaginatedLostFoundItems>> {
  const supabase = await createClient();
  const from = (filters.page - 1) * LOST_FOUND_PAGE_SIZE;
  const to = from + LOST_FOUND_PAGE_SIZE - 1;

  let query = supabase
    .from("lost_found_items")
    .select("*", { count: "exact" })
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.type === "mine") query = query.eq("user_id", currentUserId);
  else if (filters.type !== "all") query = query.eq("item_type", filters.type);

  if (filters.status === "active") query = query.in("status", ["open", "claimed"]);
  else if (filters.status !== "all") query = query.eq("status", filters.status);

  if (filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);

  const { data, error, count } = await query;

  if (error) return { ok: false, error: queryError("list query failed", error) };

  const hydrated = await hydrateItems(data);
  if (!hydrated.ok) return hydrated;

  const total = count ?? 0;

  return {
    ok: true,
    data: {
      items: hydrated.data,
      page: filters.page,
      pageCount: Math.max(1, Math.ceil(total / LOST_FOUND_PAGE_SIZE)),
      total,
    },
  };
}

export async function getLostFoundItem(id: string): Promise<ActionResult<LostFoundItemView>> {
  const parsedId = itemIdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "This report link is invalid." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("lost_found_items").select("*").eq("id", parsedId.data).maybeSingle();

  if (error) return { ok: false, error: queryError("detail query failed", error) };
  if (!data) return { ok: false, error: "Report not found." };

  const hydrated = await hydrateItems([data]);
  if (!hydrated.ok) return hydrated;

  return { ok: true, data: hydrated.data[0] };
}

export async function getLostFoundClaims(itemId: string): Promise<ActionResult<LostFoundClaimView[]>> {
  const parsedId = itemIdSchema.safeParse(itemId);
  if (!parsedId.success) return { ok: false, error: "This report link is invalid." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lost_found_claims")
    .select("*")
    .eq("item_id", parsedId.data)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: queryError("claims query failed", error) };
  if (!data.length) return { ok: true, data: [] };

  const claimantIds = [...new Set(data.map((claim) => claim.claimant_id))];
  const profiles = await supabase.from("profiles").select("id, display_name").in("id", claimantIds);

  if (profiles.error) return { ok: false, error: queryError("claimant query failed", profiles.error) };

  const names = new Map(profiles.data.map((profile) => [profile.id, profile.display_name]));

  return {
    ok: true,
    data: data.map((claim) => ({
      ...claim,
      claimantName: names.get(claim.claimant_id) ?? "CampusSphere student",
    })),
  };
}
