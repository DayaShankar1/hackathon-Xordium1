import { ArrowLeft, BookOpenText, Download, ExternalLink, FileText, GraduationCap, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ResourceOwnerActions } from "@/features/resources/owner-actions";
import { getResource, getResourceViewer } from "@/features/resources/queries";
import { RESOURCE_TYPE_LABELS } from "@/features/resources/constants";

export const metadata: Metadata = { title: "Resource details" };

function formatSize(value: number | null) {
  if (!value) return "Unavailable";
  return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`;
}

export default async function ResourceDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ file?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const [resourceResult, viewerResult] = await Promise.all([getResource(id), getResourceViewer()]);

  if (!resourceResult.ok && resourceResult.error === "Resource not found.") notFound();
  if (!resourceResult.ok) return <DataError message={resourceResult.error} />;
  if (!viewerResult.ok) return <DataError message={viewerResult.error} />;

  const resource = resourceResult.data;
  const isOwner = resource.user_id === viewerResult.data.id;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/app/resources" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand"><ArrowLeft className="size-4" />Back to Resource Hub</Link>
        {isOwner && <ResourceOwnerActions resourceId={resource.id} />}
      </div>
      {query.file === "unavailable" && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">This uploaded file is unavailable or has been removed.</div>}
      {resource.is_hidden && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">This resource is hidden from other students.{resource.hidden_reason ? ` Reason: ${resource.hidden_reason}` : ""}</div>}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_38px_rgba(31,41,79,0.04)] sm:p-8">
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700">{RESOURCE_TYPE_LABELS[resource.resource_type]}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">Semester {resource.semester ?? "N/A"}</span></div>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">{resource.subject}</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-ink">{resource.title}</h1>
          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">{resource.description ?? "No description provided."}</p>
          <dl className="mt-7 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <div className="flex items-center gap-3"><GraduationCap className="size-4 text-brand" /><div><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Branch</dt><dd className="mt-0.5 text-sm font-bold text-slate-700">{resource.branch ?? "Unavailable"}</dd></div></div>
            <div className="flex items-center gap-3"><UserRound className="size-4 text-brand" /><div><dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Uploaded by</dt><dd className="mt-0.5 text-sm font-bold text-slate-700">{resource.uploaderName}</dd></div></div>
          </dl>
        </article>
        <aside className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-7">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><FileText className="size-5" /></span>
          <h2 className="mt-5 text-lg font-extrabold text-ink">Document</h2>
          <dl className="mt-4 space-y-3 text-xs"><div><dt className="font-bold text-slate-400">File name</dt><dd className="mt-1 break-all font-semibold text-slate-700">{resource.file_name}</dd></div><div><dt className="font-bold text-slate-400">File size</dt><dd className="mt-1 font-semibold text-slate-700">{formatSize(resource.file_size_bytes)}</dd></div><div><dt className="font-bold text-slate-400">Uploaded</dt><dd className="mt-1 font-semibold text-slate-700">{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(resource.created_at))}</dd></div></dl>
          {resource.viewUrl ? (
            <div className="mt-6 grid gap-2">
              <a href={resource.viewUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white"><ExternalLink className="size-4" />View file</a>
              <Link href={`/app/resources/${resource.id}/download`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600"><Download className="size-4" />Download</Link>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500"><BookOpenText className="mx-auto size-5 text-slate-400" /><p className="mt-2">The uploaded file is currently unavailable.</p></div>
          )}
        </aside>
      </section>
    </div>
  );
}

function DataError({ message }: { message: string }) {
  return <section role="alert" className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-8 text-center text-sm text-rose-700">{message}</section>;
}
