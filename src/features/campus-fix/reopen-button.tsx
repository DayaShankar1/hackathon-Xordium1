"use client";

import { LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import { reopenCampusIssue } from "./actions";

export function ReopenButton({ issueId }: { issueId: string }) {
  const router = useRouter(); const [pending, setPending] = useState(false);
  function reopen() { const reason = window.prompt("Why should this issue be reopened?")?.trim(); if (!reason) return; setPending(true); startTransition(async () => { const result = await reopenCampusIssue({ issueId, reason, requestId: crypto.randomUUID() }); setPending(false); if (!result.ok) return void toast.error(result.error); toast.success("Issue reopened."); router.refresh(); }); }
  return <button type="button" onClick={reopen} disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-3.5 text-xs font-bold text-white disabled:opacity-60">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}Reopen issue</button>;
}
