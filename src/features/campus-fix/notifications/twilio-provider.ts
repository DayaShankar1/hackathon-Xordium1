import "server-only";

import twilio from "twilio";

import { getWhatsAppConfiguration } from "@/lib/env.server";

import type { DeliveryOutcome, WhatsAppMessage } from "./contracts";

function whatsappAddress(value: string) {
  return value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;
}

export async function sendWhatsApp(message: WhatsAppMessage): Promise<DeliveryOutcome> {
  const configuration = getWhatsAppConfiguration();
  if (!configuration.enabled) return { state: "failed", code: configuration.reason, message: "WhatsApp delivery is not configured." };

  const { environment } = configuration;
  try {
    const client = twilio(environment.TWILIO_ACCOUNT_SID, environment.TWILIO_AUTH_TOKEN);
    const payload: Parameters<typeof client.messages.create>[0] = {
      from: whatsappAddress(environment.TWILIO_WHATSAPP_FROM!),
      to: whatsappAddress(message.to),
    };

    if (environment.TWILIO_STATUS_CALLBACK_URL) {
      payload.statusCallback = environment.TWILIO_STATUS_CALLBACK_URL;
    }

    if (environment.TWILIO_CONTENT_SID_CAMPUS_FIX) {
      payload.contentSid = environment.TWILIO_CONTENT_SID_CAMPUS_FIX;
      payload.contentVariables = JSON.stringify({
        "1": message.referenceId,
        "2": message.title,
        "3": message.location,
        "4": message.priority,
        "5": message.issueLink,
      });
    } else {
      payload.body =
        `🚨 *CampusFix Alert: ${message.referenceId}*\n\n` +
        `*Issue:* ${message.title}\n` +
        `*Location:* ${message.location}\n` +
        `*Priority:* ${message.priority.toUpperCase()}\n\n` +
        `🔗 *View issue:* ${message.issueLink}`;
    }

    const result = await client.messages.create(payload);
    return { state: "accepted", providerMessageSid: result.sid, providerStatus: result.status };
  } catch (error) {
    const providerError = error as { code?: number | string; message?: string };
    console.error("[Twilio WhatsApp] send error:", providerError.code, providerError.message);
    return { state: "failed", code: String(providerError.code ?? "provider_error"), message: providerError.message ?? "Twilio rejected the request." };
  }
}
