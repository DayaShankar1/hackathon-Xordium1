"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import { resolveCampusIssue } from "./actions";

export function ResolveButton({ issueId }: { issueId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function resolve() {
    const notes = window.prompt("Optional resolution notes (e.g. Problem fixed, verified working):")?.trim();
    if (notes === null) return; // user cancelled prompt
    setPending(true);
    startTransition(async () => {
      const result = await resolveCampusIssue({
        issueId,
        resolutionNotes: notes || "Issue marked as resolved.",
      });
      setPending(false);
      if (!result.ok) return void toast.error(result.error);
      toast.success("Issue marked as resolved.");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={resolve}
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
      Mark resolved
    </button>
  );
}

