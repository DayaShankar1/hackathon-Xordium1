import {
  Bell,
  BookOpenText,
  CalendarDays,
  CircleUserRound,
  LayoutDashboard,
  SearchCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type AppNavItem = {
  label: string;
  href:
    | "/dashboard"
    | "/app/lost-found"
    | "/app/resources"
    | "/app/events"
    | "/app/marketplace"
    | "/app/campus-fix"
    | "/app/notifications"
    | "/app/profile";
  icon: LucideIcon;
};

export const appNavItems: AppNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Lost & Found", href: "/app/lost-found", icon: SearchCheck },
  { label: "Resource Hub", href: "/app/resources", icon: BookOpenText },
  { label: "ClubConnect", href: "/app/events", icon: CalendarDays },
  { label: "Marketplace", href: "/app/marketplace", icon: ShoppingBag },
  { label: "CampusFix", href: "/app/campus-fix", icon: Wrench },
  { label: "Notifications", href: "/app/notifications", icon: Bell },
  { label: "My Profile", href: "/app/profile", icon: CircleUserRound },
];

export type ModuleKey =
  | "lost-found"
  | "resources"
  | "events"
  | "marketplace"
  | "campus-fix";

export type CampusModule = {
  key: ModuleKey;
  title: string;
  shortTitle: string;
  description: string;
  href:
    | "/app/lost-found"
    | "/app/resources"
    | "/app/events"
    | "/app/marketplace"
    | "/app/campus-fix";
  icon: LucideIcon;
  iconClass: string;
  surfaceClass: string;
  features: string[];
};

export const campusModules: CampusModule[] = [
  {
    key: "lost-found",
    title: "Campus Lost & Found",
    shortTitle: "Lost & Found",
    description:
      "Report missing items, share what you found, and reconnect belongings with their owners.",
    href: "/app/lost-found",
    icon: SearchCheck,
    iconClass: "text-indigo-700",
    surfaceClass: "bg-indigo-50",
    features: ["Lost and found reports", "Category and location filters", "Private claim flow"],
  },
  {
    key: "resources",
    title: "Academic Resource Hub",
    shortTitle: "Resource Hub",
    description:
      "Keep notes, previous-year questions, and trusted study material easy to discover.",
    href: "/app/resources",
    icon: BookOpenText,
    iconClass: "text-sky-700",
    surfaceClass: "bg-sky-50",
    features: ["PDF and material uploads", "Subject and semester filters", "Private file access"],
  },
  {
    key: "events",
    title: "ClubConnect",
    shortTitle: "Clubs & Events",
    description:
      "Discover campus communities, find upcoming events, and reserve your place in seconds.",
    href: "/app/events",
    icon: CalendarDays,
    iconClass: "text-violet-700",
    surfaceClass: "bg-violet-50",
    features: ["Club directory", "Event registration", "Capacity tracking"],
  },
  {
    key: "marketplace",
    title: "Campus Marketplace",
    shortTitle: "Marketplace",
    description:
      "Buy and sell student essentials through a safer, campus-focused listing experience.",
    href: "/app/marketplace",
    icon: ShoppingBag,
    iconClass: "text-amber-700",
    surfaceClass: "bg-amber-50",
    features: ["Student listings", "Condition and price filters", "Safe inquiry flow"],
  },
  {
    key: "campus-fix",
    title: "CampusFix",
    shortTitle: "CampusFix",
    description:
      "Report campus issues with context and follow each update from submission to resolution.",
    href: "/app/campus-fix",
    icon: Wrench,
    iconClass: "text-emerald-700",
    surfaceClass: "bg-emerald-50",
    features: ["Guided issue reports", "Status history", "Admin resolution workflow"],
  },
];

export const productPrinciples = [
  { label: "One secure identity", icon: ShieldCheck },
  { label: "Five connected services", icon: Sparkles },
  { label: "Built around campus life", icon: LayoutDashboard },
];

export function getCampusModule(key: ModuleKey) {
  const campusModule = campusModules.find((item) => item.key === key);

  if (!campusModule) {
    throw new Error(`Unknown CampusSphere module: ${key}`);
  }

  return campusModule;
}
