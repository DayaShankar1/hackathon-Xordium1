import { Calendar, MapPin, Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { EVENT_STATUS_LABELS } from "./constants";
import { EventRegistrationButton } from "./event-registration-button";
import type { EventView } from "./types";

function formatDate(iso: string) {
  const d = new Date(iso);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { month, day, time };
}

export function EventCard({ event }: { event: EventView }) {
  const { month, day, time } = formatDate(event.starts_at);
  const isPast = new Date(event.starts_at) < new Date();
  const isFull = typeof event.capacity === "number" && event.registrationCount >= event.capacity;
  const statusInfo = EVENT_STATUS_LABELS[event.status] ?? EVENT_STATUS_LABELS.published;

  return (
    <div className="group relative flex flex-col justify-between rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition hover:border-brand/40 hover:shadow-[0_12px_28px_rgba(91,85,223,0.08)]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex flex-col items-center justify-center rounded-xl border border-brand/20 bg-brand/5 px-2.5 py-1 text-center font-bold text-brand">
              <span className="text-[10px] uppercase tracking-wider">{month}</span>
              <span className="text-base leading-none font-extrabold">{day}</span>
            </span>
            {event.clubName && (
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {event.clubName}
              </span>
            )}
          </div>
          {event.status !== "published" && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusInfo.badgeClass}`}>
              {statusInfo.label}
            </span>
          )}
        </div>

        <Link href={`/app/events/${event.id}` as Route} className="mt-3 block group-hover:text-brand">
          <h3 className="line-clamp-2 text-base font-bold text-ink transition-colors">
            {event.title}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {event.description}
        </p>

        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-slate-400" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-slate-400" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-3.5 text-slate-400" />
            <span>
              {event.registrationCount}{" "}
              {event.capacity ? `/ ${event.capacity} registered` : "registered"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
        <Link
          href={`/app/events/${event.id}` as Route}
          className="text-xs font-semibold text-slate-500 hover:text-brand"
        >
          Details &rarr;
        </Link>
        <EventRegistrationButton
          eventId={event.id}
          isRegistered={event.isRegistered}
          isFull={isFull}
          isPast={isPast}
          size="sm"
        />
      </div>
    </div>
  );
}
