"use client";

import { ImagePlus, LoaderCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import type { CampusIssueStatus } from "@/types/database";
import { createClient } from "@/utils/supabase/client";

import { addCampusIssueUpdate, transitionCampusIssue } from "./actions";
import { ISSUE_STATUS_LABELS } from "./constants";
import { removeEvidence, uploadEvidence, validateEvidenceFiles } from "./storage";

const transitions: Record<CampusIssueStatus, CampusIssueStatus[]> = {
  submitted: ["acknowledged", "resolved", "rejected"],
  acknowledged: ["in_progress", "resolved", "rejected"],
  in_progress: ["acknowledged", "resolved", "rejected"],
  reopened: ["acknowledged", "in_progress", "resolved", "rejected"],
  resolved: ["closed"],
  closed: [],
  rejected: [],
};

export function StaffUpdatePanel({ issueId, status, version }: { issueId: string; status: CampusIssueStatus; version: number }) {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState<string>("");
  const [note, setNote] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [estimatedAt, setEstimatedAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);

  function chooseFiles(list: FileList | null) {
    const next = list ? Array.from(list) : [];
    const error = validateEvidenceFiles(next);
    if (error) { toast.error(error); setFiles([]); } else setFiles(next);
  }

  function submit() {
    if (note.trim().length < 3) return toast.error("Add a staff update note.");
    setPending(true);
    startTransition(async () => {
      let evidence: Awaited<ReturnType<typeof uploadEvidence>> = [];
      try {
        const supabase = createClient();
        const auth = await supabase.auth.getUser();
        if (auth.error || !auth.data.user) throw new Error("Your session expired.");
        evidence = await uploadEvidence(files, auth.data.user.id, issueId);
        const requestId = crypto.randomUUID();
        const result = newStatus
          ? await transitionCampusIssue({ issueId, expectedVersion: version, newStatus, note, resolutionNotes: resolutionNotes || undefined, rejectionReason: rejectionReason || undefined, estimatedResolutionAt: estimatedAt ? new Date(estimatedAt).toISOString() : null, evidence, requestId })
          : await addCampusIssueUpdate({ issueId, expectedVersion: version, note, estimatedResolutionAt: estimatedAt ? new Date(estimatedAt).toISOString() : null, evidence, requestId });
        if (!result.ok) { await removeEvidence(evidence.map((item) => item.object_path)); throw new Error(result.error); }
        toast.success(newStatus ? "Issue status updated." : "Staff update added.");
        setNote(""); setFiles([]); router.refresh();
      } catch (error) { toast.error(error instanceof Error ? error.message : "Update failed."); }
      finally { setPending(false); }
    });
  }

  return <section className="rounded-[22px] border border-slate-200 bg-white p-5"><h3 className="text-sm font-extrabold text-ink">Staff update</h3><div className="mt-4 space-y-3"><select value={newStatus} onChange={(event) => setNewStatus(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs"><option value="">Add note without status change</option>{transitions[status].map((value) => <option key={value} value={value}>{ISSUE_STATUS_LABELS[value]}</option>)}</select><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Public progress or status note" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs" />{newStatus === "resolved" && <textarea value={resolutionNotes} onChange={(event) => setResolutionNotes(event.target.value)} rows={3} placeholder="Mandatory resolution notes" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs" />}{newStatus === "rejected" && <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={3} placeholder="Mandatory rejection reason" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs" />}<label className="block text-[11px] font-bold text-slate-500">Estimated resolution<input type="datetime-local" value={estimatedAt} onChange={(event) => setEstimatedAt(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3" /></label><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 p-3 text-xs font-bold text-slate-600"><ImagePlus className="size-4 text-brand" />Add progress / resolution evidence<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => chooseFiles(event.target.files)} /></label>{files.length > 0 && <p className="text-[11px] text-slate-500">{files.length} image(s) selected</p>}<button type="button" onClick={submit} disabled={pending} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand text-xs font-bold text-white disabled:opacity-60">{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}{pending ? "Saving update" : "Save staff update"}</button></div></section>;
}
