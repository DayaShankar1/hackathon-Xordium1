import { AlertTriangle, CheckCircle2, Clock3, Eye, ListChecks, Wrench } from "lucide-react";

import type { CampusFixStats } from "./types";

export function CampusFixStatsGrid({ stats }: { stats: CampusFixStats }) {
  const items = [
    ["Total issues", stats.total, ListChecks, "bg-indigo-50 text-indigo-700"],
    ["Pending", stats.pending, Clock3, "bg-slate-100 text-slate-700"],
    ["Acknowledged", stats.acknowledged, Eye, "bg-sky-50 text-sky-700"],
    ["In progress", stats.inProgress, Wrench, "bg-amber-50 text-amber-700"],
    ["Resolved", stats.resolved, CheckCircle2, "bg-emerald-50 text-emerald-700"],
    ["Overdue", stats.overdue, AlertTriangle, "bg-rose-50 text-rose-700"],
  ] as const;
  return <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{items.map(([label, value, Icon, style]) => <article key={label} className="rounded-[18px] border border-slate-200 bg-white p-4"><span className={`grid size-9 place-items-center rounded-xl ${style}`}><Icon className="size-4" /></span><p className="mt-4 text-2xl font-black tracking-[-0.04em] text-ink">{value}</p><p className="mt-1 text-[11px] font-semibold text-slate-500">{label}</p></article>)}</section>;
}
