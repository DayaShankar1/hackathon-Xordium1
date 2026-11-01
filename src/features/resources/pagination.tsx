import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { ResourceFilters } from "./schemas";

function href(filters: ResourceFilters, page: number) {
  return { pathname: "/app/resources" as const, query: { ...(filters.q && { q: filters.q }), ...(filters.subject && { subject: filters.subject }), ...(filters.branch !== "all" && { branch: filters.branch }), ...(filters.semester !== "all" && { semester: filters.semester }), ...(filters.resourceType !== "all" && { resourceType: filters.resourceType }), ...(filters.view === "mine" && { view: "mine" }), ...(page > 1 && { page: String(page) }) } };
}

export function ResourcePagination({ filters, pageCount }: { filters: ResourceFilters; pageCount: number }) {
  if (pageCount <= 1) return null;
  return (
    <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3" aria-label="Pagination">
      {filters.page > 1 ? <Link href={href(filters, filters.page - 1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand"><ChevronLeft className="size-4" />Previous</Link> : <span />}
      <span className="text-xs font-semibold text-slate-400">Page {Math.min(filters.page, pageCount)} of {pageCount}</span>
      {filters.page < pageCount ? <Link href={href(filters, filters.page + 1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand">Next<ChevronRight className="size-4" /></Link> : <span />}
    </nav>
  );
}
