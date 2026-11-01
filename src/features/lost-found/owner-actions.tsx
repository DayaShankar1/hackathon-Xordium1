"use client";

import { CheckCircle2, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import { deleteLostFoundReport, resolveLostFoundReport } from "./actions";

export function OwnerActions({ itemId, status }: { itemId: string; status: "open" | "claimed" | "resolved" }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"resolve" | "delete" | null>(null);

  function resolveReport() {
    if (!window.confirm("Mark this report as resolved?")) return;
    setPendingAction("resolve");
    startTransition(async () => {
      const result = await resolveLostFoundReport(itemId);
      setPendingAction(null);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Report marked as resolved.");
      router.refresh();
    });
  }

  function deleteReport() {
    if (!window.confirm("Delete this report permanently? This cannot be undone.")) return;
    setPendingAction("delete");
    startTransition(async () => {
      const result = await deleteLostFoundReport(itemId);
      setPendingAction(null);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.data.warning) toast.warning(result.data.warning);
      else toast.success("Report deleted.");
      router.push("/app/lost-found?type=mine");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "resolved" && (
        <>
          <Link
            href={`/app/lost-found/${itemId}/edit`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <Pencil className="size-3.5" />
            Edit
          </Link>
          <button
            type="button"
            onClick={resolveReport}
            disabled={Boolean(pendingAction)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {pendingAction === "resolve" ? <LoaderCircle className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
            Mark resolved
          </button>
        </>
      )}
      <button
        type="button"
        onClick={deleteReport}
        disabled={Boolean(pendingAction)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
      >
        {pendingAction === "delete" ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        Delete
      </button>
    </div>
  );
}
