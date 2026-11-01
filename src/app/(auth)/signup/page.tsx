import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConfigurationRequired } from "@/components/shared/configuration-required";
import { AuthForm } from "@/features/auth/auth-form";
import { getVerifiedClaims } from "@/features/auth/session";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Create an account",
};

export default async function SignupPage() {
  if (!isSupabaseConfigured()) {
    return <ConfigurationRequired />;
  }

  if (await getVerifiedClaims()) {
    redirect("/dashboard");
  }

  return (
    <div className="w-full max-w-[420px]">
      <p className="text-xs font-bold uppercase tracking-[0.19em] text-brand">Join your campus</p>
      <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-ink sm:text-4xl">Create your student account.</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">One secure profile for every CampusSphere service.</p>
      <AuthForm mode="signup" />
    </div>
  );
}
