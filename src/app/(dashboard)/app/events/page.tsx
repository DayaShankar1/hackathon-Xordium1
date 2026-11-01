import { CalendarDays, Plus } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { EventCard } from "@/features/club-connect/event-card";
import { EventFiltersPanel } from "@/features/club-connect/event-filters";
import { getClubs, getEvents, getEventViewer } from "@/features/club-connect/queries";
import { eventFiltersSchema } from "@/features/club-connect/schemas";

export const metadata: Metadata = { title: "ClubConnect - Events & Activities" };

type SearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function EventsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const filters = eventFiltersSchema.parse({
    q: first(raw.q),
    category: first(raw.category),
    clubId: first(raw.clubId),
    view: first(raw.view),
    page: first(raw.page),
  });

  const viewer = await getEventViewer();
  if (!viewer.ok) {
    return (
      <section role="alert" className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-8 text-center">
        <h2 className="text-sm font-extrabold text-rose-800">ClubConnect could not load</h2>
        <p className="mt-2 text-sm text-rose-700">{viewer.error}</p>
      </section>
    );
  }

  const [clubsResult, eventsResult] = await Promise.all([
    getClubs(),
    getEvents(filters, viewer.data.id, viewer.data.role),
  ]);

  const clubs = clubsResult.ok ? clubsResult.data : [];
  const events = eventsResult.ok ? eventsResult.data.items : [];
  const total = eventsResult.ok ? eventsResult.data.total : 0;
  const isAdmin = viewer.data.role === "admin";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Campus Life"
        title="ClubConnect"
        description="Discover clubs, participate in campus activities, and RSVP to upcoming events."
        action={
          isAdmin ? (
            <Link
              href={"/app/events/new" as Route}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(91,85,223,0.24)] transition hover:bg-brand-strong"
            >
              <Plus className="size-4" />
              Host event
            </Link>
          ) : undefined
        }
      />

      <EventFiltersPanel
        clubs={clubs}
        currentView={filters.view}
        currentClubId={filters.clubId}
        currentQ={filters.q}
      />

      {!eventsResult.ok ? (
        <section role="alert" className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-8 text-center">
          <h2 className="text-sm font-extrabold text-rose-800">Events could not load</h2>
          <p className="mt-2 text-sm text-rose-700">{eventsResult.error}</p>
        </section>
      ) : events.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500">
            {total} {total === 1 ? "event" : "events"}{" "}
            {filters.view === "registered" ? "registered" : filters.view === "past" ? "concluded" : "upcoming"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      ) : (
        <section className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <CalendarDays className="size-6" />
          </span>
          <h2 className="mt-5 text-lg font-extrabold text-ink">
            {filters.view === "registered"
              ? "You haven't RSVP'd to any events yet"
              : "No campus events found"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {filters.view === "registered"
              ? "Browse all events and click 'Register Now' on activities you want to attend."
              : "Check back later or adjust your search filters to find exciting campus activities."}
          </p>
          {filters.view === "registered" && (
            <Link
              href="/app/events"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-brand px-4 text-xs font-bold text-white transition hover:bg-brand-strong"
            >
              Explore all events
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
