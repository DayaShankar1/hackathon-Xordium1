"use server";

import { revalidatePath } from "next/cache";

import { getVerifiedClaims } from "@/features/auth/session";
import type { ActionResult } from "@/lib/action-result";
import { getWhatsAppConfiguration } from "@/lib/env.server";
import type { Json } from "@/types/database";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

import { processCampusFixNotifications } from "./notifications/service";
import { sendWhatsApp } from "./notifications/twilio-provider";
import {
  assignmentSchema,
  categoryRouteSchema,
  contactSchema,
  createIssueSchema,
  departmentSchema,
  editIssueSchema,
  moderationSchema,
  reopenSchema,
  resolveIssueSchema,
  scopeSchema,
  staffUpdateSchema,
  transitionSchema,
  voteSchema,
} from "./schemas";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  return Object.fromEntries(Object.entries(error.flatten().fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1])));
}

function databaseError(error: { code?: string; message?: string }, fallback: string) {
  console.error("[CampusFix] mutation failed", error.code ?? "unknown");
  if (error.code === "42501") return "You do not have permission to perform this action.";
  if (error.code === "40001") return "This issue changed. Refresh the page and try again.";
  if (error.code === "23505") return "This request was already processed.";
  if (error.code === "23514") return error.message ?? "The requested change is not allowed.";
  return fallback;
}

async function viewer(): Promise<ActionResult<{ id: string; role: "student" | "admin" }>> {
  const claims = await getVerifiedClaims();
  if (typeof claims?.sub !== "string") return { ok: false, error: "Your session expired. Sign in again." };
  const supabase = await createClient();
  const profile = await supabase.from("profiles").select("role").eq("id", claims.sub).maybeSingle();
  if (profile.error || !profile.data) return { ok: false, error: "Your CampusSphere profile could not be loaded." };
  return { ok: true, data: { id: claims.sub, role: profile.data.role } };
}

function refresh(issueId?: string) {
  revalidatePath("/app/campus-fix");
  revalidatePath("/app/admin/campus-fix");
  revalidatePath("/app/staff/campus-fix");
  if (issueId) revalidatePath(`/app/campus-fix/${issueId}`);
}

export async function createCampusIssue(input: unknown): Promise<ActionResult<{ id: string; referenceId: string; notificationState: string }>> {
  const parsed = createIssueSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the issue fields and try again.", fieldErrors: fieldErrors(parsed.error) };
  const auth = await viewer();
  if (!auth.ok) return auth;
  if (parsed.data.evidence.some((item) => !item.object_path.startsWith(`${auth.data.id}/${parsed.data.id}/`))) return { ok: false, error: "An evidence path is invalid." };

  const supabase = await createClient();
  const result = await supabase.rpc("campus_fix_submit_issue", {
    p_issue_id: parsed.data.id,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_category: parsed.data.category,
    p_building: parsed.data.building,
    p_location: parsed.data.location,
    p_priority: parsed.data.priority,
    p_is_anonymous: parsed.data.isAnonymous,
    p_notify_authority: parsed.data.notifyAuthority,
    p_evidence: parsed.data.evidence as unknown as Json,
    p_request_id: parsed.data.requestId,
  });
  if (result.error || !result.data) return { ok: false, error: databaseError(result.error ?? {}, "The issue could not be submitted.") };

  let notificationState = "pending";

  if (parsed.data.notifyAuthority) {
    const config = getWhatsAppConfiguration();
    if (config.enabled) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
      const admin = createAdminClient();

      let contactNumber: string | null = null;
      if (result.data.assigned_contact_id) {
        const { data: contact } = await admin
          .from("campus_fix_contacts")
          .select("whatsapp_number, whatsapp_consent, is_active")
          .eq("id", result.data.assigned_contact_id)
          .maybeSingle();

        if (contact?.is_active && contact?.whatsapp_consent && contact?.whatsapp_number) {
          contactNumber = contact.whatsapp_number;
        }
      }

      const targetNumber = config.environment.CAMPUSFIX_AUTHORITY_WHATSAPP_NUMBER || contactNumber;

      if (targetNumber) {
        console.log(`[CampusFix] Sending WhatsApp alert to authority (${targetNumber}) for issue ${result.data.reference_id}`);
        const outcome = await sendWhatsApp({
          notificationId: result.data.id,
          to: targetNumber,
          referenceId: result.data.reference_id,
          title: result.data.title,
          location: `${result.data.building}, ${result.data.location}`,
          priority: result.data.priority,
          issueLink: `${siteUrl}/app/campus-fix/${result.data.id}`,
        });

        console.log(`[CampusFix] WhatsApp delivery outcome:`, outcome);

        if (outcome.state === "accepted") {
          notificationState = "processed";
          try {
            const { data: existingLog } = await admin
              .from("campus_fix_notification_logs")
              .select("id")
              .eq("issue_id", result.data.id)
              .eq("event_type", "issue_created")
              .maybeSingle();

            if (existingLog) {
              await admin
                .from("campus_fix_notification_logs")
                .update({
                  status: outcome.providerStatus === "queued" ? "queued" : "accepted",
                  provider_message_sid: outcome.providerMessageSid,
                  provider_status: outcome.providerStatus,
                  last_error_code: null,
                  last_error_message: null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingLog.id);
            } else {
              await admin.from("campus_fix_notification_logs").insert({
                issue_id: result.data.id,
                event_type: "issue_created",
                channel: "whatsapp",
                status: outcome.providerStatus === "queued" ? "queued" : "accepted",
                provider_message_sid: outcome.providerMessageSid,
                provider_status: outcome.providerStatus,
                idempotency_key: `${result.data.id}:direct_authority_notify`,
              });
            }
          } catch (logErr) {
            console.error("[CampusFix] could not record notification log:", logErr);
          }
        }
      }
    }
  }

  try {
    await processCampusFixNotifications();
  } catch (queueErr) {
    console.warn("[CampusFix] queue processing warning:", queueErr);
  }

  refresh(result.data.id);
  return { ok: true, data: { id: result.data.id, referenceId: result.data.reference_id, notificationState } };
}

export async function editCampusIssue(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = editIssueSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the issue fields and try again.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const result = await supabase.rpc("campus_fix_edit_issue", {
    p_issue_id: parsed.data.id, p_title: parsed.data.title, p_description: parsed.data.description,
    p_building: parsed.data.building, p_location: parsed.data.location,
    p_priority: parsed.data.priority, p_request_id: parsed.data.requestId,
  });
  if (result.error || !result.data) return { ok: false, error: databaseError(result.error ?? {}, "The issue could not be updated.") };
  refresh(result.data.id);
  return { ok: true, data: { id: result.data.id } };
}

export async function setCampusIssueVote(input: unknown): Promise<ActionResult<{ agreeCount: number; disagreeCount: number; userVote: "agree" | "disagree" }>> {
  const parsed = voteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose Agree or Disagree." };
  const supabase = await createClient();
  const result = await supabase.rpc("campus_fix_set_vote", { p_issue_id: parsed.data.issueId, p_vote: parsed.data.vote });
  const row = result.data?.[0];
  if (result.error || !row) return { ok: false, error: databaseError(result.error ?? {}, "Your vote could not be saved.") };
  refresh(parsed.data.issueId);
  return { ok: true, data: { agreeCount: row.agree_count, disagreeCount: row.disagree_count, userVote: row.user_vote } };
}

export async function transitionCampusIssue(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = transitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the status update." };
  const supabase = await createClient();

  let expectedVersion = parsed.data.expectedVersion;

  if (parsed.data.newStatus === "resolved") {
    const current = await supabase.from("campus_issues").select("status, version").eq("id", parsed.data.issueId).single();
    if (current.data?.status === "submitted") {
      const ack = await supabase.rpc("campus_fix_transition_issue", {
        p_issue_id: parsed.data.issueId,
        p_expected_version: expectedVersion,
        p_new_status: "acknowledged",
        p_note: "Issue acknowledged before resolution",
        p_resolution_notes: null,
        p_rejection_reason: null,
        p_estimated_resolution_at: null,
        p_evidence: [],
        p_request_id: crypto.randomUUID(),
      });
      if (ack.error) {
        return { ok: false, error: databaseError(ack.error, "Could not acknowledge issue before resolving.") };
      }
      expectedVersion += 1;
    }
  }

  const result = await supabase.rpc("campus_fix_transition_issue", {
    p_issue_id: parsed.data.issueId, p_expected_version: expectedVersion,
    p_new_status: parsed.data.newStatus, p_note: parsed.data.note,
    p_resolution_notes: parsed.data.resolutionNotes ?? null,
    p_rejection_reason: parsed.data.rejectionReason ?? null,
    p_estimated_resolution_at: parsed.data.estimatedResolutionAt ?? null,
    p_evidence: parsed.data.evidence as unknown as Json, p_request_id: parsed.data.requestId,
  });
  if (result.error || !result.data) return { ok: false, error: databaseError(result.error ?? {}, "The issue status could not be updated.") };
  await processCampusFixNotifications();
  refresh(result.data.id);
  return { ok: true, data: { id: result.data.id } };
}

export async function addCampusIssueUpdate(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = staffUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the staff update." };
  const supabase = await createClient();
  const result = await supabase.rpc("campus_fix_add_update", {
    p_issue_id: parsed.data.issueId, p_expected_version: parsed.data.expectedVersion,
    p_note: parsed.data.note, p_estimated_resolution_at: parsed.data.estimatedResolutionAt ?? null,
    p_evidence: parsed.data.evidence as unknown as Json, p_request_id: parsed.data.requestId,
  });
  if (result.error || !result.data) return { ok: false, error: databaseError(result.error ?? {}, "The staff update could not be saved.") };
  refresh(result.data.id);
  return { ok: true, data: { id: result.data.id } };
}

export async function reopenCampusIssue(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = reopenSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Add a reopen reason." };
  const supabase = await createClient();
  const result = await supabase.rpc("campus_fix_reopen_issue", { p_issue_id: parsed.data.issueId, p_reason: parsed.data.reason, p_request_id: parsed.data.requestId });
  if (result.error || !result.data) return { ok: false, error: databaseError(result.error ?? {}, "The issue could not be reopened.") };
  refresh(result.data.id);
  return { ok: true, data: { id: result.data.id } };
}

export async function resolveCampusIssue(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = resolveIssueSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid resolve request." };
  const auth = await viewer();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const requestId = crypto.randomUUID();

  // Try direct resolve RPC if available
  const directResult = await supabase.rpc("campus_fix_resolve_issue", {
    p_issue_id: parsed.data.issueId,
    p_resolution_notes: parsed.data.resolutionNotes ?? "Issue marked as resolved.",
    p_request_id: requestId,
  });

  if (!directResult.error && directResult.data) {
    await processCampusFixNotifications();
    refresh(parsed.data.issueId);
    return { ok: true, data: { id: parsed.data.issueId } };
  }

  // Fallback workflow using transition
  const { data: issue, error: issueError } = await supabase
    .from("campus_issues")
    .select("id, user_id, status, version")
    .eq("id", parsed.data.issueId)
    .single();

  if (issueError || !issue) return { ok: false, error: "Issue not found." };
  if (["resolved", "closed", "rejected"].includes(issue.status)) {
    return { ok: false, error: "This issue is already resolved or closed." };
  }

  let currentVersion = issue.version;

  // If issue is still in submitted status, transition to acknowledged first
  if (issue.status === "submitted") {
    const ackResult = await supabase.rpc("campus_fix_transition_issue", {
      p_issue_id: parsed.data.issueId,
      p_expected_version: currentVersion,
      p_new_status: "acknowledged",
      p_note: "Issue acknowledged before resolution",
      p_resolution_notes: null,
      p_rejection_reason: null,
      p_estimated_resolution_at: null,
      p_evidence: [],
      p_request_id: crypto.randomUUID(),
    });
    if (ackResult.error) {
      return { ok: false, error: databaseError(ackResult.error, "Could not acknowledge issue before resolving.") };
    }
    currentVersion += 1;
  }

  const notes = parsed.data.resolutionNotes && parsed.data.resolutionNotes.trim().length >= 10
    ? parsed.data.resolutionNotes.trim()
    : "Issue marked as resolved by authority/reporter.";

  const transitionResult = await supabase.rpc("campus_fix_transition_issue", {
    p_issue_id: parsed.data.issueId,
    p_expected_version: currentVersion,
    p_new_status: "resolved",
    p_note: "Issue marked as resolved",
    p_resolution_notes: notes,
    p_rejection_reason: null,
    p_estimated_resolution_at: null,
    p_evidence: [],
    p_request_id: requestId,
  });

  if (transitionResult.error || !transitionResult.data) {
    return { ok: false, error: databaseError(transitionResult.error ?? {}, "The issue could not be resolved.") };
  }

  await processCampusFixNotifications();
  refresh(parsed.data.issueId);
  return { ok: true, data: { id: parsed.data.issueId } };
}

export async function assignCampusIssue(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the assignment." };
  const supabase = await createClient();
  const result = await supabase.rpc("campus_fix_assign_issue", { p_issue_id: parsed.data.issueId, p_contact_id: parsed.data.contactId, p_reason: parsed.data.reason, p_request_id: parsed.data.requestId });
  if (result.error || !result.data) return { ok: false, error: databaseError(result.error ?? {}, "The issue could not be assigned.") };

  const config = getWhatsAppConfiguration();
  if (config.enabled) {
    try {
      const admin = createAdminClient();
      const { data: contact } = await admin
        .from("campus_fix_contacts")
        .select("whatsapp_number, staff_name")
        .eq("id", parsed.data.contactId)
        .maybeSingle();

      const targetNumber = config.environment.CAMPUSFIX_AUTHORITY_WHATSAPP_NUMBER || contact?.whatsapp_number;
      if (targetNumber) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
        const outcome = await sendWhatsApp({
          notificationId: result.data.id,
          to: targetNumber,
          referenceId: result.data.reference_id,
          title: `[Assigned to ${contact?.staff_name || "Authority"}] ${result.data.title}`,
          location: `${result.data.building}, ${result.data.location}`,
          priority: result.data.priority,
          issueLink: `${siteUrl}/app/campus-fix/${result.data.id}`,
        });

        if (outcome.state === "accepted") {
          await admin
            .from("campus_fix_notification_logs")
            .update({
              status: outcome.providerStatus === "queued" ? "queued" : "accepted",
              provider_message_sid: outcome.providerMessageSid,
              provider_status: outcome.providerStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("issue_id", result.data.id)
            .eq("event_type", "issue_assigned");
        }
      }
    } catch (err) {
      console.error("[CampusFix] assign notification error:", err);
    }
  }

  try {
    await processCampusFixNotifications();
  } catch (err) {
    console.warn("[CampusFix] queue processing error:", err);
  }

  refresh(result.data.id);
  return { ok: true, data: { id: result.data.id } };
}

export async function moderateCampusIssue(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = moderationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the moderation action." };
  const supabase = await createClient();
  const result = await supabase.rpc("campus_fix_moderate_issue", { p_issue_id: parsed.data.issueId, p_action: parsed.data.action, p_reason: parsed.data.reason, p_duplicate_of: parsed.data.duplicateOf ?? null, p_request_id: parsed.data.requestId });
  if (result.error || !result.data) return { ok: false, error: databaseError(result.error ?? {}, "The issue could not be moderated.") };
  refresh(result.data.id);
  return { ok: true, data: { id: result.data.id } };
}

export async function saveDepartment(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check department details." };
  const auth = await viewer();
  if (!auth.ok || auth.data.role !== "admin") return { ok: false, error: "Administrator access is required." };
  const supabase = await createClient();
  const values = { code: parsed.data.code, name: parsed.data.name, description: parsed.data.description || null, default_sla_hours: parsed.data.defaultSlaHours, is_active: parsed.data.isActive, created_by: auth.data.id, updated_at: new Date().toISOString() };
  const result = parsed.data.id
    ? await supabase.from("campus_fix_departments").update(values).eq("id", parsed.data.id).select("id").single()
    : await supabase.from("campus_fix_departments").insert(values).select("id").single();
  if (result.error) return { ok: false, error: databaseError(result.error, "The department could not be saved.") };
  refresh();
  return { ok: true, data: { id: result.data.id } };
}

export async function saveContact(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check contact details." };
  const auth = await viewer();
  if (!auth.ok || auth.data.role !== "admin") return { ok: false, error: "Administrator access is required." };
  const supabase = await createClient();
  const values = { department_id: parsed.data.departmentId, profile_id: parsed.data.profileId || null, staff_name: parsed.data.staffName, job_title: parsed.data.jobTitle || null, whatsapp_number: parsed.data.whatsappNumber || null, whatsapp_consent: parsed.data.whatsappConsent, is_active: parsed.data.isActive, created_by: auth.data.id, updated_at: new Date().toISOString() };
  const result = parsed.data.id
    ? await supabase.from("campus_fix_contacts").update(values).eq("id", parsed.data.id).select("id").single()
    : await supabase.from("campus_fix_contacts").insert(values).select("id").single();
  if (result.error) return { ok: false, error: databaseError(result.error, "The contact could not be saved.") };
  refresh();
  return { ok: true, data: { id: result.data.id } };
}

export async function saveCategoryRoute(input: unknown): Promise<ActionResult<{ category: string }>> {
  const parsed = categoryRouteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check category routing." };
  const auth = await viewer();
  if (!auth.ok || auth.data.role !== "admin") return { ok: false, error: "Administrator access is required." };
  const supabase = await createClient();
  const result = await supabase.from("campus_fix_category_routes").upsert({ category: parsed.data.category, department_id: parsed.data.departmentId, default_priority: parsed.data.defaultPriority, is_active: parsed.data.isActive, updated_by: auth.data.id, updated_at: new Date().toISOString() }).select("category").single();
  if (result.error) return { ok: false, error: databaseError(result.error, "Category routing could not be saved.") };
  refresh();
  return { ok: true, data: { category: result.data.category } };
}

export async function addContactScope(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = scopeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the assignment scope." };
  const auth = await viewer();
  if (!auth.ok || auth.data.role !== "admin") return { ok: false, error: "Administrator access is required." };
  const supabase = await createClient();
  const result = await supabase.from("campus_fix_contact_scopes").insert({ contact_id: parsed.data.contactId, category: parsed.data.category ?? null, building: parsed.data.building || null, created_by: auth.data.id }).select("id").single();
  if (result.error) return { ok: false, error: databaseError(result.error, "The contact scope could not be saved.") };
  refresh();
  return { ok: true, data: { id: result.data.id } };
}
