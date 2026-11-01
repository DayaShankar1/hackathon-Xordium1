import { redirect } from "next/navigation";

import { AppShell, type ShellProfile } from "@/components/layout/app-shell";
import { ConfigurationRequired } from "@/components/shared/configuration-required";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type ProfileRow = {
  display_name: string;
  role: string;
};

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) {
    return <ConfigurationRequired />;
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const [{ data }, staff] = await Promise.all([
    supabase.from("profiles").select("display_name, role").eq("id", userId).maybeSingle<ProfileRow>(),
    supabase.from("campus_fix_contacts").select("id").eq("profile_id", userId).eq("is_active", true).maybeSingle(),
  ]);

  const email = typeof claims?.email === "string" ? claims.email : undefined;
  const emailName = email?.split("@")[0]?.replace(/[._-]+/g, " ") || "Student";
  const profile: ShellProfile = {
    displayName: data?.display_name || emailName,
    email,
    isStaff: Boolean(staff.data),
    role: data?.role === "admin" ? "admin" : "student",
  };

  return <AppShell profile={profile}>{children}</AppShell>;
}
