import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  CAMPUSFIX_WHATSAPP_ENABLED: z.enum(["true", "false"]).default("false"),
  SUPABASE_SECRET_KEY: z.string().min(20).optional(),
  TWILIO_ACCOUNT_SID: z.string().startsWith("AC").optional(),
  TWILIO_AUTH_TOKEN: z.string().min(20).optional(),
  TWILIO_WHATSAPP_FROM: z.string().min(8).optional(),
  TWILIO_CONTENT_SID_CAMPUS_FIX: z.string().startsWith("HX").optional(),
  TWILIO_STATUS_CALLBACK_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(20).optional(),
});

export function getCampusFixServerEnvironment() {
  return serverEnvironmentSchema.parse({
    CAMPUSFIX_WHATSAPP_ENABLED: process.env.CAMPUSFIX_WHATSAPP_ENABLED,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
    TWILIO_CONTENT_SID_CAMPUS_FIX: process.env.TWILIO_CONTENT_SID_CAMPUS_FIX,
    TWILIO_STATUS_CALLBACK_URL: process.env.TWILIO_STATUS_CALLBACK_URL,
    CRON_SECRET: process.env.CRON_SECRET,
  });
}

export function getWhatsAppConfiguration() {
  const environment = getCampusFixServerEnvironment();
  if (environment.CAMPUSFIX_WHATSAPP_ENABLED !== "true") return { enabled: false as const, reason: "channel_disabled" as const };
  if (!environment.SUPABASE_SECRET_KEY || !environment.TWILIO_ACCOUNT_SID || !environment.TWILIO_AUTH_TOKEN || !environment.TWILIO_WHATSAPP_FROM || !environment.TWILIO_CONTENT_SID_CAMPUS_FIX || !environment.TWILIO_STATUS_CALLBACK_URL) {
    return { enabled: false as const, reason: "configuration_missing" as const };
  }
  return { enabled: true as const, environment };
}
