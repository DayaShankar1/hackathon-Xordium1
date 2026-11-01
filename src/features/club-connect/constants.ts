export const EVENT_PAGE_SIZE = 12;

export const EVENT_CATEGORIES = [
  { value: "technical", label: "Technical & Coding", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "cultural", label: "Cultural & Arts", badgeClass: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "sports", label: "Sports & Fitness", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "academic", label: "Academic & Research", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "social", label: "Social & Community", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "other", label: "General & Other", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
] as const;

export type EventCategoryValue = (typeof EVENT_CATEGORIES)[number]["value"];

export const EVENT_STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  published: { label: "Upcoming", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  draft: { label: "Draft", badgeClass: "bg-slate-100 text-slate-600 border-slate-200" },
  cancelled: { label: "Cancelled", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
};

