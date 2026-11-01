export const MARKETPLACE_PAGE_SIZE = 12;
export const MARKETPLACE_BUCKET = "marketplace";
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const MARKETPLACE_CATEGORIES = [
  { value: "textbooks", label: "Textbooks & Notes" },
  { value: "electronics", label: "Electronics & Gadgets" },
  { value: "cycles", label: "Cycles & Mobility" },
  { value: "furniture", label: "Hostel Furniture" },
  { value: "stationery", label: "Stationery & Lab Tools" },
  { value: "clothing", label: "Apparel & Uniforms" },
  { value: "other", label: "Other Essentials" },
] as const;

export type MarketplaceCategoryValue = (typeof MARKETPLACE_CATEGORIES)[number]["value"];

export const ITEM_CONDITIONS = [
  { value: "new", label: "Brand New", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "like_new", label: "Like New", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "good", label: "Good Condition", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "fair", label: "Fair / Usable", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
] as const;

export type ItemConditionValue = (typeof ITEM_CONDITIONS)[number]["value"];

export const LISTING_STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  available: { label: "Available", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  sold: { label: "Sold Out", badgeClass: "bg-slate-100 text-slate-600 border-slate-200" },
  hidden: { label: "Hidden", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" },
};

