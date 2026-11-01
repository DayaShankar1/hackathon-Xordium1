"use client";

import { motion } from "framer-motion";
import { Bell, ChevronRight, Search } from "lucide-react";

import { campusModules } from "@/lib/site";

export function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[640px] lg:mx-0"
    >
      <div className="absolute -inset-8 -z-10 rounded-full bg-brand/10 blur-3xl" />
      <div className="overflow-hidden rounded-[28px] border border-white/75 bg-white/90 p-2 shadow-[0_32px_90px_rgba(35,40,88,0.17)] ring-1 ring-slate-900/5 backdrop-blur">
        <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-[#f8f9fd]">
          <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg bg-brand text-[10px] font-bold text-white">
                CS
              </span>
              <div>
                <p className="text-[10px] font-bold text-slate-800">Student workspace</p>
                <p className="text-[8px] font-medium text-slate-400">Product preview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[8px] font-medium text-slate-400 sm:flex">
                <Search className="size-3" />
                Search CampusSphere
              </span>
              <span className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500">
                <Bell className="size-3" />
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="mb-4 overflow-hidden rounded-2xl bg-[#24234d] px-4 py-4 text-white sm:px-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-indigo-200">
                    Your campus, organized
                  </p>
                  <p className="mt-1.5 text-sm font-bold tracking-tight sm:text-base">
                    Everything you need, one sign-in away.
                  </p>
                </div>
                <span className="hidden rounded-full bg-white/10 px-3 py-1 text-[8px] font-semibold text-indigo-100 sm:block">
                  5 services connected
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              {campusModules.map((module, index) => {
                const Icon = module.icon;

                return (
                  <motion.div
                    key={module.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.35 + index * 0.06 }}
                    className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-[0_5px_16px_rgba(34,43,79,0.04)] last:col-span-2 sm:last:col-span-1"
                  >
                    <span className={`grid size-7 place-items-center rounded-lg ${module.surfaceClass}`}>
                      <Icon className={`size-3.5 ${module.iconClass}`} strokeWidth={2} />
                    </span>
                    <p className="mt-2 truncate text-[8px] font-bold text-slate-700">
                      {module.shortTitle}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1.35fr_0.65fr]">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-slate-700">Quick actions</p>
                  <ChevronRight className="size-3 text-slate-400" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    ["Report item", "bg-indigo-50 text-indigo-700"],
                    ["Upload notes", "bg-sky-50 text-sky-700"],
                    ["Report issue", "bg-emerald-50 text-emerald-700"],
                  ].map(([label, classes]) => (
                    <span
                      key={label}
                      className={`rounded-lg px-2 py-2 text-center text-[7px] font-bold ${classes}`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5">
                <p className="text-[9px] font-bold text-slate-700">One profile</p>
                <p className="mt-1.5 text-[8px] leading-relaxed text-slate-400">
                  Shared access across every campus utility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-6 -left-3 hidden rounded-2xl border border-white/80 bg-white p-3 shadow-[0_18px_45px_rgba(31,41,79,0.16)] sm:block"
      >
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
          <div>
            <p className="text-[9px] font-bold text-slate-700">Track every update</p>
            <p className="text-[8px] text-slate-400">Clear status, less uncertainty</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
