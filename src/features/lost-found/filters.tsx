import { Filter, Search, X } from "lucide-react";
import Link from "next/link";

import { LOST_FOUND_CATEGORIES } from "./constants";
import type { LostFoundFilters } from "./schemas";

const inputClass =
  "h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-semibold text-slate-600 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

export function LostFoundFilters({ filters }: { filters: LostFoundFilters }) {
  const tabs = [
    ["all", "All reports"],
    ["lost", "Lost"],
    ["found", "Found"],
    ["mine", "My reports"],
  ] as const;

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(31,41,79,0.035)] sm:p-5">
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Lost and found views">
        {tabs.map(([value, label]) => (
          <Link
            key={value}
            href={{
              pathname: "/app/lost-found",
              query: {
                ...(filters.q && { q: filters.q }),
                ...(filters.category !== "all" && { category: filters.category }),
                ...(filters.location && { location: filters.location }),
                ...(filters.status !== "active" && { status: filters.status }),
                ...(value !== "all" && { type: value }),
              },
            }}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              filters.type === value ? "bg-brand text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <form action="/app/lost-found" className="mt-4 grid gap-3 md:grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr_auto]">
        {filters.type !== "all" && <input type="hidden" name="type" value={filters.type} />}
        <label className="relative">
          <span className="sr-only">Search by item name</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search item name"
            className={`${inputClass} w-full pl-9`}
          />
        </label>
        <label>
          <span className="sr-only">Filter by category</span>
          <select name="category" defaultValue={filters.category} className={`${inputClass} w-full`}>
            <option value="all">All categories</option>
            {LOST_FOUND_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by location</span>
          <input
            name="location"
            defaultValue={filters.location}
            placeholder="Location"
            className={`${inputClass} w-full`}
          />
        </label>
        <label>
          <span className="sr-only">Filter by report status</span>
          <select name="status" defaultValue={filters.status} className={`${inputClass} w-full`}>
            <option value="active">Active</option>
            <option value="open">Open</option>
            <option value="claimed">Claimed</option>
            <option value="resolved">Resolved</option>
            <option value="all">Any status</option>
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-xs font-bold text-white transition hover:bg-slate-700"
        >
          <Filter className="size-3.5" />
          Apply
        </button>
      </form>

      {(filters.q || filters.category !== "all" || filters.location || filters.status !== "active") && (
        <Link
          href={filters.type === "all" ? "/app/lost-found" : `/app/lost-found?type=${filters.type}`}
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-rose-600"
        >
          <X className="size-3" />
          Clear filters
        </Link>
      )}
    </section>
  );
}
