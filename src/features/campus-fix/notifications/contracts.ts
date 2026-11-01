export type DeliveryOutcome =
  | { state: "accepted"; providerMessageSid: string; providerStatus: string }
  | { state: "failed"; code: string; message: string };

export type WhatsAppMessage = {
  issueLink: string;
  location: string;
  notificationId: string;
  priority: string;
  referenceId: string;
  title: string;
  to: string;
};
