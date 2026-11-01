"use client";

import { CheckCircle2, Loader2, RotateCcw, Trash2 } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteListing, markListingStatus } from "./actions";

type OwnerActionsProps = {
  listingId: string;
  currentStatus: "available" | "sold" | "hidden";
};

export function MarketplaceOwnerActions({ listingId, currentStatus }: OwnerActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggleSold = () => {
    setErrorMessage(null);
    const newStatus = currentStatus === "sold" ? "available" : "sold";

    startTransition(async () => {
      const res = await markListingStatus(listingId, newStatus);
      if (!res.ok) {
        setErrorMessage(res.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      return;
    }
    setErrorMessage(null);

    startTransition(async () => {
      const res = await deleteListing(listingId);
      if (!res.ok) {
        setErrorMessage(res.error);
      } else {
        router.push("/app/marketplace" as Route);
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleToggleSold}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : currentStatus === "sold" ? (
            <>
              <RotateCcw className="size-3.5 text-blue-600" />
              Mark as Available
            </>
          ) : (
            <>
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Mark as Sold
            </>
          )}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <>
              <Trash2 className="size-3.5" />
              Delete Listing
            </>
          )}
        </button>
      </div>

      {errorMessage && <p className="text-xs font-medium text-rose-600">{errorMessage}</p>}
    </div>
  );
}
