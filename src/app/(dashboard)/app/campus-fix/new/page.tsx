import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { IssueForm } from "@/features/campus-fix/issue-form";

export const metadata: Metadata = { title: "Report campus issue" };

export default function NewCampusIssuePage() { return <div className="space-y-8"><Link href="/app/campus-fix" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand"><ArrowLeft className="size-4" />Back to CampusFix</Link><PageHeader eyebrow="New CampusFix report" title="Report a campus issue." description="Provide an exact location and evidence so the authorized maintenance team can respond efficiently." /><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_38px_rgba(31,41,79,0.04)] sm:p-8"><IssueForm mode="create" /></section></div>; }
