import type { TableRow } from "@/types/database";

export type MarketplaceListingRow = TableRow<"marketplace_listings">;

export type MarketplaceListingView = MarketplaceListingRow & {
  sellerName: string;
  isOwner: boolean;
  publicImageUrl: string | null;
};

export type PaginatedMarketplaceListings = {
  items: MarketplaceListingView[];
  page: number;
  pageCount: number;
  total: number;
};

