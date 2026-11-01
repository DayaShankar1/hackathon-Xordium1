import { KeyRound, TerminalSquare } from "lucide-react";
import Link from "next/link";

export function ConfigurationRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-xl rounded-[26px] border border-slate-200 bg-white p-7 shadow-card sm:p-9">
        <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-amber-700">
          <KeyRound className="size-5" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Setup required</p>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.035em] text-ink">Connect the Supabase project</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The project URL is documented, but no publishable key was included in the provided files. CampusSphere will not
          fabricate credentials or simulate database writes.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-300">
          <div className="mb-3 flex items-center gap-2 font-semibold text-slate-400">
            <TerminalSquare className="size-4" />
            .env.local
          </div>
          <code className="block break-all leading-6">
            NEXT_PUBLIC_SUPABASE_URL=https://zdjegvihnwoyimqrfscq.supabase.co
            <br />
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
          </code>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">Restart the development server after adding the file.</p>
        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-ink px-5 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Return to the landing page
        </Link>
      </div>
    </div>
  );
}
