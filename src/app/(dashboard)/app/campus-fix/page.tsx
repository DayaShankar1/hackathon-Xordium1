import type { Metadata } from "next";

import { ModuleFoundation } from "@/components/shared/module-foundation";
import { getCampusModule } from "@/lib/site";

export const metadata: Metadata = { title: "CampusFix" };

export default function CampusFixPage() {
  return <ModuleFoundation module={getCampusModule("campus-fix")} />;
}
