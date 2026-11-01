import {
  ArrowRight,
  Check,
  ChevronRight,
  Layers3,
  LockKeyhole,
  MoveRight,
} from "lucide-react";
import Link from "next/link";

import { HeroPreview } from "@/components/marketing/hero-preview";
import { Brand } from "@/components/ui/brand";
import { campusModules, productPrinciples } from "@/lib/site";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="relative z-20 mx-auto flex w-full max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Brand />
        <nav className="flex items-center gap-2" aria-label="Primary navigation">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="hidden items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:inline-flex"
          >
            Join CampusSphere
            <ArrowRight className="size-4" />
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid w-full max-w-[1240px] items-center gap-14 px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:px-10 lg:pb-32 lg:pt-24">
        <div className="relative z-10 max-w-[620px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/75 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur">
            <span className="size-1.5 rounded-full bg-brand" />
            Built for the way campus works
          </div>
          <h1 className="mt-7 text-[3.25rem] font-black leading-[0.98] tracking-[-0.065em] text-ink sm:text-[4.5rem] lg:text-[4.85rem]">
            Your campus,
            <span className="mt-1 block text-brand">all in one place.</span>
          </h1>
          <p className="mt-7 max-w-[560px] text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Find what was lost, share academic resources, discover events, trade essentials,
            and report campus issues without switching between scattered channels.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-[0_14px_35px_rgba(91,85,223,0.3)] transition hover:-translate-y-0.5 hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#services"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              Explore the platform
              <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200/80 pt-6">
            {productPrinciples.map((principle) => {
              const Icon = principle.icon;

              return (
                <div key={principle.label} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Icon className="size-3.5 text-brand" strokeWidth={2.2} />
                  {principle.label}
                </div>
              );
            })}
          </div>
        </div>

        <HeroPreview />
      </section>

      <section id="services" className="relative border-y border-slate-200/80 bg-white/72 py-24 sm:py-28">
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">One connected product</p>
              <h2 className="mt-4 max-w-md text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">
                Five useful services. Zero fragmentation.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">
              Every module shares the same student identity, navigation, security model, and
              notification system, so CampusSphere feels familiar from the first task to the fifth.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {campusModules.map((module, index) => {
              const Icon = module.icon;
              const widthClass = index < 2 ? "lg:col-span-3" : "lg:col-span-2";

              return (
                <article
                  key={module.key}
                  className={`group relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white p-6 shadow-[0_12px_35px_rgba(31,41,79,0.045)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-card ${widthClass}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className={`grid size-12 place-items-center rounded-2xl ${module.surfaceClass}`}>
                      <Icon className={`size-5 ${module.iconClass}`} strokeWidth={2} />
                    </span>
                    <span className="text-xs font-bold tabular-nums text-slate-300">0{index + 1}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-extrabold tracking-[-0.025em] text-ink">{module.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{module.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {module.features.slice(0, 2).map((feature) => (
                      <span key={feature} className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                        {feature}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1240px] gap-10 px-5 py-24 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-center lg:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-[#24234d] p-7 text-white shadow-[0_25px_70px_rgba(35,35,77,0.2)] sm:p-10">
          <div className="absolute -right-12 -top-16 size-48 rounded-full border-[34px] border-white/5" />
          <div className="relative">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-indigo-200">
              <Layers3 className="size-5" />
            </span>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">A shared foundation</p>
            <h2 className="mt-3 max-w-lg text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              One profile follows every campus task.
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Consistent navigation", "Private student data", "Role-aware administration", "Trackable activity"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] px-3.5 py-3 text-xs font-semibold text-indigo-50">
                    <Check className="size-3.5 text-emerald-300" strokeWidth={2.5} />
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="lg:pl-10">
          <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand">
            <LockKeyhole className="size-5" />
          </span>
          <h2 className="mt-6 text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">
            Useful by design. Secure by default.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-600">
            CampusSphere uses Supabase authentication, row-level permissions, and private file access
            where needed. Students control their own submissions while administrative actions stay protected.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-brand transition hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Create your student account
            <MoveRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="px-5 pb-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-[1160px] flex-col items-center overflow-hidden rounded-[30px] bg-brand px-6 py-14 text-center text-white shadow-[0_24px_70px_rgba(91,85,223,0.24)] sm:px-10 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-100">One Campus. Everything Connected.</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-5xl">
            A clearer way to get campus life done.
          </h2>
          <Link
            href="/signup"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-brand shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Start with CampusSphere
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-5 py-10 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <Brand />
        <p>Built for campus communities. Student privacy comes first.</p>
      </footer>
    </main>
  );
}
