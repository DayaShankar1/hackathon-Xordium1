import { ArrowLeft, CalendarDays, MapPin, SearchCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClaimForm } from "@/features/lost-found/claim-form";
import { ClaimsPanel } from "@/features/lost-found/claims-panel";
import { OwnerActions } from "@/features/lost-found/owner-actions";
import { getLostFoundClaims, getLostFoundItem, getLostFoundViewer } from "@/features/lost-found/queries";
import { StatusBadge } from "@/features/lost-found/status-badge";

export const metadata: Metadata = { title: "Item details" };

function formatDate(value: string | null, fallback: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(value ?? fallback));
}

export default async function LostFoundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [itemResult, viewerResult, claimsResult] = await Promise.all([
    getLostFoundItem(id),
    getLostFoundViewer(),
    getLostFoundClaims(id),
  ]);

  if (!itemResult.ok && itemResult.error === "Report not found.") notFound();

  if (!itemResult.ok) {
    return (
      <section role="alert" className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-8 text-center text-sm text-rose-700">
        {itemResult.error}
      </section>
    );
  }

  if (!viewerResult.ok) {
    return (
      <section role="alert" className="rounded-[22px] border border-rose-200 bg-rose-50 px-6 py-8 text-center text-sm text-rose-700">
        {viewerResult.error}
      </section>
    );
  }

  const item = itemResult.data;
  const viewer = viewerResult.data;
  const isOwner = viewer.id === item.user_id;
  const canReview = isOwner || viewer.role === "admin";
  const claims = claimsResult.ok ? claimsResult.data : [];
  const ownClaim = claims.find((claim) => claim.claimant_id === viewer.id);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/app/lost-found" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand">
          <ArrowLeft className="size-4" />
          Back to Lost & Found
        </Link>
        {isOwner && <OwnerActions itemId={item.id} status={item.status} />}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
            {item.images[0]?.signedUrl ? (
              <Image src={item.images[0].signedUrl} alt={item.title} fill unoptimized priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-slate-300">
                <SearchCheck className="size-14" strokeWidth={1.4} />
              </div>
            )}
          </div>
          {item.images.length > 1 && (
            <div className="grid grid-cols-3 gap-3">
              {item.images.slice(1).map((image) => (
                <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  {image.signedUrl && <Image src={image.signedUrl} alt={`${item.title} photograph`} fill unoptimized sizes="33vw" className="object-cover" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_38px_rgba(31,41,79,0.04)] sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white ${item.item_type === "lost" ? "bg-indigo-600" : "bg-emerald-600"}`}>
              {item.item_type}
            </span>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.14em] text-brand">{item.category}</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-ink">{item.title}</h1>
          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.description}</p>
          <dl className="mt-7 space-y-4 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="size-4 text-brand" />
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Location</dt>
                <dd className="mt-0.5 text-sm font-bold text-slate-700">{item.location}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="size-4 text-brand" />
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Date</dt>
                <dd className="mt-0.5 text-sm font-bold text-slate-700">{formatDate(item.incident_date, item.created_at)}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserRound className="size-4 text-brand" />
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Reported by</dt>
                <dd className="mt-0.5 text-sm font-bold text-slate-700">{item.reporterName}</dd>
              </div>
            </div>
          </dl>
        </article>
      </section>

      {item.item_type === "found" && (
        <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          {!isOwner && item.status === "open" && !ownClaim ? (
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-7">
              <h2 className="text-lg font-extrabold tracking-[-0.02em] text-ink">Is this your item?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Submit private ownership details for the finder to review.</p>
              <div className="mt-6">
                <ClaimForm itemId={item.id} />
              </div>
            </div>
          ) : !isOwner && ownClaim ? (
            <div className="rounded-[24px] border border-indigo-100 bg-indigo-50/60 p-6">
              <h2 className="text-base font-extrabold text-indigo-900">Your claim is {ownClaim.status}.</h2>
              <p className="mt-2 text-sm leading-6 text-indigo-800/70">Only you and the report owner can view the submitted details.</p>
            </div>
          ) : (
            <div className="rounded-[24px] border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-extrabold text-ink">Ownership claims</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Review private evidence before approving a handoff.</p>
            </div>
          )}

          {(canReview || ownClaim) && (
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-7">
              <ClaimsPanel claims={claims} canReview={canReview} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
