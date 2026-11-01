import { ArrowUpRight, Compass, Sparkles } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { WelcomeToast } from "@/components/shared/welcome-toast";
import { campusModules } from "@/lib/site";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ welcome?: string }>;
}) {
  const params = searchParams ? await searchParams : {};

  return (
    <div className="space-y-8">
      <WelcomeToast show={params.welcome === "1"} />
      <section className="relative overflow-hidden rounded-[28px] bg-[#24234d] px-6 py-8 text-white shadow-[0_20px_55px_rgba(35,35,77,0.17)] sm:px-8 sm:py-10">
        <div className="absolute -right-12 -top-20 size-56 rounded-full border-[42px] border-white/[0.04]" />
        <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.19em] text-indigo-200">
              <Sparkles className="size-3.5" />
              Student workspace
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl">
              Your whole campus, within reach.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-indigo-100/70 sm:text-base">
              Move between five connected services without losing context or switching accounts.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-3 pr-5">
            <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-indigo-200">
              <Compass className="size-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold text-indigo-200">Connected services</p>
              <p className="mt-0.5 text-sm font-extrabold">5 campus essentials</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <PageHeader
          eyebrow="Explore CampusSphere"
          title="What do you need today?"
          description="Each workspace shares the same student profile and security foundation."
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {campusModules.map((module, index) => {
            const Icon = module.icon;

            return (
              <Link
                key={module.key}
                href={module.href}
                className="group flex min-h-56 flex-col rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(31,41,79,0.04)] transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`grid size-11 place-items-center rounded-2xl ${module.surfaceClass}`}>
                    <Icon className={`size-5 ${module.iconClass}`} strokeWidth={2} />
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">0{index + 1}</span>
                </div>
                <h2 className="mt-6 text-base font-extrabold tracking-[-0.02em] text-ink">{module.shortTitle}</h2>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{module.description}</p>
                <span className="mt-auto flex items-center justify-between pt-5 text-xs font-bold text-brand">
                  Open workspace
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-7">
          <p className="text-xs font-extrabold text-slate-800">Quick paths</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {campusModules.slice(0, 3).map((module) => (
              <Link
                key={module.key}
                href={module.href}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {module.features[0]}
                <ArrowUpRight className="mt-4 size-4" />
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-7">
          <p className="text-xs font-extrabold text-slate-800">Live activity</p>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-7 text-center">
            <p className="text-sm font-bold text-slate-700">Nothing to show yet</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Your real campus activity will collect here as modules go live.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
