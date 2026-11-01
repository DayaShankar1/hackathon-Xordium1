"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import {
  signInAction,
  signUpAction,
  type AuthActionState,
  type AuthField,
} from "./actions";

const initialAuthState: AuthActionState = { status: "idle" };

type AuthFormProps = {
  mode: "login" | "signup";
};

type FieldProps = {
  name: AuthField;
  label: string;
  type?: string;
  autoComplete: string;
  placeholder: string;
  icon: typeof Mail;
  errors?: string[];
};

function Field({ name, label, type = "text", autoComplete, placeholder, icon: Icon, errors }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-xs font-bold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id={name}
          name={name}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(errors?.length)}
          aria-describedby={errors?.length ? `${name}-error` : undefined}
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-rose-50"
        />
      </div>
      {errors?.[0] && (
        <p id={`${name}-error`} className="mt-1.5 text-xs font-medium text-rose-600">
          {errors[0]}
        </p>
      )}
    </div>
  );
}

function PasswordField({ mode, errors }: { mode: AuthFormProps["mode"]; errors?: string[] }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor="password" className="text-xs font-bold text-slate-700">
          Password
        </label>
        {mode === "login" && (
          <Link
            href="/forgot-password"
            className="text-[11px] font-bold text-brand transition hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Forgot password?
          </Link>
        )}
      </div>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "login" ? "Enter your password" : "At least 8 characters"}
          aria-invalid={Boolean(errors?.length)}
          aria-describedby={errors?.length ? "password-error" : undefined}
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-11 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-rose-50"
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-2.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {errors?.[0] && (
        <p id="password-error" className="mt-1.5 text-xs font-medium text-rose-600">
          {errors[0]}
        </p>
      )}
    </div>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "login" ? signInAction : signUpAction;
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(action, initialAuthState);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      {!isLogin && (
        <Field
          name="displayName"
          label="Full name"
          autoComplete="name"
          placeholder="How your name should appear"
          icon={UserRound}
          errors={state.fieldErrors?.displayName}
        />
      )}

      <Field
        name="email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@campus.edu"
        icon={Mail}
        errors={state.fieldErrors?.email}
      />

      <PasswordField mode={mode} errors={state.fieldErrors?.password} />

      {state.message && (
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
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(91,85,223,0.26)] transition hover:-translate-y-0.5 hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0"
      >
        {isPending && <LoaderCircle className="size-4 animate-spin" />}
        {isPending ? "Please wait" : isLogin ? "Sign in to CampusSphere" : "Create student account"}
      </button>

      <p className="text-center text-xs text-slate-500">
        {isLogin ? "New to CampusSphere?" : "Already have an account?"}{" "}
        <Link
          href={isLogin ? "/signup" : "/login"}
          className="font-bold text-brand hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
