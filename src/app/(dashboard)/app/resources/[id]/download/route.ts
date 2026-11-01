import { NextResponse, type NextRequest } from "next/server";

import { getResourceDownload } from "@/features/resources/queries";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getResourceDownload(id);
  if (!result.ok) return NextResponse.redirect(new URL(`/app/resources/${id}?file=unavailable`, request.url));
  return NextResponse.redirect(result.data);
}
