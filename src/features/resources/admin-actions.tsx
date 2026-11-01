"use client";

import { Eye, EyeOff, LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import { deleteResource, moderateResource } from "./actions";

export function AdminResourceActions({ resourceId, hidden }: { resourceId: string; hidden: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<"moderate" | "delete" | null>(null);

  function moderate() {
    const reason = hidden ? undefined : window.prompt("Why should this resource be hidden?")?.trim();
    if (!hidden && !reason) return;

    setPending("moderate");
    startTransition(async () => {
      const result = await moderateResource({ id: resourceId, action: hidden ? "restore" : "hide", reason });
      setPending(null);
      if (!result.ok) return void toast.error(result.error);
      toast.success(hidden ? "Resource restored." : "Resource hidden from students.");
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Permanently remove this resource and file?")) return;
    setPending("delete");
    startTransition(async () => {
      const result = await deleteResource(resourceId);
      setPending(null);
      if (!result.ok) return void toast.error(result.error);
      if (result.data.warning) toast.warning(result.data.warning);
      else toast.success("Resource permanently removed.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={moderate} disabled={Boolean(pending)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 disabled:opacity-60">
        {pending === "moderate" ? <LoaderCircle className="size-3 animate-spin" /> : hidden ? <Eye className="size-3" /> : <EyeOff className="size-3" />}{hidden ? "Restore" : "Hide"}
      </button>
      <button type="button" onClick={remove} disabled={Boolean(pending)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-[11px] font-bold text-rose-700 disabled:opacity-60">
        {pending === "delete" ? <LoaderCircle className="size-3 animate-spin" /> : <Trash2 className="size-3" />}Remove
      </button>
    </div>
  );
}
