"use client";

import { LoaderCircle, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";

import { deleteResource } from "./actions";

export function ResourceOwnerActions({ resourceId }: { resourceId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  function remove() {
    if (!window.confirm("Delete this resource and its uploaded file permanently?")) return;
    setIsDeleting(true);
    startTransition(async () => {
      const result = await deleteResource(resourceId);
      setIsDeleting(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (result.data.warning) toast.warning(result.data.warning);
      else toast.success("Resource deleted.");
      router.push("/app/resources?view=mine");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Link href={`/app/resources/${resourceId}/edit`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"><Pencil className="size-3.5" />Edit</Link>
      <button type="button" onClick={remove} disabled={isDeleting} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60">
        {isDeleting ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Delete
      </button>
    </div>
  );
}
