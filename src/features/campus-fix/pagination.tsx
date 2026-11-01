import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { IssueFilters } from "./schemas";

function href(filters: IssueFilters, page: number) { return { pathname: "/app/campus-fix" as const, query: { ...(filters.q && { q: filters.q }), ...(filters.category !== "all" && { category: filters.category }), ...(filters.building && { building: filters.building }), ...(filters.location && { location: filters.location }), ...(filters.priority !== "all" && { priority: filters.priority }), ...(filters.status !== "all" && { status: filters.status }), ...(filters.dateFrom && { dateFrom: filters.dateFrom }), ...(filters.dateTo && { dateTo: filters.dateTo }), ...(filters.sort !== "newest" && { sort: filters.sort }), ...(filters.view === "mine" && { view: "mine" }), ...(page > 1 && { page: String(page) }) } }; }

export function CampusFixPagination({ filters, pageCount }: { filters: IssueFilters; pageCount: number }) {
  if (pageCount <= 1) return null;
  return <nav className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">{filters.page > 1 ? <Link href={href(filters, filters.page - 1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600"><ChevronLeft className="size-4" />Previous</Link> : <span />}<span className="text-xs text-slate-400">Page {Math.min(filters.page, pageCount)} of {pageCount}</span>{filters.page < pageCount ? <Link href={href(filters, filters.page + 1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">Next<ChevronRight className="size-4" /></Link> : <span />}</nav>;
}
