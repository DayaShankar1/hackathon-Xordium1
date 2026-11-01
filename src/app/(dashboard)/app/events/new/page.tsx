import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { EventForm } from "@/features/club-connect/event-form";
import { getClubs, getEventViewer } from "@/features/club-connect/queries";

export const metadata: Metadata = { title: "Publish New Event - ClubConnect" };

export default async function NewEventPage() {
  const viewer = await getEventViewer();

  if (!viewer.ok) {
    redirect("/login");
  }

  // If student tries to access, verify or redirect
  if (viewer.data.role !== "admin") {
    return (
      <section role="alert" className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <h2 className="text-base font-extrabold text-amber-900">Restricted Action</h2>
        <p className="mt-2 text-sm text-amber-800">
          Publishing campus events currently requires administrative permissions. Contact your campus club coordinator.
        </p>
        <Link
          href="/app/events"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-amber-900 px-4 text-xs font-bold text-white"
        >
          Return to Events
        </Link>
      </section>
    );
  }

  const clubsResult = await getClubs();
  const clubs = clubsResult.ok ? clubsResult.data : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/app/events"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-brand"
        >
          <ArrowLeft className="size-4" />
          Back to events
        </Link>
      </div>

      <PageHeader
        eyebrow="ClubConnect"
        title="Publish Campus Event"
        description="Share an upcoming club meetup, competition, workshop, or festival with the student body."
      />

      <EventForm clubs={clubs} />
    </div>
  );
}
