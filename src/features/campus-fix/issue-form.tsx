"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, LoaderCircle, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/utils/supabase/client";

import { createCampusIssue, editCampusIssue } from "./actions";
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES, MAX_ISSUE_IMAGES } from "./constants";
import { issueFieldsSchema, type IssueFormValues } from "./schemas";
import { removeEvidence, uploadEvidence, validateEvidenceFiles } from "./storage";

const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-rose-400";
const ErrorText = ({ message }: { message?: string }) => message ? <p className="mt-1.5 text-xs text-rose-600">{message}</p> : null;

export function IssueForm({ mode, issueId, initialValues }: { mode: "create" | "edit"; issueId?: string; initialValues?: IssueFormValues }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<IssueFormValues>({ resolver: zodResolver(issueFieldsSchema), defaultValues: initialValues ?? { title: "", description: "", category: "network", building: "", location: "", priority: "medium", isAnonymous: false, notifyAuthority: true } });

  function chooseFiles(list: FileList | null) {
    const next = list ? Array.from(list) : [];
    const error = validateEvidenceFiles(next);
    setFileError(error);
    setFiles(error ? [] : next);
  }

  const submit = handleSubmit((values) => {
    setIsSubmitting(true);
    startTransition(async () => {
      let uploaded: Awaited<ReturnType<typeof uploadEvidence>> = [];
      try {
        if (mode === "create") {
          const id = crypto.randomUUID();
          const supabase = createClient();
          const auth = await supabase.auth.getUser();
          if (auth.error || !auth.data.user) throw new Error("Your session expired. Sign in again.");
          uploaded = await uploadEvidence(files, auth.data.user.id, id);
          const result = await createCampusIssue({ ...values, id, evidence: uploaded, requestId: crypto.randomUUID() });
          if (!result.ok) {
            await removeEvidence(uploaded.map((item) => item.object_path));
            Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => setError(field as keyof IssueFormValues, { message: messages[0] }));
            throw new Error(result.error);
          }
          toast.success("Issue submitted successfully.");
          router.push(`/app/campus-fix/${result.data.id}?created=${encodeURIComponent(result.data.referenceId)}`);
        } else {
          if (!issueId) throw new Error("Issue identifier is missing.");
          const result = await editCampusIssue({ ...values, id: issueId, requestId: crypto.randomUUID() });
          if (!result.ok) throw new Error(result.error);
          toast.success("Issue details updated.");
          router.push(`/app/campus-fix/${result.data.id}`);
        }
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The issue could not be saved.");
      } finally { setIsSubmitting(false); }
    });
  });

  return <form onSubmit={submit} className="space-y-6" noValidate>
    <div><label htmlFor="title" className="mb-2 block text-xs font-bold text-slate-700">Issue title</label><input id="title" {...register("title")} placeholder="Briefly describe the problem" className={inputClass} aria-invalid={Boolean(errors.title)} /><ErrorText message={errors.title?.message} /></div>
    <div><label htmlFor="description" className="mb-2 block text-xs font-bold text-slate-700">Detailed description</label><textarea id="description" {...register("description")} rows={6} placeholder="Explain what happened, its impact and any useful troubleshooting details." className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-ink outline-none focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10" /><ErrorText message={errors.description?.message} /></div>
    <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="category" className="mb-2 block text-xs font-bold text-slate-700">Category</label><select id="category" {...register("category")} disabled={mode === "edit"} className={inputClass}>{ISSUE_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><ErrorText message={errors.category?.message} /></div><div><label htmlFor="priority" className="mb-2 block text-xs font-bold text-slate-700">Priority</label><select id="priority" {...register("priority")} className={inputClass}>{ISSUE_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><ErrorText message={errors.priority?.message} /></div></div>
    <div className="grid gap-5 sm:grid-cols-2"><div><label htmlFor="building" className="mb-2 block text-xs font-bold text-slate-700">Campus building</label><input id="building" {...register("building")} placeholder="Academic Block A" className={inputClass} /><ErrorText message={errors.building?.message} /></div><div><label htmlFor="location" className="mb-2 block text-xs font-bold text-slate-700">Room / lab / precise location</label><input id="location" {...register("location")} placeholder="Room 204, second floor" className={inputClass} /><ErrorText message={errors.location?.message} /></div></div>
    {mode === "create" && <><div className="space-y-3"><label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"><input type="checkbox" {...register("isAnonymous")} className="mt-0.5 size-4 accent-indigo-600" /><span><span className="block text-xs font-bold text-slate-700">Report anonymously to students</span><span className="mt-1 block text-[11px] leading-5 text-slate-500">CampusFix securely retains your identity for authorized staff and administrators.</span></span></label><label className="flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4"><input type="checkbox" {...register("notifyAuthority")} className="mt-0.5 size-4 accent-indigo-600" /><span><span className="block text-xs font-bold text-indigo-900">Contact concerned authority</span><span className="mt-1 block text-[11px] leading-5 text-indigo-700/75">Notify the securely matched authorized contact. Students cannot choose or view private phone numbers.</span></span></label></div><div><label htmlFor="evidence" className="mb-2 block text-xs font-bold text-slate-700">Image evidence <span className="font-medium text-slate-400">(optional)</span></label><label htmlFor="evidence" className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center"><ImagePlus className="size-5 text-brand" /><span className="mt-2 text-xs font-bold text-slate-700">Add up to {MAX_ISSUE_IMAGES} images</span><span className="mt-1 text-[11px] text-slate-500">JPEG, PNG or WebP, maximum 5 MB each</span></label><input id="evidence" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => chooseFiles(event.target.files)} />{fileError && <ErrorText message={fileError} />}{files.map((file) => <div key={`${file.name}-${file.lastModified}`} className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600"><span className="truncate">{file.name}</span><button type="button" onClick={() => setFiles((current) => current.filter((item) => item !== file))} aria-label={`Remove ${file.name}`}><X className="size-3.5" /></button></div>)}</div></>}
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end"><Link href={issueId ? `/app/campus-fix/${issueId}` : "/app/campus-fix"} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600">Cancel</Link><button disabled={isSubmitting || Boolean(fileError)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white disabled:opacity-60">{isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{isSubmitting ? "Submitting issue" : mode === "create" ? "Submit issue" : "Save changes"}</button></div>
  </form>;
}
