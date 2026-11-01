"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, LoaderCircle, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/utils/supabase/client";

import { createLostFoundReport, updateLostFoundReport } from "./actions";
import { LOST_FOUND_CATEGORIES, MAX_ITEM_IMAGES } from "./constants";
import { reportFieldsSchema, type ReportFormValues } from "./schemas";
import { removeItemImages, uploadItemImages, validateItemImages } from "./storage";

type ReportFormProps = {
  initialValues?: ReportFormValues;
  mode: "create" | "edit";
  reportId?: string;
};

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-rose-400";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-xs font-medium text-rose-600">{message}</p> : null;
}

export function ReportForm({ initialValues, mode, reportId }: ReportFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFieldsSchema),
    defaultValues: initialValues ?? {
      itemType: "lost",
      title: "",
      description: "",
      category: "Electronics",
      location: "",
      incidentDate: new Date().toISOString().slice(0, 10),
    },
  });

  function selectFiles(selected: FileList | null) {
    const nextFiles = selected ? Array.from(selected) : [];
    const validationError = validateItemImages(nextFiles);
    setFileError(validationError);
    setFiles(validationError ? [] : nextFiles);
  }

  const submit = handleSubmit((values) => {
    setIsSubmitting(true);

    startTransition(async () => {
      let uploadedPaths: string[] = [];

      try {
        if (mode === "create") {
          const id = crypto.randomUUID();
          const supabase = createClient();
          const { data, error } = await supabase.auth.getUser();

          if (error || !data.user) throw new Error("Your session expired. Sign in again and retry.");

          uploadedPaths = await uploadItemImages(files, data.user.id, id);
          const result = await createLostFoundReport({ ...values, id, imagePaths: uploadedPaths });

          if (!result.ok) {
            if (uploadedPaths.length) await removeItemImages(uploadedPaths);
            Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => {
              setError(field as keyof ReportFormValues, { message: messages[0] });
            });
            throw new Error(result.error);
          }

          toast.success("Report published successfully.");
          router.push(`/app/lost-found/${result.data.id}`);
        } else {
          if (!reportId) throw new Error("Report identifier is missing.");
          const result = await updateLostFoundReport({ ...values, id: reportId });

          if (!result.ok) {
            Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => {
              setError(field as keyof ReportFormValues, { message: messages[0] });
            });
            throw new Error(result.error);
          }

          toast.success("Report updated successfully.");
          router.push(`/app/lost-found/${result.data.id}`);
        }

        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The report could not be saved.");
      } finally {
        setIsSubmitting(false);
      }
    });
  });

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="itemType" className="mb-2 block text-xs font-bold text-slate-700">
            Report type
          </label>
          <select id="itemType" {...register("itemType")} className={inputClass}>
            <option value="lost">I lost an item</option>
            <option value="found">I found an item</option>
          </select>
          <FieldError message={errors.itemType?.message} />
        </div>

        <div>
          <label htmlFor="category" className="mb-2 block text-xs font-bold text-slate-700">
            Category
          </label>
          <select id="category" {...register("category")} className={inputClass}>
            {LOST_FOUND_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <FieldError message={errors.category?.message} />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="mb-2 block text-xs font-bold text-slate-700">
          Item title
        </label>
        <input
          id="title"
          {...register("title")}
          placeholder="Example: Black scientific calculator"
          className={inputClass}
          aria-invalid={Boolean(errors.title)}
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-xs font-bold text-slate-700">
          Description
        </label>
        <textarea
          id="description"
          {...register("description")}
          rows={5}
          placeholder="Describe the item without publishing private ownership proof."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-rose-400"
          aria-invalid={Boolean(errors.description)}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="location" className="mb-2 block text-xs font-bold text-slate-700">
            Campus location
          </label>
          <input
            id="location"
            {...register("location")}
            placeholder="Library, Block A, Main Ground..."
            className={inputClass}
            aria-invalid={Boolean(errors.location)}
          />
          <FieldError message={errors.location?.message} />
        </div>

        <div>
          <label htmlFor="incidentDate" className="mb-2 block text-xs font-bold text-slate-700">
            Date lost or found
          </label>
          <input
            id="incidentDate"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            {...register("incidentDate")}
            className={inputClass}
            aria-invalid={Boolean(errors.incidentDate)}
          />
          <FieldError message={errors.incidentDate?.message} />
        </div>
      </div>

      {mode === "create" && (
        <div>
          <label htmlFor="photographs" className="mb-2 block text-xs font-bold text-slate-700">
            Photographs <span className="font-medium text-slate-400">(optional)</span>
          </label>
          <label
            htmlFor="photographs"
            className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-5 text-center transition hover:border-brand/50 hover:bg-brand-soft/30"
          >
            <ImagePlus className="size-5 text-brand" />
            <span className="mt-2 text-xs font-bold text-slate-700">Add up to {MAX_ITEM_IMAGES} photographs</span>
            <span className="mt-1 text-[11px] text-slate-500">JPEG, PNG or WebP, maximum 5 MB each</span>
          </label>
          <input
            id="photographs"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(event) => selectFiles(event.target.files)}
          />
          {fileError && <FieldError message={fileError} />}
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file) => (
                <div key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((candidate) => candidate !== file))}
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-rose-600"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        <Link
          href={reportId ? `/app/lost-found/${reportId}` : "/app/lost-found"}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting || Boolean(fileError)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(91,85,223,0.24)] transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          {isSubmitting ? "Saving report" : mode === "create" ? "Publish report" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
