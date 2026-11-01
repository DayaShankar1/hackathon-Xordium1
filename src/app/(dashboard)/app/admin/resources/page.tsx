import { ArrowLeft, BookOpenText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { AdminResourceActions } from "@/features/resources/admin-actions";
import { RESOURCE_TYPE_LABELS } from "@/features/resources/constants";
import { getAdminResources } from "@/features/resources/queries";

export const metadata: Metadata = { title: "Resource moderation" };

export default async function AdminResourcesPage() {
  const result = await getAdminResources();
  return (
    <div className="space-y-8">
      <Link href="/app/admin" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand"><ArrowLeft className="size-4" />Back to admin panel</Link>
      <PageHeader eyebrow="Admin moderation" title="Review academic resources." description="Hide inappropriate uploads, restore reviewed material, or permanently remove resources and their files." />
      {!result.ok ? <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{result.error}</section> : result.data.length ? (
        <section className="space-y-3">{result.data.map((resource) => (
          <article key={resource.id} className="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700"><BookOpenText className="size-4" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Link href={`/app/resources/${resource.id}`} className="truncate text-sm font-extrabold text-ink hover:text-brand">{resource.title}</Link>{resource.is_hidden && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">Hidden</span>}</div><p className="mt-1 text-xs text-slate-500">{resource.subject} · {resource.branch ?? "No branch"} · {RESOURCE_TYPE_LABELS[resource.resource_type]} · {resource.uploaderName}</p>{resource.hidden_reason && <p className="mt-2 text-xs text-rose-600">Reason: {resource.hidden_reason}</p>}</div></div>
            <AdminResourceActions resourceId={resource.id} hidden={resource.is_hidden} />
          </article>
        ))}</section>
      ) : <section className="rounded-[22px] border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No resources are available for review.</section>}
    </div>
  );
}
