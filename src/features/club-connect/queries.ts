import "server-only";

import { getVerifiedClaims } from "@/features/auth/session";
import type { ActionResult } from "@/lib/action-result";
import { createClient } from "@/utils/supabase/server";

import { EVENT_PAGE_SIZE } from "./constants";
import { type EventFilters } from "./schemas";
import type { ClubRow, EventView, PaginatedEvents } from "./types";

function queryError(context: string, error: { code?: string; message?: string }) {
  console.error(`[ClubConnect] ${context}`, error.code ?? "unknown", error.message ?? "");
  return "CampusSphere could not load ClubConnect data. Please try again.";
}

export async function getEventViewer(): Promise<ActionResult<{ id: string; role: "student" | "admin" }>> {
  const claims = await getVerifiedClaims();
  const userId = claims?.sub;

  if (typeof userId !== "string") return { ok: false, error: "Your session expired. Sign in again." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();

  if (error || !data) return { ok: false, error: "Your CampusSphere profile could not be loaded." };
  return { ok: true, data: { id: userId, role: data.role } };
}

export async function getClubs(): Promise<ActionResult<ClubRow[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clubs").select("*").order("name", { ascending: true });

  if (error) return { ok: false, error: queryError("clubs query failed", error) };
  return { ok: true, data: data ?? [] };
}

export async function getEvents(
  filters: EventFilters,
  currentUserId: string,
  userRole: "student" | "admin" = "student",
): Promise<ActionResult<PaginatedEvents>> {
  const supabase = await createClient();

  // If user requested "registered" tab, find which event IDs the user is registered for
  let registeredEventIds: string[] | null = null;
  const userRegQuery = await supabase
    .from("event_registrations")
    .select("event_id")
    .eq("user_id", currentUserId);

  if (userRegQuery.data) {
    registeredEventIds = userRegQuery.data.map((r) => r.event_id);
  }

  if (filters.view === "registered" && (!registeredEventIds || registeredEventIds.length === 0)) {
    return {
      ok: true,
      data: {
        items: [],
        page: filters.page,
        pageCount: 1,
        total: 0,
      },
    };
  }

  let query = supabase.from("events").select("*", { count: "exact" });

  // Status check: non-admins only see published events (or events they created)
  if (userRole !== "admin") {
    query = query.or(`status.eq.published,created_by.eq.${currentUserId}`);
  }

  if (filters.view === "registered" && registeredEventIds) {
    query = query.in("id", registeredEventIds);
  } else if (filters.view === "past") {
    query = query.lt("starts_at", new Date().toISOString());
  } else {
    // Default: upcoming or current events
    query = query.gte("starts_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  }

  if (filters.clubId) {
    query = query.eq("club_id", filters.clubId);
  }

  if (filters.q) {
    const term = `%${filters.q}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term},venue.ilike.${term}`);
  }

  // Ordering
  if (filters.view === "past") {
    query = query.order("starts_at", { ascending: false });
  } else {
    query = query.order("starts_at", { ascending: true });
  }

  const from = (filters.page - 1) * EVENT_PAGE_SIZE;
  const to = from + EVENT_PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: eventRows, count, error } = await query;
  if (error) return { ok: false, error: queryError("events query failed", error) };

  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / EVENT_PAGE_SIZE));

  if (!eventRows || eventRows.length === 0) {
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

  // Hydrate clubs and registration counts
  const clubIds = [...new Set(eventRows.map((e) => e.club_id).filter(Boolean))] as string[];
  const clubsMap = new Map<string, { name: string; category: string | null }>();

  if (clubIds.length > 0) {
    const { data: clubs } = await supabase.from("clubs").select("id, name, category").in("id", clubIds);
    if (clubs) {
      for (const club of clubs) {
        clubsMap.set(club.id, { name: club.name, category: club.category });
      }
    }
  }

  const eventIds = eventRows.map((e) => e.id);
  const { data: allRegistrations } = await supabase
    .from("event_registrations")
    .select("event_id, user_id")
    .in("event_id", eventIds);

  const regCountMap = new Map<string, number>();
  const userRegisteredSet = new Set<string>();

  if (allRegistrations) {
    for (const reg of allRegistrations) {
      regCountMap.set(reg.event_id, (regCountMap.get(reg.event_id) ?? 0) + 1);
      if (reg.user_id === currentUserId) {
        userRegisteredSet.add(reg.event_id);
      }
    }
  }

  const items: EventView[] = eventRows.map((event) => {
    const club = event.club_id ? clubsMap.get(event.club_id) : null;
    return {
      ...event,
      clubName: club?.name ?? null,
      clubCategory: club?.category ?? null,
      registrationCount: regCountMap.get(event.id) ?? 0,
      isRegistered: userRegisteredSet.has(event.id),
      isOwnerOrAdmin: event.created_by === currentUserId || userRole === "admin",
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

export async function getEvent(
  eventId: string,
  currentUserId: string,
  userRole: "student" | "admin" = "student",
): Promise<ActionResult<EventView>> {
  const supabase = await createClient();
  const { data: event, error } = await supabase.from("events").select("*").eq("id", eventId).maybeSingle();

  if (error || !event) return { ok: false, error: "The requested event could not be found." };

  let clubName: string | null = null;
  let clubCategory: string | null = null;

  if (event.club_id) {
    const { data: club } = await supabase.from("clubs").select("name, category").eq("id", event.club_id).maybeSingle();
    if (club) {
      clubName = club.name;
      clubCategory = club.category;
    }
  }

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("user_id")
    .eq("event_id", event.id);

  const registrationCount = registrations?.length ?? 0;
  const isRegistered = registrations?.some((r) => r.user_id === currentUserId) ?? false;

  return {
    ok: true,
    data: {
      ...event,
      clubName,
      clubCategory,
      registrationCount,
      isRegistered,
      isOwnerOrAdmin: event.created_by === currentUserId || userRole === "admin",
    },
  };
}

