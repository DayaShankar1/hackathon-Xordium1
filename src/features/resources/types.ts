import type { TableRow } from "@/types/database";

export type ResourceView = TableRow<"resources"> & {
  uploaderName: string;
  viewUrl?: string | null;
};

export type PaginatedResources = {
  items: ResourceView[];
  page: number;
  pageCount: number;
  total: number;
};
