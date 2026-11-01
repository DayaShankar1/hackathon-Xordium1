import type { Metadata } from "next";
import Link from "next/link";

import { ConfigurationRequired } from "@/components/shared/configuration-required";
import { ResetPasswordForm } from "@/features/auth/recovery-forms";
import { getVerifiedClaims } from "@/features/auth/session";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  if (!isSupabaseConfigured()) {
    return <ConfigurationRequired />;
  }

  const claims = await getVerifiedClaims();

  return (
    <div className="w-full max-w-[420px]">
      <p className="text-xs font-bold uppercase tracking-[0.19em] text-brand">Secure recovery</p>
      <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-ink sm:text-4xl">Choose a new password.</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Use a unique password with at least eight characters.
      </p>
      {claims ? (
        <ResetPasswordForm />
      ) : (
        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
          This recovery session is missing or expired.{" "}
          <Link href="/forgot-password" className="font-bold underline underline-offset-2">
            Request a new reset link.
          </Link>
        </div>
      )}
    </div>
  );
}
