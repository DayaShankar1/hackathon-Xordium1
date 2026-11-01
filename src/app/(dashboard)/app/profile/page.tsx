import { CalendarDays, LogOut, Mail, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { signOutAction } from "@/features/auth/actions";
import { ProfileForm } from "@/features/auth/profile-form";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: "My Profile" };

type ProfileRow = {
  display_name: string;
  role: string;
  created_at: string;
};

function formatJoinedDate(value?: string) {
  if (!value) return "Profile date unavailable";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ signout?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  if (!userId) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("display_name, role, created_at")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();
  const params = await searchParams;
  const email = typeof claims?.email === "string" ? claims.email : "Email unavailable";
  const displayName = data?.display_name || "Student";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Student profile"
        title="Your CampusSphere identity."
        description="The profile shared safely across each campus service."
      />

      {params.signout === "failed" && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          Sign out could not be completed. Please try again.
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-7 text-center shadow-[0_12px_38px_rgba(31,41,79,0.04)]">
          <span className="mx-auto grid size-20 place-items-center rounded-[24px] bg-[#24234d] text-2xl font-black text-white">
            {displayName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("") || "CS"}
          </span>
          <h2 className="mt-5 text-xl font-black tracking-[-0.025em] text-ink">{displayName}</h2>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-strong">
            <ShieldCheck className="size-3" />
            {data?.role === "admin" ? "Admin" : "Student"}
          </span>
          <form action={signOutAction} className="mt-7">
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_12px_38px_rgba(31,41,79,0.04)] sm:p-8">
          <h2 className="text-lg font-extrabold tracking-[-0.02em] text-ink">Account details</h2>
          <ProfileForm displayName={displayName} />
          <dl className="mt-6 divide-y divide-slate-100">
            <div className="flex items-center gap-4 py-4 first:pt-0">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500">
                <Mail className="size-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Email</dt>
                <dd className="mt-1 truncate text-sm font-bold text-slate-700">{email}</dd>
              </div>
            </div>
            <div className="flex items-center gap-4 py-4 last:pb-0">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500">
                <CalendarDays className="size-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Joined</dt>
                <dd className="mt-1 text-sm font-bold text-slate-700">{formatJoinedDate(data?.created_at)}</dd>
              </div>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
