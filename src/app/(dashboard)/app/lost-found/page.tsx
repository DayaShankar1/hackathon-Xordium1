import { Inbox, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { LostFoundFilters } from "@/features/lost-found/filters";
import { LostFoundItemCard } from "@/features/lost-found/item-card";
import { Pagination } from "@/features/lost-found/pagination";
import { getLostFoundItems, getLostFoundViewer } from "@/features/lost-found/queries";
import { lostFoundFiltersSchema } from "@/features/lost-found/schemas";

export const metadata: Metadata = { title: "Lost & Found" };

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LostFoundPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const filters = lostFoundFiltersSchema.parse({
    q: first(raw.q),
    category: first(raw.category),
    location: first(raw.location),
    type: first(raw.type),
    status: first(raw.status),
    page: first(raw.page),
  });
  const viewer = await getLostFoundViewer();

  if (!viewer.ok) {
    return <DataError message={viewer.error} />;
  }

  const result = await getLostFoundItems(filters, viewer.data.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Campus service"
        title="Lost & Found"
        description="Report missing belongings, share found items, and handle ownership claims privately."
        action={
          <Link
            href="/app/lost-found/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(91,85,223,0.24)] transition hover:bg-brand-strong"
          >
            <Plus className="size-4" />
            Report an item
          </Link>
        }
      />

      <LostFoundFilters filters={filters} />

      {!result.ok ? (
        <DataError message={result.error} />
      ) : result.data.items.length ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-semibold text-slate-500">
              {result.data.total} {result.data.total === 1 ? "report" : "reports"}
            </p>
          </div>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.data.items.map((item) => (
              <LostFoundItemCard key={item.id} item={item} />
            ))}
          </section>
          <Pagination filters={filters} pageCount={result.data.pageCount} />
        </>
      ) : (
        <section className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Inbox className="size-6" />
          </span>
          <h2 className="mt-5 text-lg font-extrabold text-ink">No matching reports</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Adjust the filters or publish a report so other students can help.
          </p>
        </section>
      )}
    </div>
  );
}

function DataError({ message }: { message: string }) {
  return (
    <section role="alert" className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-8 text-center">
      <h2 className="text-sm font-extrabold text-rose-800">Lost & Found could not load</h2>
      <p className="mt-2 text-sm leading-6 text-rose-700">{message}</p>
    </section>
  );
}
