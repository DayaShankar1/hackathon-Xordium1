import { Plus, ShoppingBag } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { MarketplaceListingCard } from "@/features/marketplace/listing-card";
import { MarketplaceFiltersPanel } from "@/features/marketplace/listing-filters";
import { getMarketplaceListings, getMarketplaceViewer } from "@/features/marketplace/queries";
import { marketplaceFiltersSchema } from "@/features/marketplace/schemas";

export const metadata: Metadata = { title: "Marketplace - Campus Student Exchange" };

type SearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const filters = marketplaceFiltersSchema.parse({
    q: first(raw.q),
    category: first(raw.category),
    condition: first(raw.condition),
    view: first(raw.view),
    page: first(raw.page),
  });

  const viewer = await getMarketplaceViewer();
  if (!viewer.ok) {
    return (
      <section role="alert" className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-8 text-center">
        <h2 className="text-sm font-extrabold text-rose-800">Campus Marketplace could not load</h2>
        <p className="mt-2 text-sm text-rose-700">{viewer.error}</p>
      </section>
    );
  }

  const result = await getMarketplaceListings(filters, viewer.data.id, viewer.data.role);
  const listings = result.ok ? result.data.items : [];
  const total = result.ok ? result.data.total : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Student Exchange"
        title="Campus Marketplace"
        description="Buy and sell textbooks, electronics, cycles, and student essentials directly with peers."
        action={
          <Link
            href={"/app/marketplace/new" as Route}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(91,85,223,0.24)] transition hover:bg-brand-strong"
          >
            <Plus className="size-4" />
            Sell an item
          </Link>
        }
      />

      <MarketplaceFiltersPanel
        currentView={filters.view}
        currentCategory={filters.category}
        currentCondition={filters.condition}
        currentQ={filters.q}
      />

      {!result.ok ? (
        <section role="alert" className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-8 text-center">
          <h2 className="text-sm font-extrabold text-rose-800">Listings could not load</h2>
          <p className="mt-2 text-sm text-rose-700">{result.error}</p>
        </section>
      ) : listings.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500">
            {total} {total === 1 ? "item" : "items"}{" "}
            {filters.view === "mine" ? "listed by you" : filters.view === "sold" ? "sold" : "available"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((item) => (
              <MarketplaceListingCard key={item.id} listing={item} />
            ))}
          </div>
        </div>
      ) : (
        <section className="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <ShoppingBag className="size-6" />
          </span>
          <h2 className="mt-5 text-lg font-extrabold text-ink">
            {filters.view === "mine"
              ? "You haven't listed any items for sale yet"
              : "No marketplace listings found"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {filters.view === "mine"
              ? "Declutter your room and help fellow students by listing your used books, cycles, or gadgets."
              : "Try adjusting your search query, or check back soon for newly listed student items."}
          </p>
          <div className="mt-5 flex justify-center">
            <Link
              href={"/app/marketplace/new" as Route}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-xs font-bold text-white transition hover:bg-brand-strong"
            >
              <Plus className="size-3.5" />
              List an item now
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
