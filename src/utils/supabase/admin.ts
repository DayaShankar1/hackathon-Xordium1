import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/env";
import { getCampusFixServerEnvironment } from "@/lib/env.server";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const { url } = getSupabaseConfig();
  const { SUPABASE_SECRET_KEY } = getCampusFixServerEnvironment();
  if (!SUPABASE_SECRET_KEY) throw new Error("SUPABASE_SECRET_KEY is not configured.");
  return createClient<Database>(url, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}
