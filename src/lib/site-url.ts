import "server-only";

import { headers } from "next/headers";

function normalizeUrl(value?: string | null) {
  if (!value) return null;

  const candidate = value.startsWith("http") ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    return url.origin;
  } catch {
    return null;
  }
}

export async function getSiteUrl() {
  const configuredUrl = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (configuredUrl) return configuredUrl;

  const vercelUrl = normalizeUrl(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL,
  );
  if (vercelUrl) return vercelUrl;

  const requestHeaders = await headers();
  const requestOrigin = normalizeUrl(requestHeaders.get("origin"));

  return requestOrigin ?? "http://localhost:3000";
}
