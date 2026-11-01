import type { Metadata } from "next";

import { ModuleFoundation } from "@/components/shared/module-foundation";
import { getCampusModule } from "@/lib/site";

export const metadata: Metadata = { title: "ClubConnect" };

export default function EventsPage() {
  return <ModuleFoundation module={getCampusModule("events")} />;
}
