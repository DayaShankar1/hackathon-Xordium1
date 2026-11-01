import { CheckCircle2, CircleDot } from "lucide-react";

import { ISSUE_STATUS_LABELS } from "./constants";
import type { TimelineView } from "./types";

export function StatusTimeline({ timeline }: { timeline: TimelineView[] }) {
  if (!timeline.length) return <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500">No timeline entries are available.</p>;
  return <ol className="space-y-0">{timeline.map((entry, index) => <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">{index < timeline.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-slate-200" />}<span className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full ${index === timeline.length - 1 ? "bg-brand text-white" : "bg-slate-100 text-slate-500"}`}>{entry.event_type === "status_changed" ? <CheckCircle2 className="size-4" /> : <CircleDot className="size-4" />}</span><div className="pt-1"><p className="text-xs font-extrabold text-slate-800">{entry.event_type === "status_changed" ? `${entry.old_status ? ISSUE_STATUS_LABELS[entry.old_status] : "Created"} → ${ISSUE_STATUS_LABELS[entry.new_status]}` : entry.event_type.replaceAll("_", " ")}</p>{entry.note && <p className="mt-1 text-sm leading-6 text-slate-600">{entry.note}</p>}<p className="mt-1 text-[10px] text-slate-400">{entry.actorName} · {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.created_at))}</p></div></li>)}</ol>;
}
