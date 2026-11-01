import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { LOST_FOUND_CATEGORIES } from "@/features/lost-found/constants";
import { getLostFoundItem, getLostFoundViewer } from "@/features/lost-found/queries";
import { ReportForm } from "@/features/lost-found/report-form";

export const metadata: Metadata = { title: "Edit report" };

export default async function EditLostFoundReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [itemResult, viewerResult] = await Promise.all([getLostFoundItem(id), getLostFoundViewer()]);

  if (!itemResult.ok && itemResult.error === "Report not found.") notFound();
  if (!itemResult.ok || !viewerResult.ok) redirect("/app/lost-found");

  const item = itemResult.data;
  if (item.user_id !== viewerResult.data.id || item.status === "resolved") redirect(`/app/lost-found/${item.id}`);

  const category = LOST_FOUND_CATEGORIES.includes(item.category as (typeof LOST_FOUND_CATEGORIES)[number])
    ? (item.category as (typeof LOST_FOUND_CATEGORIES)[number])
    : "Other";

  return (
    <div className="space-y-8">
      <Link href={`/app/lost-found/${item.id}`} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand">
        <ArrowLeft className="size-4" />
        Back to report
      </Link>
      <PageHeader
        eyebrow="Manage report"
        title="Edit item details."
        description="Existing photographs remain attached. Resolve the report once the item has been returned or recovered."
      />
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_38px_rgba(31,41,79,0.04)] sm:p-8">
        <ReportForm
          mode="edit"
          reportId={item.id}
          initialValues={{
            itemType: item.item_type,
            title: item.title,
            description: item.description,
            category,
            location: item.location,
            incidentDate: item.incident_date ?? "",
          }}
        />
      </section>
    </div>
  );
}
