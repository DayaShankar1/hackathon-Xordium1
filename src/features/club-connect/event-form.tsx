"use client";

import { AlertCircle, CalendarDays, Loader2, MapPin, Users } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createEvent } from "./actions";
import type { ClubRow } from "./types";

export function EventForm({ clubs }: { clubs: ClubRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [clubId, setClubId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await createEvent({
        title,
        description,
        venue,
        clubId: clubId || null,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        capacity: capacity ? parseInt(capacity, 10) : null,
      });

      if (!res.ok) {
        setErrorMessage(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      } else {
        router.push(`/app/events/${res.data.id}` as Route);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="size-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-ink">Event Information</h2>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Event Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Annual Hackathon 2026 / Winter Cultural Night"
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
          />
          {fieldErrors.title && <p className="mt-1 text-xs text-rose-600">{fieldErrors.title[0]}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Organizing Club / Society
            </label>
            <select
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-ink focus:border-brand focus:outline-none"
            >
              <option value="">General Campus Event (No Club)</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category || "General"})
                </option>
              ))}
            </select>
            {fieldErrors.clubId && <p className="mt-1 text-xs text-rose-600">{fieldErrors.clubId[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Venue / Location <span className="text-rose-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Main Auditorium, Room 302, Football Ground"
                className="h-11 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
              />
            </div>
            {fieldErrors.venue && <p className="mt-1 text-xs text-rose-600">{fieldErrors.venue[0]}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Starts At <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-ink focus:border-brand focus:outline-none"
            />
            {fieldErrors.startsAt && <p className="mt-1 text-xs text-rose-600">{fieldErrors.startsAt[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Ends At (Optional)
            </label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-ink focus:border-brand focus:outline-none"
            />
            {fieldErrors.endsAt && <p className="mt-1 text-xs text-rose-600">{fieldErrors.endsAt[0]}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Capacity (Max Attendees)
          </label>
          <div className="relative mt-1.5 max-w-xs">
            <Users className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Leave blank for unlimited"
              className="h-11 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Leave blank if the event does not have an RSVP limit.
          </p>
          {fieldErrors.capacity && <p className="mt-1 text-xs text-rose-600">{fieldErrors.capacity[0]}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Description & Details <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Share details about the event schedule, rules, eligibility, what to bring, etc."
            className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none"
          />
          {fieldErrors.description && <p className="mt-1 text-xs text-rose-600">{fieldErrors.description[0]}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-6 text-sm font-bold text-white shadow-sm transition hover:bg-brand-strong disabled:opacity-60"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <CalendarDays className="size-4" />}
          Publish Event
        </button>
      </div>
    </form>
  );
}
