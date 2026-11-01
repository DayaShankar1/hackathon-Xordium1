import { ArrowLeft } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { MarketplaceListingForm } from "@/features/marketplace/listing-form";
import { getMarketplaceViewer } from "@/features/marketplace/queries";

export const metadata: Metadata = { title: "Sell an Item - Campus Marketplace" };

export default async function NewMarketplaceListingPage() {
  const viewer = await getMarketplaceViewer();

  if (!viewer.ok) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={"/app/marketplace" as Route}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-brand"
        >
          <ArrowLeft className="size-4" />
          Back to marketplace
        </Link>
      </div>

      <PageHeader
        eyebrow="Marketplace"
        title="Sell an Item"
        description="List pre-loved textbooks, cycles, stationery, or electronics for other students on campus."
      />

      <MarketplaceListingForm userId={viewer.data.id} />
    </div>
  );
}
