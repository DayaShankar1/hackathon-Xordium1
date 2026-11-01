"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, LoaderCircle, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/utils/supabase/client";

import { createResource, updateResource } from "./actions";
import {
  MAX_RESOURCE_FILE_SIZE,
  RESOURCE_BRANCHES,
  RESOURCE_SEMESTERS,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPES,
} from "./constants";
import { resourceFieldsSchema, type ResourceFormValues } from "./schemas";
import { removeResourceFile, uploadResourceFile, validateResourceFile } from "./storage";

type ResourceFormProps = {
  initialValues?: ResourceFormValues;
  mode: "create" | "edit";
  resourceId?: string;
};

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-rose-400";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-xs font-medium text-rose-600">{message}</p> : null;
}

export function ResourceForm({ initialValues, mode, resourceId }: ResourceFormProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFieldsSchema),
    defaultValues: initialValues ?? {
      title: "",
      description: "",
      subject: "",
      branch: "Computer Science",
      semester: "1",
      resourceType: "notes",
    },
  });

  function selectFile(selected: File | null) {
    const validationError = validateResourceFile(selected);
    setFileError(validationError);
    setFile(validationError ? null : selected);
  }

  const submit = handleSubmit((values) => {
    setIsSubmitting(true);

    startTransition(async () => {
      let uploadedPath: string | null = null;

      try {
        if (mode === "create") {
          if (!file) throw new Error("Choose a document to upload.");

          const id = crypto.randomUUID();
          const supabase = createClient();
          const { data, error } = await supabase.auth.getUser();

          if (error || !data.user) throw new Error("Your session expired. Sign in again and retry.");

          uploadedPath = await uploadResourceFile(file, data.user.id, id);
          const result = await createResource({
            ...values,
            id,
            filePath: uploadedPath,
            fileName: file.name,
            mimeType: file.type,
            fileSizeBytes: file.size,
          });

          if (!result.ok) {
            await removeResourceFile(uploadedPath);
            Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => {
              setError(field as keyof ResourceFormValues, { message: messages[0] });
            });
            throw new Error(result.error);
          }

          toast.success("Resource uploaded successfully.");
          router.push(`/app/resources/${result.data.id}`);
        } else {
          if (!resourceId) throw new Error("Resource identifier is missing.");
          const result = await updateResource({ ...values, id: resourceId });

          if (!result.ok) {
            Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => {
              setError(field as keyof ResourceFormValues, { message: messages[0] });
            });
            throw new Error(result.error);
          }

          toast.success("Resource details updated.");
          router.push(`/app/resources/${result.data.id}`);
        }

        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The resource could not be saved.");
      } finally {
        setIsSubmitting(false);
      }
    });
  });

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div>
        <label htmlFor="title" className="mb-2 block text-xs font-bold text-slate-700">Resource title</label>
        <input id="title" {...register("title")} placeholder="Example: Data Structures Unit 3 Notes" className={inputClass} aria-invalid={Boolean(errors.title)} />
        <FieldError message={errors.title?.message} />
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-xs font-bold text-slate-700">Description</label>
        <textarea
          id="description"
          {...register("description")}
          rows={5}
          placeholder="Explain what the document covers and who it is useful for."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
          aria-invalid={Boolean(errors.description)}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="subject" className="mb-2 block text-xs font-bold text-slate-700">Subject</label>
          <input id="subject" {...register("subject")} placeholder="Data Structures" className={inputClass} aria-invalid={Boolean(errors.subject)} />
          <FieldError message={errors.subject?.message} />
        </div>
        <div>
          <label htmlFor="resourceType" className="mb-2 block text-xs font-bold text-slate-700">Resource type</label>
          <select id="resourceType" {...register("resourceType")} className={inputClass}>
            {RESOURCE_TYPES.map((type) => <option key={type} value={type}>{RESOURCE_TYPE_LABELS[type]}</option>)}
          </select>
          <FieldError message={errors.resourceType?.message} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="branch" className="mb-2 block text-xs font-bold text-slate-700">Branch</label>
          <select id="branch" {...register("branch")} className={inputClass}>
            {RESOURCE_BRANCHES.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
          </select>
          <FieldError message={errors.branch?.message} />
        </div>
        <div>
          <label htmlFor="semester" className="mb-2 block text-xs font-bold text-slate-700">Semester</label>
          <select id="semester" {...register("semester")} className={inputClass}>
            {RESOURCE_SEMESTERS.map((semester) => <option key={semester} value={semester}>{semester === "Other" ? semester : `Semester ${semester}`}</option>)}
          </select>
          <FieldError message={errors.semester?.message} />
        </div>
      </div>

      {mode === "create" && (
        <div>
          <label htmlFor="resourceFile" className="mb-2 block text-xs font-bold text-slate-700">Document</label>
          <label
            htmlFor="resourceFile"
            className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-5 text-center transition hover:border-brand/50 hover:bg-brand-soft/30"
          >
            <FileUp className="size-5 text-brand" />
            <span className="mt-2 text-xs font-bold text-slate-700">Choose a PDF, DOC, DOCX, PPT or PPTX</span>
            <span className="mt-1 text-[11px] text-slate-500">Maximum {MAX_RESOURCE_FILE_SIZE / 1024 / 1024} MB</span>
          </label>
          <input
            id="resourceFile"
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="sr-only"
            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
          />
          {fileError && <FieldError message={fileError} />}
          {file && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span className="truncate">{file.name}</span>
              <button type="button" onClick={() => selectFile(null)} className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-rose-600" aria-label={`Remove ${file.name}`}>
                <X className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <Link href={resourceId ? `/app/resources/${resourceId}` : "/app/resources"} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Cancel</Link>
        <button type="submit" disabled={isSubmitting || Boolean(fileError)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(91,85,223,0.24)] transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          {isSubmitting ? "Saving resource" : mode === "create" ? "Upload resource" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
