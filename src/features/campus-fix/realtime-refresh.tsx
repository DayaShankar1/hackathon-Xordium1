"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/utils/supabase/client";

export function CampusFixRealtimeRefresh({ issueId }: { issueId?: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`campus-fix-${issueId ?? "feed"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "campus_issues", ...(issueId ? { filter: `id=eq.${issueId}` } : {}) }, () => router.refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "issue_updates", ...(issueId ? { filter: `issue_id=eq.${issueId}` } : {}) }, () => router.refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [issueId, router]);
  return null;
}
