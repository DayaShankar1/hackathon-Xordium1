import { Activity, CalendarCog, ListChecks, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Admin Panel" };

const adminAreas = [
  {
    title: "CampusFix queue",
    description: "Review incoming issues and maintain an accountable status history.",
    icon: ListChecks,
  },
  {
    title: "Event management",
    description: "Publish campus events and monitor registration capacity.",
    icon: CalendarCog,
  },
  {
    title: "Content moderation",
    description: "Review reports, resources, and listings without weakening RLS.",
    icon: ShieldCheck,
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Restricted workspace"
        title="Campus operations, clearly managed."
        description="This route performs a server-side role check in addition to database-level RLS policies."
        action={<div className="flex flex-wrap gap-2"><Link href="/app/admin/resources" className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">Moderate resources</Link><Link href="/app/admin/campus-fix" className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white">Manage CampusFix</Link></div>}
      />

      <section className="rounded-[24px] bg-[#24234d] p-6 text-white shadow-[0_20px_55px_rgba(35,35,77,0.16)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-indigo-200">Admin foundation active</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em]">No administrative totals are being fabricated.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/65">
              Real counts and activity will be loaded from Supabase as each module workflow is implemented.
            </p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-indigo-200">
            <Activity className="size-5" />
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {adminAreas.map((area) => {
          const Icon = area.icon;

          return (
            <article key={area.title} className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(31,41,79,0.04)]">
              <span className="grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-600">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-5 text-base font-extrabold text-ink">{area.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{area.description}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
