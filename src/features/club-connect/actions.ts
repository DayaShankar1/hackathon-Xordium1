"use server";

import { revalidatePath } from "next/cache";

import { getVerifiedClaims } from "@/features/auth/session";
import type { ActionResult } from "@/lib/action-result";
import { createClient } from "@/utils/supabase/server";

import { createEventSchema, eventIdSchema } from "./schemas";

function validationErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1])),
  );
}

function refreshEvents(id?: string) {
  revalidatePath("/app/events");
  if (id) revalidatePath(`/app/events/${id}`);
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

export async function registerForEvent(eventId: string): Promise<ActionResult<{ registered: boolean }>> {
  const parsedId = eventIdSchema.safeParse(eventId);
  if (!parsedId.success) return { ok: false, error: "Invalid event identifier." };

  const auth = await authenticatedUser();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  // Check event exists and capacity
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, status, capacity, title")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (eventError || !event) {
    return { ok: false, error: "Event not found or unavailable." };
  }

  if (event.status !== "published") {
    return { ok: false, error: "Registrations are not open for this event." };
  }

  if (event.capacity) {
    const { count, error: countError } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", event.id);

    if (!countError && typeof count === "number" && count >= event.capacity) {
      return { ok: false, error: "This event is at full capacity." };
    }
  }

  const { error: insertError } = await supabase.from("event_registrations").insert({
    event_id: event.id,
    user_id: auth.data.id,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "You are already registered for this event." };
    }
    console.error("[ClubConnect] register failed:", insertError);
    return { ok: false, error: "Could not complete event registration. Please try again." };
  }

  refreshEvents(event.id);
  return { ok: true, data: { registered: true } };
}

export async function cancelEventRegistration(eventId: string): Promise<ActionResult<{ cancelled: boolean }>> {
  const parsedId = eventIdSchema.safeParse(eventId);
  if (!parsedId.success) return { ok: false, error: "Invalid event identifier." };

  const auth = await authenticatedUser();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  const { error } = await supabase
    .from("event_registrations")
    .delete()
    .eq("event_id", parsedId.data)
    .eq("user_id", auth.data.id);

  if (error) {
    console.error("[ClubConnect] cancel registration failed:", error);
    return { ok: false, error: "Could not cancel registration. Please try again." };
  }

  refreshEvents(parsedId.data);
  return { ok: true, data: { cancelled: true } };
}

export async function createEvent(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the event details and try again.",
      fieldErrors: validationErrors(parsed.error),
    };
  }

  const auth = await authenticatedUser();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  const { data: newEvent, error } = await supabase
    .from("events")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description,
      venue: parsed.data.venue,
      starts_at: parsed.data.startsAt,
      ends_at: parsed.data.endsAt || null,
      club_id: parsed.data.clubId || null,
      capacity: parsed.data.capacity || null,
      status: "published",
      created_by: auth.data.id,
    })
    .select("id")
    .single();

  if (error || !newEvent) {
    console.error("[ClubConnect] create event failed:", error);
    if (error?.code === "42501") {
      return { ok: false, error: "Only authorized administrators can publish club events." };
    }
    return { ok: false, error: "Could not publish event. Please try again." };
  }

  refreshEvents();
  return { ok: true, data: { id: newEvent.id } };
}

export async function cancelEvent(eventId: string): Promise<ActionResult<{ cancelled: boolean }>> {
  const parsedId = eventIdSchema.safeParse(eventId);
  if (!parsedId.success) return { ok: false, error: "Invalid event ID." };

  const auth = await authenticatedUser();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("id", parsedId.data);

  if (error) {
    console.error("[ClubConnect] cancel event failed:", error);
    return { ok: false, error: "Could not cancel event. Ensure you have administrator permissions." };
  }

  refreshEvents(parsedId.data);
  return { ok: true, data: { cancelled: true } };
}

