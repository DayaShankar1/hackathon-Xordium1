import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { IssueForm } from "@/features/campus-fix/issue-form";
import { getCampusIssue } from "@/features/campus-fix/queries";

export const metadata: Metadata = { title: "Edit CampusFix issue" };

export default async function EditCampusIssuePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const result = await getCampusIssue(id); if (!result.ok && result.error === "Issue not found.") notFound(); if (!result.ok) redirect("/app/campus-fix"); const issue = result.data; if (!issue.isReporter || issue.status !== "submitted" || issue.moderation_status !== "visible") redirect(`/app/campus-fix/${issue.id}`); return <div className="space-y-8"><Link href={`/app/campus-fix/${issue.id}`} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500"><ArrowLeft className="size-4" />Back to issue</Link><PageHeader eyebrow="Edit submitted issue" title="Update issue details." description="Category and reporter privacy remain fixed after submission." /><section className="rounded-[24px] border border-slate-200 bg-white p-5 sm:p-8"><IssueForm mode="edit" issueId={issue.id} initialValues={{ title: issue.title, description: issue.description, category: issue.category, building: issue.building, location: issue.location, priority: issue.priority, isAnonymous: issue.is_anonymous, notifyAuthority: issue.notify_authority }} /></section></div>; }
