import type { Metadata } from "next";

import { ModuleFoundation } from "@/components/shared/module-foundation";
import { getCampusModule } from "@/lib/site";

export const metadata: Metadata = { title: "Resource Hub" };

export default function ResourcesPage() {
  return <ModuleFoundation module={getCampusModule("resources")} />;
}
