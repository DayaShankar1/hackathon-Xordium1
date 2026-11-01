"use client";

import { RefreshCcw, TriangleAlert } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
          <TriangleAlert className="size-6" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-rose-600">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-ink">CampusSphere could not load this page.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Try the request again. Your unsaved database operation has not been reported as successful.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <RefreshCcw className="size-4" />
          Try again
        </button>
      </div>
    </main>
  );
}
