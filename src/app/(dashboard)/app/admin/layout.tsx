import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/utils/supabase/server";

type RoleRow = {
  role: string;
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  if (!userId) {
    redirect("/login");
  }

  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle<RoleRow>();

  if (data?.role !== "admin") {
    redirect("/dashboard");
  }

  return children;
}
