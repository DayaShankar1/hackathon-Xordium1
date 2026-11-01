"use client";

import { Check, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import { reviewLostFoundClaim } from "./actions";
import type { LostFoundClaimView } from "./types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function ClaimsPanel({ claims, canReview }: { claims: LostFoundClaimView[]; canReview: boolean }) {
  const router = useRouter();
  const [pendingClaim, setPendingClaim] = useState<string | null>(null);

  function review(claimId: string, decision: "approved" | "rejected") {
    setPendingClaim(claimId);
    startTransition(async () => {
      const result = await reviewLostFoundClaim({ claimId, decision });
      setPendingClaim(null);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(decision === "approved" ? "Claim approved. Other pending claims were closed." : "Claim rejected.");
      router.refresh();
    });
  }

  if (!claims.length) {
    return <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-xs text-slate-500">No claims have been submitted.</p>;
  }

  return (
    <div className="space-y-3">
      {claims.map((claim) => (
        <article key={claim.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold text-slate-800">{claim.claimantName}</p>
              <p className="mt-1 text-[10px] font-medium text-slate-400">{formatDate(claim.created_at)}</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold capitalize text-slate-600 ring-1 ring-slate-200">
              {claim.status}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{claim.statement}</p>
          <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-700">
              <ShieldCheck className="size-3.5" />
              Private ownership detail
            </p>
            <p className="mt-2 text-xs leading-5 text-indigo-900/75">{claim.identifying_details}</p>
          </div>
          {canReview && claim.status === "pending" && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => review(claim.id, "approved")}
                disabled={Boolean(pendingClaim)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-[11px] font-bold text-white disabled:opacity-60"
              >
                {pendingClaim === claim.id ? <LoaderCircle className="size-3 animate-spin" /> : <Check className="size-3" />}
                Approve
              </button>
              <button
                type="button"
                onClick={() => review(claim.id, "rejected")}
                disabled={Boolean(pendingClaim)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-[11px] font-bold text-rose-700 disabled:opacity-60"
              >
                <X className="size-3" />
                Reject
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
