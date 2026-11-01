import type { TableRow } from "@/types/database";

export type ClubRow = TableRow<"clubs">;
export type EventRow = TableRow<"events">;
export type EventRegistrationRow = TableRow<"event_registrations">;

export type EventView = EventRow & {
  clubName: string | null;
  clubCategory: string | null;
  registrationCount: number;
  isRegistered: boolean;
  isOwnerOrAdmin: boolean;
};

export type PaginatedEvents = {
  items: EventView[];
  page: number;
  pageCount: number;
  total: number;
};

