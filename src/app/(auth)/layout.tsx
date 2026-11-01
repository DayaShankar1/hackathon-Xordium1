import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/ui/brand";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#24234d] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-24 -top-24 size-80 rounded-full border-[55px] border-white/[0.04]" />
        <div className="absolute -bottom-28 -left-20 size-80 rounded-full border-[55px] border-indigo-300/[0.05]" />
        <div className="relative">
          <Brand inverse />
        </div>

        <div className="relative max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">One Campus. Everything Connected.</p>
          <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.045em] xl:text-5xl">
            Less searching. More campus life.
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-indigo-100/70 xl:text-base">
            One student account unlocks five practical campus services with a consistent, secure experience.
          </p>
          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            {["Recover lost belongings", "Find study materials", "Discover campus events", "Track issue resolution"].map(
              (item) => (
                <div key={item} className="flex items-center gap-2.5 text-xs font-semibold text-indigo-50">
                  <span className="grid size-5 place-items-center rounded-full bg-white/10">
                    <Check className="size-3 text-emerald-300" />
                  </span>
                  {item}
                </div>
              ),
            )}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs font-medium text-indigo-100/55">
          <ShieldCheck className="size-4" />
          Protected by Supabase Auth and row-level security
        </div>
      </section>

      <section className="relative flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:justify-end">
          <div className="lg:hidden">
            <Brand />
          </div>
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-14 sm:px-8">{children}</div>
      </section>
    </main>
  );
}
