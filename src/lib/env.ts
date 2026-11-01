const placeholderPattern = /(YOUR_|PLACEHOLDER|CHANGEME|REPLACE_ME)/i;

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url?.trim() || !publishableKey?.trim() || placeholderPattern.test(publishableKey)) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.",
    );
  }

  try {
    const parsedUrl = new URL(url);

    if (!parsedUrl.hostname || !["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid Supabase URL.");
    }
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  }

  return { url: url.replace(/\/$/, ""), publishableKey };
}

export function isSupabaseConfigured() {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}
