import { BookOpenText, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceFiltersPanel } from "@/features/resources/filters";
import { ResourcePagination } from "@/features/resources/pagination";
import { getResources, getResourceViewer } from "@/features/resources/queries";
import { ResourceCard } from "@/features/resources/resource-card";
import { resourceFiltersSchema } from "@/features/resources/schemas";

export const metadata: Metadata = { title: "Resource Hub" };

type SearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const filters = resourceFiltersSchema.parse({
    q: first(raw.q),
    subject: first(raw.subject),
    branch: first(raw.branch),
    semester: first(raw.semester),
    resourceType: first(raw.resourceType),
    view: first(raw.view),
    page: first(raw.page),
  });
  const viewer = await getResourceViewer();

  if (!viewer.ok) return <DataError message={viewer.error} />;

  const result = await getResources(filters, viewer.data.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Academic service"
        title="Resource Hub"
        description="Find and share trusted notes, question papers, assignments and references."
        action={<Link href="/app/resources/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(91,85,223,0.24)] transition hover:bg-brand-strong"><Plus className="size-4" />Upload resource</Link>}
      />
      <ResourceFiltersPanel filters={filters} />
      {!result.ok ? <DataError message={result.error} /> : result.data.items.length ? (
        <>
          <p className="text-xs font-semibold text-slate-500">{result.data.total} {result.data.total === 1 ? "resource" : "resources"}</p>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{result.data.items.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}</section>
          <ResourcePagination filters={filters} pageCount={result.data.pageCount} />
        </>
      ) : (
        <section className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-sky-50 text-sky-700"><BookOpenText className="size-6" /></span>
          <h2 className="mt-5 text-lg font-extrabold text-ink">No matching resources</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Adjust the filters or upload study material for your campus.</p>
        </section>
      )}
    </div>
  );
}

function DataError({ message }: { message: string }) {
  return <section role="alert" className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-8 text-center"><h2 className="text-sm font-extrabold text-rose-800">Resource Hub could not load</h2><p className="mt-2 text-sm text-rose-700">{message}</p></section>;
}
