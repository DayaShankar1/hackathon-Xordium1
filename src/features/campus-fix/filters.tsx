import { Filter, Search, X } from "lucide-react";
import Link from "next/link";

import { ISSUE_CATEGORIES, ISSUE_PRIORITIES, ISSUE_STATUS_LABELS } from "./constants";
import type { IssueFilters } from "./schemas";

const inputClass = "h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold text-slate-600 outline-none focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

export function CampusFixFilters({ filters }: { filters: IssueFilters }) {
  return <section className="rounded-[22px] border border-slate-200 bg-white p-4 sm:p-5">
    <nav className="flex gap-2"><Link href="/app/campus-fix" className={`rounded-xl px-3.5 py-2 text-xs font-bold ${filters.view === "all" ? "bg-brand text-white" : "bg-slate-50 text-slate-500"}`}>Campus issues</Link><Link href="/app/campus-fix?view=mine" className={`rounded-xl px-3.5 py-2 text-xs font-bold ${filters.view === "mine" ? "bg-brand text-white" : "bg-slate-50 text-slate-500"}`}>My reports</Link></nav>
    <form action="/app/campus-fix" className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.75fr_0.65fr_0.65fr_0.7fr_auto]">
      {filters.view === "mine" && <input type="hidden" name="view" value="mine" />}
      <label className="relative"><span className="sr-only">Search issues</span><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><input name="q" defaultValue={filters.q} placeholder="Search title or description" className={`${inputClass} w-full pl-9`} /></label>
      <select name="category" defaultValue={filters.category} className={inputClass} aria-label="Category"><option value="all">All categories</option>{ISSUE_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      <select name="priority" defaultValue={filters.priority} className={inputClass} aria-label="Priority"><option value="all">Any priority</option>{ISSUE_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
      <select name="status" defaultValue={filters.status} className={inputClass} aria-label="Status"><option value="all">Any status</option>{Object.entries(ISSUE_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select name="sort" defaultValue={filters.sort} className={inputClass} aria-label="Sort"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="supported">Most supported</option><option value="priority">Priority</option></select>
      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-xs font-bold text-white"><Filter className="size-3.5" />Apply</button>
      <input name="building" defaultValue={filters.building} placeholder="Building" className={inputClass} />
      <input name="location" defaultValue={filters.location} placeholder="Room / location" className={inputClass} />
      <input type="date" name="dateFrom" defaultValue={filters.dateFrom} className={inputClass} aria-label="From date" />
      <input type="date" name="dateTo" defaultValue={filters.dateTo} className={inputClass} aria-label="To date" />
    </form>
    {(filters.q || filters.category !== "all" || filters.building || filters.location || filters.priority !== "all" || filters.status !== "all" || filters.dateFrom || filters.dateTo) && <Link href={filters.view === "mine" ? "/app/campus-fix?view=mine" : "/app/campus-fix"} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-rose-600"><X className="size-3" />Clear filters</Link>}
  </section>;
}
