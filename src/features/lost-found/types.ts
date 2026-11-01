import type { TableRow } from "@/types/database";

export type LostFoundImage = {
  id: string;
  objectPath: string;
  signedUrl: string | null;
  sortOrder: number;
};

export type LostFoundItemView = TableRow<"lost_found_items"> & {
  images: LostFoundImage[];
  reporterName: string;
};

export type LostFoundClaimView = TableRow<"lost_found_claims"> & {
  claimantName: string;
};

export type PaginatedLostFoundItems = {
  items: LostFoundItemView[];
  page: number;
  pageCount: number;
  total: number;
};
