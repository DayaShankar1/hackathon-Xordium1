"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import {
  requestPasswordResetAction,
  resetPasswordAction,
  type AuthActionState,
} from "./actions";

const initialState: AuthActionState = { status: "idle" };

function Message({ state }: { state: AuthActionState }) {
  if (!state.message) return null;

  return (
    <div
      role={state.status === "error" ? "alert" : "status"}
      className={`rounded-xl border px-3.5 py-3 text-xs font-semibold leading-5 ${
        state.status === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {state.message}
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="mb-2 block text-xs font-bold text-slate-700">
          Email address
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@campus.edu"
            aria-invalid={Boolean(state.fieldErrors?.email?.length)}
            aria-describedby={state.fieldErrors?.email?.length ? "email-error" : undefined}
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-rose-50"
          />
        </div>
        {state.fieldErrors?.email?.[0] && (
          <p id="email-error" className="mt-1.5 text-xs font-medium text-rose-600">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      <Message state={state} />

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(91,85,223,0.26)] transition hover:-translate-y-0.5 hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0"
      >
        {isPending && <LoaderCircle className="size-4 animate-spin" />}
        {isPending ? "Sending reset link" : "Send reset link"}
      </button>

      <p className="text-center text-xs text-slate-500">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="font-bold text-brand hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Return to sign in
        </Link>
      </p>
    </form>
  );
}

function PasswordInput({
  id,
  label,
  autoComplete,
  error,
}: {
  id: "password" | "confirmPassword";
  label: string;
  autoComplete: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-bold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder="At least 8 characters"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-11 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-rose-50"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    resetPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <PasswordInput
        id="password"
        label="New password"
        autoComplete="new-password"
        error={state.fieldErrors?.password?.[0]}
      />
      <PasswordInput
        id="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword?.[0]}
      />

      <Message state={state} />

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(91,85,223,0.26)] transition hover:-translate-y-0.5 hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0"
      >
        {isPending && <LoaderCircle className="size-4 animate-spin" />}
        {isPending ? "Updating password" : "Set new password"}
      </button>
    </form>
  );
}
