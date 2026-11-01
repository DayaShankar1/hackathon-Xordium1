import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { LostFoundFilters } from "./schemas";

function pageHref(filters: LostFoundFilters, page: number) {
  return {
    pathname: "/app/lost-found" as const,
    query: {
      ...(filters.q && { q: filters.q }),
      ...(filters.category !== "all" && { category: filters.category }),
      ...(filters.location && { location: filters.location }),
      ...(filters.type !== "all" && { type: filters.type }),
      ...(filters.status !== "active" && { status: filters.status }),
      ...(page > 1 && { page: String(page) }),
    },
  };
}

export function Pagination({ filters, pageCount }: { filters: LostFoundFilters; pageCount: number }) {
  if (pageCount <= 1) return null;

  return (
    <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3" aria-label="Pagination">
      {filters.page > 1 ? (
        <Link href={pageHref(filters, filters.page - 1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand">
          <ChevronLeft className="size-4" />
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-xs font-semibold text-slate-400">
        Page {Math.min(filters.page, pageCount)} of {pageCount}
      </span>
      {filters.page < pageCount ? (
        <Link href={pageHref(filters, filters.page + 1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand">
          Next
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
