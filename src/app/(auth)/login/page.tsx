import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConfigurationRequired } from "@/components/shared/configuration-required";
import { AuthForm } from "@/features/auth/auth-form";
import { getVerifiedClaims } from "@/features/auth/session";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string; password?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <ConfigurationRequired />;
  }

  if (await getVerifiedClaims()) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <div className="w-full max-w-[420px]">
      <p className="text-xs font-bold uppercase tracking-[0.19em] text-brand">Welcome back</p>
      <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-ink sm:text-4xl">Sign in to your campus.</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">Continue to your CampusSphere student workspace.</p>
      {params.password === "updated" && (
        <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold leading-5 text-emerald-700">
          Your password was updated. Sign in with the new password.
        </div>
      )}
      {params.auth === "failed" && (
        <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold leading-5 text-rose-700">
          The authentication link is invalid or expired. Request a new link and try again.
        </div>
      )}
      <AuthForm mode="login" />
    </div>
  );
}
