import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { RESOURCE_BRANCHES, RESOURCE_SEMESTERS } from "@/features/resources/constants";
import { getResource, getResourceViewer } from "@/features/resources/queries";
import { ResourceForm } from "@/features/resources/resource-form";

export const metadata: Metadata = { title: "Edit resource" };

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [resourceResult, viewerResult] = await Promise.all([getResource(id), getResourceViewer()]);
  if (!resourceResult.ok && resourceResult.error === "Resource not found.") notFound();
  if (!resourceResult.ok || !viewerResult.ok) redirect("/app/resources");

  const resource = resourceResult.data;
  if (resource.user_id !== viewerResult.data.id || resource.is_hidden) redirect(`/app/resources/${resource.id}`);
  const branch = RESOURCE_BRANCHES.includes(resource.branch as (typeof RESOURCE_BRANCHES)[number]) ? resource.branch as (typeof RESOURCE_BRANCHES)[number] : "Other";
  const semester = RESOURCE_SEMESTERS.includes(resource.semester as (typeof RESOURCE_SEMESTERS)[number]) ? resource.semester as (typeof RESOURCE_SEMESTERS)[number] : "Other";

  return (
    <div className="space-y-8">
      <Link href={`/app/resources/${resource.id}`} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand"><ArrowLeft className="size-4" />Back to resource</Link>
      <PageHeader eyebrow="Manage upload" title="Edit resource details." description="The uploaded document is immutable; delete and upload again if the file itself is incorrect." />
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_38px_rgba(31,41,79,0.04)] sm:p-8">
        <ResourceForm mode="edit" resourceId={resource.id} initialValues={{ title: resource.title, description: resource.description ?? "", subject: resource.subject, branch, semester, resourceType: resource.resource_type }} />
      </section>
    </div>
  );
}
