import "server-only";

import { getVerifiedClaims } from "@/features/auth/session";
import type { ActionResult } from "@/lib/action-result";
import { createClient } from "@/utils/supabase/server";

import { MARKETPLACE_BUCKET, MARKETPLACE_PAGE_SIZE } from "./constants";
import type { MarketplaceFilters } from "./schemas";
import type { MarketplaceListingView, PaginatedMarketplaceListings } from "./types";

function queryError(context: string, error: { code?: string; message?: string }) {
  console.error(`[Marketplace] ${context}`, error.code ?? "unknown", error.message ?? "");
  return "CampusSphere could not load Marketplace items. Please try again.";
}

export async function getMarketplaceViewer(): Promise<ActionResult<{ id: string; role: "student" | "admin" }>> {
  const claims = await getVerifiedClaims();
  const userId = claims?.sub;

  if (typeof userId !== "string") return { ok: false, error: "Your session expired. Sign in again." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();

  if (error || !data) return { ok: false, error: "Your CampusSphere profile could not be loaded." };
  return { ok: true, data: { id: userId, role: data.role } };
}

export async function getMarketplaceListings(
  filters: MarketplaceFilters,
  currentUserId: string,
  userRole: "student" | "admin" = "student",
): Promise<ActionResult<PaginatedMarketplaceListings>> {
  const supabase = await createClient();

  let query = supabase.from("marketplace_listings").select("*", { count: "exact" });

  if (filters.view === "mine") {
    query = query.eq("user_id", currentUserId);
  } else if (filters.view === "sold") {
    query = query.eq("status", "sold");
  } else {
    // Default: available items only
    query = query.eq("status", "available");
  }

  // Admin or owner can see hidden items if requested; otherwise exclude hidden
  if (filters.view !== "mine" && userRole !== "admin") {
    query = query.neq("status", "hidden");
  }

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.condition) {
    query = query.eq("condition", filters.condition as "new" | "like_new" | "good" | "fair");
  }

  if (filters.q) {
    const term = `%${filters.q}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term}`);
  }

  query = query.order("created_at", { ascending: false });

  const from = (filters.page - 1) * MARKETPLACE_PAGE_SIZE;
  const to = from + MARKETPLACE_PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: rows, count, error } = await query;
  if (error) return { ok: false, error: queryError("listings query failed", error) };

  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / MARKETPLACE_PAGE_SIZE));

  if (!rows || rows.length === 0) {
    return {
      ok: true,
      data: {
        items: [],
        page: filters.page,
        pageCount,
        total,
      },
    };
  }

  // Hydrate seller display names
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  const items: MarketplaceListingView[] = rows.map((listing) => {
    let publicImageUrl: string | null = null;
    if (listing.image_path) {
      const { data } = supabase.storage.from(MARKETPLACE_BUCKET).getPublicUrl(listing.image_path);
      publicImageUrl = data?.publicUrl ?? null;
    }

    return {
      ...listing,
      price: Number(listing.price),
      sellerName: profileMap.get(listing.user_id) ?? "Campus Student",
      isOwner: listing.user_id === currentUserId || userRole === "admin",
      publicImageUrl,
    };
  });

  return {
    ok: true,
    data: {
      items,
      page: filters.page,
      pageCount,
      total,
    },
  };
}

export async function getMarketplaceListing(
  listingId: string,
  currentUserId: string,
  userRole: "student" | "admin" = "student",
): Promise<ActionResult<MarketplaceListingView>> {
  const supabase = await createClient();

  const { data: listing, error } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !listing) return { ok: false, error: "The requested listing could not be found." };

  const isOwner = listing.user_id === currentUserId || userRole === "admin";

  if (listing.status === "hidden" && !isOwner) {
    return { ok: false, error: "This listing has been hidden or removed by the seller." };
  }

  const { data: seller } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", listing.user_id)
    .maybeSingle();

  let publicImageUrl: string | null = null;
  if (listing.image_path) {
    const { data } = supabase.storage.from(MARKETPLACE_BUCKET).getPublicUrl(listing.image_path);
    publicImageUrl = data?.publicUrl ?? null;
  }

  return {
    ok: true,
    data: {
      ...listing,
      price: Number(listing.price),
      sellerName: seller?.display_name ?? "Campus Student",
      isOwner,
      publicImageUrl,
    },
  };
}

