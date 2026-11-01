"use client";

import { LoaderCircle, ShieldCheck, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import type { TableRow } from "@/types/database";

import { assignCampusIssue, moderateCampusIssue } from "./actions";

export function AdminIssueActions({ issueId, contacts, assignedContactId, moderationStatus }: { issueId: string; contacts: TableRow<"campus_fix_contacts">[]; assignedContactId: string | null; moderationStatus: "visible" | "hidden" | "deleted" }) {
  const router = useRouter(); const [contactId, setContactId] = useState(assignedContactId ?? ""); const [pending, setPending] = useState(false);
  function assign() { if (!contactId) return toast.error("Choose an authorized contact."); const reason = window.prompt("Assignment reason")?.trim() || "Assigned by administrator"; setPending(true); startTransition(async () => { const result = await assignCampusIssue({ issueId, contactId, reason, requestId: crypto.randomUUID() }); setPending(false); if (!result.ok) return void toast.error(result.error); toast.success("Issue assignment updated."); router.refresh(); }); }
  function moderate(action: "hide" | "restore" | "delete" | "duplicate") {
    const label = action === "delete" ? "remove" : action;
    const reason = window.prompt(`Reason to ${label} this issue`)?.trim();
    if (!reason) return;
    const duplicateOf = action === "duplicate" ? window.prompt("Original issue UUID")?.trim() : null;
    setPending(true);
    startTransition(async () => {
      const result = await moderateCampusIssue({ issueId, action, reason, duplicateOf, requestId: crypto.randomUUID() });
      setPending(false);
      if (!result.ok) return void toast.error(result.error);
      if (action === "delete") {
        toast.success("Issue removed.");
        router.push("/app/campus-fix");
      } else {
        toast.success(action === "hide" ? "Issue hidden from students." : "Moderation action recorded.");
        router.refresh();
      }
    });
  }
  return <section className="rounded-[22px] border border-slate-200 bg-white p-5"><h3 className="flex items-center gap-2 text-sm font-extrabold text-ink"><ShieldCheck className="size-4 text-brand" />Admin controls</h3><div className="mt-4 flex gap-2"><select value={contactId} onChange={(event) => setContactId(event.target.value)} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs"><option value="">Select contact</option>{contacts.filter((contact) => contact.is_active).map((contact) => <option key={contact.id} value={contact.id}>{contact.staff_name}</option>)}</select><button onClick={assign} disabled={pending} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white"><UserCheck className="size-3.5" />Assign</button></div><div className="mt-3 flex flex-wrap gap-2">{moderationStatus === "visible" ? <><button onClick={() => moderate("hide")} className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">Hide</button><button onClick={() => moderate("duplicate")} className="rounded-xl bg-violet-50 px-3 py-2 text-[11px] font-bold text-violet-700">Mark duplicate</button><button onClick={() => moderate("delete")} className="rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">Remove</button></> : <button onClick={() => moderate("restore")} className="rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">Restore</button>}{pending && <LoaderCircle className="size-4 animate-spin text-brand" />}</div></section>;
}
