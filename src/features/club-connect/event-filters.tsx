"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import type { ClubRow } from "./types";

type EventFiltersProps = {
  clubs: ClubRow[];
  currentView: string;
  currentClubId?: string;
  currentQ?: string;
};

export function EventFiltersPanel({ clubs, currentView, currentClubId, currentQ }: EventFiltersProps) {
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
      router.push(`/app/events?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchTerm || undefined });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* View Tabs */}
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
            All Events
          </button>
          <button
            type="button"
            onClick={() => updateFilters({ view: "registered" })}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              currentView === "registered"
                ? "bg-white text-ink shadow-sm"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            My RSVPs
          </button>
          <button
            type="button"
            onClick={() => updateFilters({ view: "past" })}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              currentView === "past"
                ? "bg-white text-ink shadow-sm"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            Past Events
          </button>
        </div>

        {/* Club filter */}
        <div className="flex items-center gap-2">
          {clubs.length > 0 && (
            <select
              value={currentClubId ?? ""}
              onChange={(e) => updateFilters({ clubId: e.target.value || undefined })}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm focus:border-brand focus:outline-none"
            >
              <option value="">All Clubs & Societies</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search events by title, description, or venue..."
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
