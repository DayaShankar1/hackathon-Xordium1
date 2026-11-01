import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EVENT_STATUS_LABELS } from "@/features/club-connect/constants";
import { EventRegistrationButton } from "@/features/club-connect/event-registration-button";
import { getEvent, getEventViewer } from "@/features/club-connect/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const viewer = await getEventViewer();
  if (!viewer.ok) return { title: "Club Event" };
  const res = await getEvent(id, viewer.data.id, viewer.data.role);
  if (!res.ok) return { title: "Event Not Found" };
  return { title: `${res.data.title} - ClubConnect` };
}

function formatFullDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const viewer = await getEventViewer();

  if (!viewer.ok) {
    return (
      <section role="alert" className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-8 text-center">
        <h2 className="text-sm font-extrabold text-rose-800">Please sign in to view this event</h2>
        <p className="mt-2 text-sm text-rose-700">{viewer.error}</p>
      </section>
    );
  }

  const result = await getEvent(id, viewer.data.id, viewer.data.role);

  if (!result.ok) {
    notFound();
  }

  const event = result.data;
  const startInfo = formatFullDateTime(event.starts_at);
  const endInfo = event.ends_at ? formatFullDateTime(event.ends_at) : null;
  const isPast = new Date(event.starts_at) < new Date();
  const isFull = typeof event.capacity === "number" && event.registrationCount >= event.capacity;
  const statusInfo = EVENT_STATUS_LABELS[event.status] ?? EVENT_STATUS_LABELS.published;

  const capacityPct =
    event.capacity && event.capacity > 0
      ? Math.min(100, Math.round((event.registrationCount / event.capacity) * 100))
      : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/app/events"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-brand"
        >
          <ArrowLeft className="size-4" />
          Back to all events
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        {/* Header Banner */}
        <div className="border-b border-slate-100 bg-gradient-to-br from-brand/5 via-white to-slate-50/50 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {event.clubName && (
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                {event.clubName}
              </span>
            )}
            {event.clubCategory && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {event.clubCategory}
              </span>
            )}
            {event.status !== "published" && (
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-black tracking-tight text-ink sm:text-3xl">
            {event.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <EventRegistrationButton
              eventId={event.id}
              isRegistered={event.isRegistered}
              isFull={isFull}
              isPast={isPast}
              size="lg"
            />
            {event.isRegistered && (
              <span className="text-xs font-semibold text-emerald-700">
                You have confirmed your attendance!
              </span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-6 border-b border-slate-100 p-6 sm:grid-cols-3 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Calendar className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Date & Time</p>
              <p className="mt-1 text-sm font-bold text-ink">{startInfo.date}</p>
              <p className="text-xs text-slate-500">
                {startInfo.time} {endInfo ? `— ${endInfo.time}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Venue</p>
              <p className="mt-1 text-sm font-bold text-ink">{event.venue}</p>
              <p className="text-xs text-slate-500">On-campus location</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
              <Users className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Capacity</p>
              <p className="mt-1 text-sm font-bold text-ink">
                {event.registrationCount}{" "}
                {event.capacity ? `/ ${event.capacity} registered` : "attendees registered"}
              </p>
              {capacityPct !== null && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      capacityPct >= 100 ? "bg-rose-500" : capacityPct >= 75 ? "bg-amber-500" : "bg-brand"
                    }`}
                    style={{ width: `${capacityPct}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-6 sm:p-8">
          <h2 className="text-base font-bold text-ink">About this event</h2>
          <div className="mt-3 leading-relaxed whitespace-pre-wrap text-sm text-slate-600">
            {event.description}
          </div>
        </div>
      </div>
    </div>
  );
}
