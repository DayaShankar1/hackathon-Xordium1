import { Check, DatabaseZap } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import type { CampusModule } from "@/lib/site";

export function ModuleFoundation({ module }: { module: CampusModule }) {
  const Icon = module.icon;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Campus service" title={module.title} description={module.description} />

      <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_38px_rgba(31,41,79,0.045)] sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <span className={`grid size-14 place-items-center rounded-2xl ${module.surfaceClass}`}>
              <Icon className={`size-6 ${module.iconClass}`} strokeWidth={2} />
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500">
              Foundation ready
            </span>
          </div>
          <h2 className="mt-8 text-2xl font-black tracking-[-0.035em] text-ink">A focused workspace for {module.shortTitle.toLowerCase()}.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            This route is connected to the shared application shell and ready for its Supabase-backed create, list, and detail workflows.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {module.features.map((feature) => (
              <div key={feature} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-[24px] border border-dashed border-slate-300 bg-white/60 p-6 sm:p-8">
          <span className="grid size-11 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <DatabaseZap className="size-5" />
          </span>
          <h2 className="mt-6 text-lg font-extrabold tracking-[-0.02em] text-ink">Waiting for live campus data</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            No records are being simulated. Data will appear here only after the Supabase project is configured and the persistence workflow is implemented.
          </p>
        </aside>
      </section>
    </div>
  );
}
