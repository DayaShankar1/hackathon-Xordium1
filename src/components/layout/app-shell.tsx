"use client";

import { Bell, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand } from "@/components/ui/brand";
import { appNavItems } from "@/lib/site";

export type ShellProfile = {
  displayName: string;
  email?: string;
  role: "student" | "admin";
};

type AppShellProps = {
  children: React.ReactNode;
  profile: ShellProfile;
};

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CS";
}

function isActiveRoute(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/app";
  }

  return pathname.startsWith(href);
}

export function AppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname();
  const activeItem = appNavItems.find((item) => isActiveRoute(pathname, item.href));

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-slate-200/80 bg-white px-4 py-5 lg:flex">
        <div className="px-2">
          <Brand />
        </div>

        <div className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace</div>
        <nav className="mt-3 space-y-1" aria-label="Application navigation">
          {appNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  active
                    ? "bg-brand-soft text-brand-strong"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon
                  className={`size-[18px] transition ${active ? "text-brand" : "text-slate-400 group-hover:text-slate-600"}`}
                  strokeWidth={active ? 2.3 : 2}
                />
                <span className="flex-1">{item.label}</span>
                {active && <span className="size-1.5 rounded-full bg-brand" />}
              </Link>
            );
          })}

          {profile.role === "admin" && (
            <Link
              href="/app/admin"
              className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                pathname.startsWith("/app/admin")
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="size-[18px]" />
              <span className="flex-1">Admin Panel</span>
              <ChevronRight className="size-3.5 opacity-60" />
            </Link>
          )}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <Link
            href="/app/profile"
            className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-xs font-bold text-white">
              {initialsFor(profile.displayName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-slate-800">{profile.displayName}</span>
              <span className="mt-0.5 block truncate text-[10px] font-medium capitalize text-slate-400">{profile.role} account</span>
            </span>
            <ChevronRight className="size-3.5 text-slate-400" />
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:h-[72px] lg:px-8 xl:px-10">
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="hidden lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">CampusSphere</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{activeItem?.label ?? "Student workspace"}</p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/app/notifications"
                className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                aria-label="Open notifications"
              >
                <Bell className="size-[18px]" />
              </Link>
              <Link
                href="/app/profile"
                className="grid size-10 place-items-center rounded-xl bg-ink text-xs font-bold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 lg:hidden"
                aria-label="Open profile"
              >
                {initialsFor(profile.displayName)}
              </Link>
              <Link
                href="/app/profile"
                className="hidden items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:flex"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-ink text-[10px] font-bold text-white">
                  {initialsFor(profile.displayName)}
                </span>
                <span className="max-w-32 truncate text-xs font-bold text-slate-700">{profile.displayName}</span>
              </Link>
            </div>
          </div>

          <nav className="scrollbar-none flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden" aria-label="Mobile application navigation">
            {appNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                    active ? "bg-brand text-white" : "bg-slate-50 text-slate-500"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
            {profile.role === "admin" && (
              <Link
                href="/app/admin"
                className="flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <ShieldCheck className="size-3.5" />
                Admin
              </Link>
            )}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">{children}</main>
      </div>
    </div>
  );
}
