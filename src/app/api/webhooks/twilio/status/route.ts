import { createHash } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";
import { validateRequest } from "twilio";

import { getCampusFixServerEnvironment } from "@/lib/env.server";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const environment = getCampusFixServerEnvironment();
  if (!environment.TWILIO_AUTH_TOKEN || !environment.TWILIO_STATUS_CALLBACK_URL || !environment.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }
  if (!request.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
    return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
  }

  const form = await request.formData();
  const params = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
  const signature = request.headers.get("x-twilio-signature") ?? "";
  if (!validateRequest(environment.TWILIO_AUTH_TOKEN, signature, environment.TWILIO_STATUS_CALLBACK_URL, params)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
  }

  const sid = params.MessageSid;
  const status = params.MessageStatus ?? params.SmsStatus;
  if (!sid || !status) return NextResponse.json({ error: "Missing provider fields." }, { status: 400 });
  const eventKey = createHash("sha256").update(`${sid}:${status}:${params.ErrorCode ?? ""}`).digest("hex");
  const result = await createAdminClient().rpc("campus_fix_record_notification_event", {
    p_provider_message_sid: sid, p_event_key: eventKey, p_status: status,
    p_error_code: params.ErrorCode ?? null, p_error_message: params.ErrorMessage ?? null,
    p_provider_at: null, p_signature_verified: true,
  });
  if (result.error) return NextResponse.json({ error: "Callback persistence failed." }, { status: 500 });
  return new NextResponse(null, { status: 200 });
}
