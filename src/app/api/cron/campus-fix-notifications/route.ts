import { NextResponse, type NextRequest } from "next/server";

import { processNotificationQueue } from "@/features/campus-fix/notifications/worker";
import { getCampusFixServerEnvironment } from "@/lib/env.server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { CRON_SECRET } = getCampusFixServerEnvironment();
  if (!CRON_SECRET || request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await processNotificationQueue(20));
  } catch {
    return NextResponse.json({ error: "Notification processing failed." }, { status: 503 });
  }
}
