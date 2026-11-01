import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm } from "@/features/resources/resource-form";

export const metadata: Metadata = { title: "Upload a resource" };

export default function NewResourcePage() {
  return (
    <div className="space-y-8">
      <Link href="/app/resources" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand"><ArrowLeft className="size-4" />Back to Resource Hub</Link>
      <PageHeader eyebrow="New upload" title="Share an academic resource." description="Upload useful campus material with accurate subject, branch and semester details." />
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_38px_rgba(31,41,79,0.04)] sm:p-8"><ResourceForm mode="create" /></section>
    </div>
  );
}
