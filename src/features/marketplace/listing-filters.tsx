"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { ITEM_CONDITIONS, MARKETPLACE_CATEGORIES } from "./constants";

type MarketplaceFiltersProps = {
  currentView: string;
  currentCategory?: string;
  currentCondition?: string;
  currentQ?: string;
};

export function MarketplaceFiltersPanel({
  currentView,
  currentCategory,
  currentCondition,
  currentQ,
}: MarketplaceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(currentQ ?? "");

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    params.delete("page");
    startTransition(() => {
      router.push(`/app/marketplace?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchTerm || undefined });
  };

  return (
    <div className="space-y-4">
      {/* View Tabs & Selectors */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => updateFilters({ view: "all" })}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              currentView === "all"
                ? "bg-white text-ink shadow-sm"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            All Items
          </button>
          <button
            type="button"
            onClick={() => updateFilters({ view: "mine" })}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              currentView === "mine"
                ? "bg-white text-ink shadow-sm"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            My Listings
          </button>
          <button
            type="button"
            onClick={() => updateFilters({ view: "sold" })}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              currentView === "sold"
                ? "bg-white text-ink shadow-sm"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            Sold Out
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={currentCategory ?? ""}
            onChange={(e) => updateFilters({ category: e.target.value || undefined })}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm focus:border-brand focus:outline-none"
          >
            <option value="">All Categories</option>
            {MARKETPLACE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Condition Dropdown */}
          <select
            value={currentCondition ?? ""}
            onChange={(e) => updateFilters({ condition: e.target.value || undefined })}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm focus:border-brand focus:outline-none"
          >
            <option value="">Any Condition</option>
            {ITEM_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search items for sale (e.g. calculator, cycle, semester 4 textbook)..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-10 text-sm text-ink placeholder:text-slate-400 shadow-sm focus:border-brand focus:outline-none"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              updateFilters({ q: undefined });
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        )}
      </form>
    </div>
  );
}
