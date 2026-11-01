import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { ReportForm } from "@/features/lost-found/report-form";

export const metadata: Metadata = { title: "Report an item" };

export default function NewLostFoundReportPage() {
  return (
    <div className="space-y-8">
      <Link href="/app/lost-found" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand">
        <ArrowLeft className="size-4" />
        Back to Lost & Found
      </Link>
      <PageHeader
        eyebrow="New report"
        title="Report a lost or found item."
        description="Add clear campus details. Private ownership evidence belongs in the claim flow, not the public description."
      />
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_38px_rgba(31,41,79,0.04)] sm:p-8">
        <ReportForm mode="create" />
      </section>
    </div>
  );
}
