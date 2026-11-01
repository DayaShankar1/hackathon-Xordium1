import "server-only";

import { getVerifiedClaims } from "@/features/auth/session";
import type { ActionResult } from "@/lib/action-result";
import type { TableRow } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import { RESOURCE_BUCKET, RESOURCE_PAGE_SIZE } from "./constants";
import { resourceIdSchema, type ResourceFilters } from "./schemas";
import type { PaginatedResources, ResourceView } from "./types";

type ResourceRow = TableRow<"resources">;

function queryError(context: string, error: { code?: string; message?: string }) {
  console.error(`[Resource Hub] ${context}`, error.code ?? "unknown");
  return "CampusSphere could not load Resource Hub data. Please try again.";
}

export async function getResourceViewer(): Promise<
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

async function hydrateResources(rows: ResourceRow[]): Promise<ActionResult<ResourceView[]>> {
  if (!rows.length) return { ok: true, data: [] };

  const supabase = await createClient();
  const uploaderIds = [...new Set(rows.map((resource) => resource.user_id))];
  const profiles = await supabase.from("profiles").select("id, display_name").in("id", uploaderIds);

  if (profiles.error) return { ok: false, error: queryError("uploader query failed", profiles.error) };

  const names = new Map(profiles.data.map((profile) => [profile.id, profile.display_name]));
  return {
    ok: true,
    data: rows.map((resource) => ({
      ...resource,
      uploaderName: names.get(resource.user_id) ?? "CampusSphere student",
    })),
  };
}

export async function getResources(
  filters: ResourceFilters,
  currentUserId: string,
): Promise<ActionResult<PaginatedResources>> {
  const supabase = await createClient();
  const from = (filters.page - 1) * RESOURCE_PAGE_SIZE;
  const to = from + RESOURCE_PAGE_SIZE - 1;

  let query = supabase
    .from("resources")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.view === "mine") query = query.eq("user_id", currentUserId);
  else query = query.eq("is_hidden", false);

  if (filters.q) query = query.ilike("title", `%${filters.q}%`);
  if (filters.subject) query = query.ilike("subject", `%${filters.subject}%`);
  if (filters.branch !== "all") query = query.eq("branch", filters.branch);
  if (filters.semester !== "all") query = query.eq("semester", filters.semester);
  if (filters.resourceType !== "all") query = query.eq("resource_type", filters.resourceType);

  const { data, error, count } = await query;

  if (error) return { ok: false, error: queryError("resource list failed", error) };

  const hydrated = await hydrateResources(data);
  if (!hydrated.ok) return hydrated;

  const total = count ?? 0;
  return {
    ok: true,
    data: {
      items: hydrated.data,
      page: filters.page,
      pageCount: Math.max(1, Math.ceil(total / RESOURCE_PAGE_SIZE)),
      total,
    },
  };
}

export async function getResource(id: string): Promise<ActionResult<ResourceView>> {
  const parsedId = resourceIdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "This resource link is invalid." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("resources").select("*").eq("id", parsedId.data).maybeSingle();

  if (error) return { ok: false, error: queryError("resource detail failed", error) };
  if (!data) return { ok: false, error: "Resource not found." };

  const hydrated = await hydrateResources([data]);
  if (!hydrated.ok) return hydrated;

  const resource = hydrated.data[0];
  const signed = await supabase.storage.from(RESOURCE_BUCKET).createSignedUrl(resource.file_path, 300);

  return {
    ok: true,
    data: {
      ...resource,
      viewUrl: signed.error ? null : signed.data.signedUrl,
    },
  };
}

export async function getResourceDownload(id: string): Promise<ActionResult<string>> {
  const parsedId = resourceIdSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "This resource link is invalid." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("file_path, file_name")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (error) return { ok: false, error: queryError("download metadata failed", error) };
  if (!data) return { ok: false, error: "Resource not found." };

  const signed = await supabase.storage
    .from(RESOURCE_BUCKET)
    .createSignedUrl(data.file_path, 300, { download: data.file_name });

  if (signed.error) {
    console.error("[Resource Hub] signed download failed", signed.error.message);
    return { ok: false, error: "This file is unavailable or has been removed." };
  }

  return { ok: true, data: signed.data.signedUrl };
}

export async function getAdminResources(): Promise<ActionResult<ResourceView[]>> {
  const viewer = await getResourceViewer();
  if (!viewer.ok) return viewer;
  if (viewer.data.role !== "admin") return { ok: false, error: "Administrator access is required." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false }).limit(100);

  if (error) return { ok: false, error: queryError("admin resource list failed", error) };
  return hydrateResources(data);
}
