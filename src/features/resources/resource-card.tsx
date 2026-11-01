import { BookOpenText, CalendarDays, GraduationCap, UserRound } from "lucide-react";
import Link from "next/link";

import { RESOURCE_TYPE_LABELS } from "./constants";
import type { ResourceView } from "./types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function formatSize(value: number | null) {
  if (!value) return "Size unavailable";
  return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`;
}

export function ResourceCard({ resource }: { resource: ResourceView }) {
  return (
    <Link href={`/app/resources/${resource.id}`} className="group flex min-h-64 flex-col rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(31,41,79,0.04)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-sky-50 text-sky-700"><BookOpenText className="size-5" /></span>
        <div className="flex gap-2">
          {resource.is_hidden && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700">Hidden</span>}
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{RESOURCE_TYPE_LABELS[resource.resource_type]}</span>
        </div>
      </div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">{resource.subject}</p>
      <h2 className="mt-1.5 line-clamp-2 text-base font-extrabold tracking-[-0.02em] text-ink">{resource.title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-500">
        <span className="flex items-center gap-1.5"><GraduationCap className="size-3.5 text-slate-400" />{resource.branch ?? "Branch unavailable"}</span>
        <span>Semester {resource.semester ?? "N/A"}</span>
        <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-slate-400" />{formatDate(resource.created_at)}</span>
        <span>{formatSize(resource.file_size_bytes)}</span>
      </div>
      <p className="mt-auto flex items-center gap-1.5 pt-5 text-[11px] text-slate-400"><UserRound className="size-3.5" />{resource.uploaderName}</p>
    </Link>
  );
}
