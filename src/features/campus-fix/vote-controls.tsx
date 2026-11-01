"use client";

import { LoaderCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import { setCampusIssueVote } from "./actions";

export function VoteControls({ issueId, agreeCount: initialAgree, disagreeCount: initialDisagree, userVote: initialVote, eligible }: { issueId: string; agreeCount: number; disagreeCount: number; userVote?: "agree" | "disagree" | null; eligible: boolean }) {
  const [agreeCount, setAgreeCount] = useState(initialAgree);
  const [disagreeCount, setDisagreeCount] = useState(initialDisagree);
  const [userVote, setUserVote] = useState(initialVote ?? null);
  const [pending, setPending] = useState(false);
  function vote(value: "agree" | "disagree") {
    setPending(true);
    startTransition(async () => {
      const result = await setCampusIssueVote({ issueId, vote: value });
      setPending(false);
      if (!result.ok) return void toast.error(result.error);
      setAgreeCount(result.data.agreeCount); setDisagreeCount(result.data.disagreeCount); setUserVote(result.data.userVote);
      toast.success("Your community vote was updated.");
    });
  }
  return <div className="rounded-[20px] border border-slate-200 bg-white p-5"><p className="text-xs font-extrabold text-slate-800">Community confirmation</p><p className="mt-1 text-[11px] text-slate-500">{agreeCount + disagreeCount} total votes. Voting does not change issue status.</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => vote("agree")} disabled={!eligible || pending} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold ${userVote === "agree" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>{pending ? <LoaderCircle className="size-3.5 animate-spin" /> : <ThumbsUp className="size-3.5" />}Agree · {agreeCount}</button><button type="button" onClick={() => vote("disagree")} disabled={!eligible || pending} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold ${userVote === "disagree" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700"}`}><ThumbsDown className="size-3.5" />Disagree · {disagreeCount}</button></div>{!eligible && <p className="mt-3 text-[11px] text-slate-400">Voting is closed for this issue.</p>}</div>;
}
