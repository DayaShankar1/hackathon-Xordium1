import { ShieldCheck, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { IssueCard } from "@/features/campus-fix/issue-card";
import { getCampusFixStaffIssues } from "@/features/campus-fix/queries";

export const metadata: Metadata = { title: "CampusFix staff queue" };

export default async function CampusFixStaffPage() {
  const result = await getCampusFixStaffIssues();
  return <div className="space-y-8"><PageHeader eyebrow="Authorized staff workspace" title="CampusFix assigned queue." description="Only issues covered by your active assignment or department scope are manageable here." />{!result.ok ? <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{result.error}</section> : result.data.length ? <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{result.data.map((issue) => <IssueCard key={issue.id} issue={issue} />)}</section> : <section className="rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center"><Wrench className="mx-auto size-7 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-700">No active issues match your staff scope.</p></section>}<Link href="/app/campus-fix" className="inline-flex items-center gap-2 text-xs font-bold text-brand"><ShieldCheck className="size-4" />Open campus issue feed</Link></div>;
}
