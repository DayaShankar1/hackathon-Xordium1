"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { submitLostFoundClaim } from "./actions";
import { claimSchema } from "./schemas";

type ClaimValues = z.infer<typeof claimSchema>;

export function ClaimForm({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ClaimValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: { itemId, statement: "", identifyingDetails: "" },
  });

  const submit = handleSubmit((values) => {
    setIsSubmitting(true);
    startTransition(async () => {
      try {
        const result = await submitLostFoundClaim(values);

        if (!result.ok) {
          Object.entries(result.fieldErrors ?? {}).forEach(([field, messages]) => {
            setError(field as keyof ClaimValues, { message: messages[0] });
          });
          throw new Error(result.error);
        }

        reset({ itemId, statement: "", identifyingDetails: "" });
        toast.success("Your private claim was submitted to the report owner.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The claim could not be submitted.");
      } finally {
        setIsSubmitting(false);
      }
    });
  });

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <input type="hidden" {...register("itemId")} />
      <div>
        <label htmlFor="statement" className="mb-2 block text-xs font-bold text-slate-700">
          Why do you believe this is yours?
        </label>
        <textarea
          id="statement"
          {...register("statement")}
          rows={4}
          placeholder="Share enough context for the finder to review your claim."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
        />
        {errors.statement?.message && <p className="mt-1.5 text-xs text-rose-600">{errors.statement.message}</p>}
      </div>
      <div>
        <label htmlFor="identifyingDetails" className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
          <ShieldCheck className="size-3.5 text-brand" />
          Private identifying detail
        </label>
        <textarea
          id="identifyingDetails"
          {...register("identifyingDetails")}
          rows={3}
          placeholder="Example: a scratch, sticker, serial digits, or contents only the owner would know."
          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
        />
        {errors.identifyingDetails?.message && (
          <p className="mt-1.5 text-xs text-rose-600">{errors.identifyingDetails.message}</p>
        )}
        <p className="mt-2 text-[11px] leading-5 text-slate-400">Only you, the report owner, and administrators can read this information.</p>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
        {isSubmitting ? "Submitting claim" : "Submit private claim"}
      </button>
    </form>
  );
}
