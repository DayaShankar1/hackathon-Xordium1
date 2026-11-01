import type { Metadata } from "next";

import { ModuleFoundation } from "@/components/shared/module-foundation";
import { getCampusModule } from "@/lib/site";

export const metadata: Metadata = { title: "Marketplace" };

export default function MarketplacePage() {
  return <ModuleFoundation module={getCampusModule("marketplace")} />;
}
