import { Filter, Search, X } from "lucide-react";
import Link from "next/link";

import { RESOURCE_BRANCHES, RESOURCE_SEMESTERS, RESOURCE_TYPE_LABELS, RESOURCE_TYPES } from "./constants";
import type { ResourceFilters } from "./schemas";

const inputClass = "h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold text-slate-600 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

export function ResourceFiltersPanel({ filters }: { filters: ResourceFilters }) {
  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(31,41,79,0.035)] sm:p-5">
      <nav className="flex gap-2" aria-label="Resource views">
        {([['all', 'All resources'], ['mine', 'My uploads']] as const).map(([value, label]) => (
          <Link key={value} href={{ pathname: "/app/resources", query: value === "mine" ? { view: "mine" } : {} }} className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${filters.view === value ? "bg-brand text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>{label}</Link>
        ))}
      </nav>
      <form action="/app/resources" className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.8fr_0.75fr_0.65fr_0.8fr_auto]">
        {filters.view === "mine" && <input type="hidden" name="view" value="mine" />}
        <label className="relative"><span className="sr-only">Search title</span><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" /><input name="q" defaultValue={filters.q} placeholder="Search title" className={`${inputClass} w-full pl-9`} /></label>
        <label><span className="sr-only">Filter subject</span><input name="subject" defaultValue={filters.subject} placeholder="Subject" className={`${inputClass} w-full`} /></label>
        <select name="branch" defaultValue={filters.branch} className={`${inputClass} w-full`} aria-label="Filter branch"><option value="all">All branches</option>{RESOURCE_BRANCHES.map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select>
        <select name="semester" defaultValue={filters.semester} className={`${inputClass} w-full`} aria-label="Filter semester"><option value="all">All semesters</option>{RESOURCE_SEMESTERS.map((semester) => <option key={semester} value={semester}>{semester === "Other" ? semester : `Semester ${semester}`}</option>)}</select>
        <select name="resourceType" defaultValue={filters.resourceType} className={`${inputClass} w-full`} aria-label="Filter resource type"><option value="all">All types</option>{RESOURCE_TYPES.map((type) => <option key={type} value={type}>{RESOURCE_TYPE_LABELS[type]}</option>)}</select>
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-xs font-bold text-white transition hover:bg-slate-700"><Filter className="size-3.5" />Apply</button>
      </form>
      {(filters.q || filters.subject || filters.branch !== "all" || filters.semester !== "all" || filters.resourceType !== "all") && (
        <Link href={filters.view === "mine" ? "/app/resources?view=mine" : "/app/resources"} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-rose-600"><X className="size-3" />Clear filters</Link>
      )}
    </section>
  );
}
