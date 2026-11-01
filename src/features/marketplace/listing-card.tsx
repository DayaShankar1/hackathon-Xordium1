import { ShoppingBag, Tag } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { ITEM_CONDITIONS, LISTING_STATUS_LABELS } from "./constants";
import type { MarketplaceListingView } from "./types";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function MarketplaceListingCard({ listing }: { listing: MarketplaceListingView }) {
  const conditionInfo = ITEM_CONDITIONS.find((c) => c.value === listing.condition);
  const statusInfo = LISTING_STATUS_LABELS[listing.status] ?? LISTING_STATUS_LABELS.available;

  return (
    <Link
      href={`/app/marketplace/${listing.id}` as Route}
      className="group relative flex flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_12px_28px_rgba(91,85,223,0.08)]"
    >
      {/* Image or Placeholder */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {listing.publicImageUrl ? (
          <Image
            src={listing.publicImageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300">
            <ShoppingBag className="size-12 stroke-[1.2]" />
            <span className="mt-2 text-xs font-semibold text-slate-400">No photo uploaded</span>
          </div>
        )}

        {/* Condition pill */}
        {conditionInfo && (
          <span
            className={`absolute top-3 left-3 rounded-lg border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${conditionInfo.badgeClass}`}
          >
            {conditionInfo.label}
          </span>
        )}

        {/* Status pill (if sold or hidden) */}
        {listing.status !== "available" && (
          <span
            className={`absolute top-3 right-3 rounded-lg border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${statusInfo.badgeClass}`}
          >
            {statusInfo.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xl font-black text-ink">{formatPrice(listing.price)}</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              <Tag className="size-3 text-slate-400" />
              {listing.category}
            </span>
          </div>

          <h3 className="mt-2 line-clamp-2 text-sm font-bold text-ink transition-colors group-hover:text-brand">
            {listing.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {listing.description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <span>Seller: {listing.sellerName}</span>
          <span className="font-semibold text-brand">View details &rarr;</span>
        </div>
      </div>
    </Link>
  );
}
