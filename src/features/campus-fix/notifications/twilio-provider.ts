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
    const result = await client.messages.create({
      contentSid: environment.TWILIO_CONTENT_SID_CAMPUS_FIX,
      contentVariables: JSON.stringify({
        "1": message.referenceId,
        "2": message.title,
        "3": message.location,
        "4": message.priority,
        "5": message.issueLink,
      }),
      from: whatsappAddress(environment.TWILIO_WHATSAPP_FROM!),
      statusCallback: environment.TWILIO_STATUS_CALLBACK_URL,
      to: whatsappAddress(message.to),
    });
    return { state: "accepted", providerMessageSid: result.sid, providerStatus: result.status };
  } catch (error) {
    const providerError = error as { code?: number | string; message?: string };
    return { state: "failed", code: String(providerError.code ?? "provider_error"), message: providerError.message ?? "Twilio rejected the request." };
  }
}
