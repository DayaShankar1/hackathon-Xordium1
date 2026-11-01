"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";

import { updateProfileAction, type AuthActionState } from "./actions";

const initialState: AuthActionState = { status: "idle" };

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6" noValidate>
      <label htmlFor="displayName" className="mb-2 block text-xs font-bold text-slate-700">
        Display name
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <input
            id="displayName"
            name="displayName"
            defaultValue={displayName}
            autoComplete="name"
            aria-invalid={Boolean(state.fieldErrors?.displayName?.length)}
            aria-describedby={state.fieldErrors?.displayName?.length ? "displayName-error" : undefined}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-rose-400"
          />
          {state.fieldErrors?.displayName?.[0] && (
            <p id="displayName-error" className="mt-1.5 text-xs font-medium text-rose-600">
              {state.fieldErrors.displayName[0]}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-xs font-bold text-white transition hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-65"
        >
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
          {isPending ? "Saving" : "Save name"}
        </button>
      </div>
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-3 text-xs font-semibold ${state.status === "error" ? "text-rose-600" : "text-emerald-600"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
