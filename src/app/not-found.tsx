import { Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Compass className="size-6" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-brand">Page not found</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-ink">This campus path does not exist.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Return to CampusSphere and choose one of the connected services.</p>
        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-ink px-5 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Go to CampusSphere
        </Link>
      </div>
    </main>
  );
}
