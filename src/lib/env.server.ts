import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  CAMPUSFIX_WHATSAPP_ENABLED: z.enum(["true", "false"]).default("false"),
  SUPABASE_SECRET_KEY: z.string().min(20).optional(),
  TWILIO_ACCOUNT_SID: z.string().startsWith("AC").optional(),
  TWILIO_AUTH_TOKEN: z.string().min(20).optional(),
  TWILIO_WHATSAPP_FROM: z.string().min(8).optional(),
  TWILIO_CONTENT_SID_CAMPUS_FIX: z.string().optional().transform((val) => {
    if (!val || val.trim() === "" || val === "YOUR_CONTENT_SID" || !val.startsWith("HX")) return undefined;
    return val.trim();
  }),
  TWILIO_STATUS_CALLBACK_URL: z.string().optional().transform((val) => {
    if (!val || val.trim() === "" || val === "YOUR_CONTENT_SID") return undefined;
    try {
      new URL(val);
      return val.trim();
    } catch {
      return undefined;
    }
  }),
  CAMPUSFIX_AUTHORITY_WHATSAPP_NUMBER: z.string().optional().transform((val) => {
    if (!val || val.trim() === "" || val === "YOUR_WHATSAPP_NUMBER") return undefined;
    return val.trim();
  }),
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
    CAMPUSFIX_AUTHORITY_WHATSAPP_NUMBER: process.env.CAMPUSFIX_AUTHORITY_WHATSAPP_NUMBER,
    CRON_SECRET: process.env.CRON_SECRET,
  });
}

export function getWhatsAppConfiguration() {
  const environment = getCampusFixServerEnvironment();
  if (environment.CAMPUSFIX_WHATSAPP_ENABLED !== "true") return { enabled: false as const, reason: "channel_disabled" as const };
  if (!environment.SUPABASE_SECRET_KEY || !environment.TWILIO_ACCOUNT_SID || !environment.TWILIO_AUTH_TOKEN || !environment.TWILIO_WHATSAPP_FROM) {
    return { enabled: false as const, reason: "configuration_missing" as const };
  }
  return { enabled: true as const, environment };
}
