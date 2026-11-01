import { Inbox, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { CampusFixFilters } from "@/features/campus-fix/filters";
import { IssueCard } from "@/features/campus-fix/issue-card";
import { CampusFixPagination } from "@/features/campus-fix/pagination";
import { getCampusFixDashboard, getCampusFixViewer } from "@/features/campus-fix/queries";
import { CampusFixRealtimeRefresh } from "@/features/campus-fix/realtime-refresh";
import { issueFiltersSchema } from "@/features/campus-fix/schemas";
import { CampusFixStatsGrid } from "@/features/campus-fix/stats-grid";
import type { CampusIssueView } from "@/features/campus-fix/types";

export const metadata: Metadata = { title: "CampusFix" };
type SearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function CampusFixPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const filters = issueFiltersSchema.parse({ q: first(raw.q), category: first(raw.category), building: first(raw.building), location: first(raw.location), priority: first(raw.priority), status: first(raw.status), dateFrom: first(raw.dateFrom), dateTo: first(raw.dateTo), sort: first(raw.sort), view: first(raw.view), page: first(raw.page) });
  const viewer = await getCampusFixViewer();
  if (!viewer.ok) return <DataError message={viewer.error} />;
  const result = await getCampusFixDashboard(filters, viewer.data.id);
  if (!result.ok) return <DataError message={result.error} />;
  const dashboard = result.data;
  return <div className="space-y-8"><CampusFixRealtimeRefresh /><PageHeader eyebrow="Campus issue reporting" title="CampusFix" description="Report infrastructure problems, confirm community impact and follow accountable resolution updates." action={<Link href="/app/campus-fix/new" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(91,85,223,0.24)]"><Plus className="size-4" />Report an issue</Link>} /><CampusFixStatsGrid stats={dashboard.stats} /><CampusFixFilters filters={filters} />
    {(dashboard.recent.length > 0 || dashboard.critical.length > 0 || dashboard.mostSupported.length > 0 || dashboard.recentlyResolved.length > 0) && <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><IssueSection title="Recent issues" items={dashboard.recent} /><IssueSection title="Critical issues" items={dashboard.critical} /><IssueSection title="Most supported" items={dashboard.mostSupported} /><IssueSection title="Recently resolved" items={dashboard.recentlyResolved} /></section>}
    <section><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold text-ink">{filters.view === "mine" ? "My reported issues" : "Campus issue feed"}</h2><span className="text-xs text-slate-400">{dashboard.total} issues</span></div>{dashboard.items.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{dashboard.items.map((issue) => <IssueCard key={issue.id} issue={issue} />)}</div> : <div className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center"><Inbox className="mx-auto size-8 text-slate-300" /><h3 className="mt-4 text-lg font-extrabold text-ink">No matching issues</h3><p className="mt-2 text-sm text-slate-500">Adjust the filters or submit a campus issue.</p></div>}</section><CampusFixPagination filters={filters} pageCount={dashboard.pageCount} /></div>;
}

function IssueSection({ title, items }: { title: string; items: CampusIssueView[] }) {
  return <article className="rounded-[22px] border border-slate-200 bg-slate-50/50 p-4"><h2 className="mb-3 text-sm font-extrabold text-ink">{title}</h2><div className="space-y-3">{items.slice(0, 3).map((issue) => <IssueCard key={issue.id} issue={issue} compact />)}</div></article>;
}

function DataError({ message }: { message: string }) { return <section role="alert" className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-8 text-center text-sm text-rose-700">{message}</section>; }
