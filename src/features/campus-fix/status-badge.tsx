import type { CampusIssuePriority, CampusIssueStatus } from "@/types/database";

import { ISSUE_STATUS_LABELS } from "./constants";

const statusStyles: Record<CampusIssueStatus, string> = {
  submitted: "bg-slate-100 text-slate-700 ring-slate-200",
  acknowledged: "bg-sky-50 text-sky-700 ring-sky-200",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  closed: "bg-slate-100 text-slate-500 ring-slate-200",
  reopened: "bg-violet-50 text-violet-700 ring-violet-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
};

const priorityStyles: Record<CampusIssuePriority, string> = {
  low: "bg-slate-50 text-slate-600",
  medium: "bg-indigo-50 text-indigo-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-rose-600 text-white",
};

export function IssueStatusBadge({ status }: { status: CampusIssueStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${statusStyles[status]}`}>{ISSUE_STATUS_LABELS[status]}</span>;
}

export function IssuePriorityBadge({ priority }: { priority: CampusIssuePriority }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${priorityStyles[priority]}`}>{priority}</span>;
}
