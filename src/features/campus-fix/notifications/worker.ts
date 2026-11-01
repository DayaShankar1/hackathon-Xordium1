import "server-only";

import { getWhatsAppConfiguration } from "@/lib/env.server";
import { createAdminClient } from "@/utils/supabase/admin";

import { sendWhatsApp } from "./twilio-provider";

export async function processNotificationQueue(limit = 10) {
  const configuration = getWhatsAppConfiguration();
  if (!configuration.enabled) return { state: configuration.reason, accepted: 0, failed: 0 } as const;

  const supabase = createAdminClient();
  const claimed = await supabase.rpc("campus_fix_claim_notifications", { p_limit: limit });
  if (claimed.error) throw new Error(`Notification queue claim failed: ${claimed.error.code}`);
  if (!claimed.data?.length) return { state: "no_pending_notifications", accepted: 0, failed: 0 } as const;

  let accepted = 0;
  let failed = 0;
  for (const log of claimed.data) {
    const [issue, contact] = await Promise.all([
      supabase.from("campus_issues").select("reference_id,title,building,location,priority").eq("id", log.issue_id).single(),
      supabase.from("campus_fix_contacts").select("whatsapp_number,whatsapp_consent,is_active").eq("id", log.contact_id ?? "").single(),
    ]);

    const recipientNumber =
      configuration.environment.CAMPUSFIX_AUTHORITY_WHATSAPP_NUMBER ??
      (contact.data?.whatsapp_number && contact.data?.whatsapp_consent && contact.data?.is_active ? contact.data.whatsapp_number : null);

    if (issue.error || !recipientNumber) {
      await supabase.rpc("campus_fix_complete_notification", {
        p_notification_id: log.id, p_status: "suppressed", p_provider_message_sid: null,
        p_provider_status: null, p_error_code: "recipient_unavailable", p_error_message: "No active consented WhatsApp recipient.",
      });
      failed++;
      continue;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
    const outcome = await sendWhatsApp({
      notificationId: log.id,
      to: recipientNumber,
      referenceId: issue.data.reference_id,
      title: issue.data.title,
      location: `${issue.data.building}, ${issue.data.location}`,
      priority: issue.data.priority,
      issueLink: `${siteUrl}/app/campus-fix/${log.issue_id}`,
    });

    if (outcome.state === "accepted") {
      await supabase.rpc("campus_fix_complete_notification", {
        p_notification_id: log.id, p_status: outcome.providerStatus === "queued" ? "queued" : "accepted",
        p_provider_message_sid: outcome.providerMessageSid, p_provider_status: outcome.providerStatus,
        p_error_code: null, p_error_message: null,
      });
      accepted++;
    } else {
      await supabase.rpc("campus_fix_complete_notification", {
        p_notification_id: log.id, p_status: "failed", p_provider_message_sid: null,
        p_provider_status: null, p_error_code: outcome.code, p_error_message: outcome.message,
      });
      failed++;
    }
  }
  return { state: "processed", accepted, failed } as const;
}
