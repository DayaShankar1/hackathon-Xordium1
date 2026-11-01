import { Building2, MapPin, ThumbsUp } from "lucide-react";
import Link from "next/link";

import { ISSUE_CATEGORIES } from "./constants";
import { IssuePriorityBadge, IssueStatusBadge } from "./status-badge";
import type { CampusIssueView } from "./types";

export function IssueCard({ issue, compact = false }: { issue: CampusIssueView; compact?: boolean }) {
  const category = ISSUE_CATEGORIES.find((item) => item.value === issue.category)?.label ?? issue.category;
  return (
    <Link href={`/app/campus-fix/${issue.id}`} className={`group block rounded-[20px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(31,41,79,0.04)] transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-card ${compact ? "p-4" : "p-5"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex gap-2"><IssueStatusBadge status={issue.status} /><IssuePriorityBadge priority={issue.priority} /></div><span className="text-[10px] font-bold text-slate-400">{issue.reference_id}</span></div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">{category}</p>
      <h3 className={`mt-1.5 font-extrabold tracking-[-0.02em] text-ink ${compact ? "line-clamp-1 text-sm" : "line-clamp-2 text-base"}`}>{issue.title}</h3>
      {!compact && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{issue.description}</p>}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-500"><span className="flex items-center gap-1.5"><Building2 className="size-3.5 text-slate-400" />{issue.building}</span><span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-slate-400" />{issue.location}</span><span className="flex items-center gap-1.5"><ThumbsUp className="size-3.5 text-slate-400" />{issue.agree_count} agree</span></div>
      <p className="mt-4 text-[10px] text-slate-400">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(issue.created_at))} · {issue.reporter_name}</p>
    </Link>
  );
}
