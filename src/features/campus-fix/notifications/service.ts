import "server-only";

export type NotificationProcessingResult =
  | { state: "configuration_missing" }
  | { state: "processed"; accepted: number; failed: number }
  | { state: "no_pending_notifications" };

export async function processCampusFixNotifications(): Promise<NotificationProcessingResult> {
  const { processNotificationQueue } = await import("./worker");
  const result = await processNotificationQueue(5);
  if (result.state === "channel_disabled" || result.state === "configuration_missing") return { state: "configuration_missing" };
  if (result.state === "no_pending_notifications") return { state: "no_pending_notifications" };
  return { state: "processed", accepted: result.accepted, failed: result.failed };
}
