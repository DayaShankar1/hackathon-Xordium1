import { BellRing } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Notification center"
        title="Stay in the loop."
        description="Event updates, issue progress, and relevant activity will appear in one focused inbox."
      />
      <section className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_12px_38px_rgba(31,41,79,0.04)] sm:p-10">
        <div className="mx-auto max-w-md py-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-50 text-brand">
            <BellRing className="size-6" />
          </span>
          <h2 className="mt-5 text-lg font-extrabold tracking-[-0.02em] text-ink">No notifications yet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Real notifications will arrive here when an event changes, an issue is updated, or a campus workflow needs your attention.
          </p>
        </div>
      </section>
    </div>
  );
}
