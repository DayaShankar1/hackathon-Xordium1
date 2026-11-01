import { ArrowLeft, Calendar, ShoppingBag, Tag, User } from "lucide-react";
import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContactSellerDialog } from "@/features/marketplace/contact-dialog";
import { ITEM_CONDITIONS, LISTING_STATUS_LABELS } from "@/features/marketplace/constants";
import { MarketplaceOwnerActions } from "@/features/marketplace/owner-actions";
import { getMarketplaceListing, getMarketplaceViewer } from "@/features/marketplace/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const viewer = await getMarketplaceViewer();
  if (!viewer.ok) return { title: "Marketplace Listing" };
  const res = await getMarketplaceListing(id, viewer.data.id, viewer.data.role);
  if (!res.ok) return { title: "Item Not Found" };
  return { title: `${res.data.title} - Campus Marketplace` };
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function MarketplaceItemPage({ params }: PageProps) {
  const { id } = await params;
  const viewer = await getMarketplaceViewer();

  if (!viewer.ok) {
    return (
      <section role="alert" className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-8 text-center">
        <h2 className="text-sm font-extrabold text-rose-800">Please sign in to view this listing</h2>
        <p className="mt-2 text-sm text-rose-700">{viewer.error}</p>
      </section>
    );
  }

  const result = await getMarketplaceListing(id, viewer.data.id, viewer.data.role);

  if (!result.ok) {
    notFound();
  }

  const listing = result.data;
  const conditionInfo = ITEM_CONDITIONS.find((c) => c.value === listing.condition);
  const statusInfo = LISTING_STATUS_LABELS[listing.status] ?? LISTING_STATUS_LABELS.available;
  const formattedPrice = formatPrice(listing.price);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={"/app/marketplace" as Route}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-brand"
        >
          <ArrowLeft className="size-4" />
          Back to all listings
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
          {/* Image Display */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/80">
            {listing.publicImageUrl ? (
              <Image
                src={listing.publicImageUrl}
                alt={listing.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300">
                <ShoppingBag className="size-20 stroke-[1.2]" />
                <span className="mt-3 text-sm font-semibold text-slate-400">No photo provided</span>
              </div>
            )}
          </div>

          {/* Details & Action */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  <Tag className="size-3.5 text-slate-400" />
                  {listing.category}
                </span>

                {conditionInfo && (
                  <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${conditionInfo.badgeClass}`}>
                    {conditionInfo.label}
                  </span>
                )}

                {listing.status !== "available" && (
                  <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${statusInfo.badgeClass}`}>
                    {statusInfo.label}
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <h1 className="mt-4 text-2xl font-black text-ink sm:text-3xl">{listing.title}</h1>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-ink">{formattedPrice}</span>
                <span className="text-xs text-slate-400">Campus peer price</span>
              </div>

              {/* Description */}
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h2>
                <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
                  {listing.description}
                </div>
              </div>

              {/* Seller metadata */}
              <div className="mt-6 space-y-2 border-t border-slate-100 pt-5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-slate-400" />
                  <span>
                    Listed by <strong className="text-slate-700">{listing.sellerName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-slate-400" />
                  <span>Posted on {formatDate(listing.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Actions: Owner controls or Contact Buyer dialog */}
            <div className="border-t border-slate-100 pt-6">
              {listing.isOwner ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-700">Listing Management (You are the seller):</p>
                  <MarketplaceOwnerActions
                    listingId={listing.id}
                    currentStatus={listing.status}
                  />
                </div>
              ) : listing.status === "available" ? (
                <ContactSellerDialog
                  sellerName={listing.sellerName}
                  itemTitle={listing.title}
                  priceFormatted={formattedPrice}
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs font-medium text-slate-600">
                  This item has been marked as sold out.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
