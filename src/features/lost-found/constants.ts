export const LOST_FOUND_CATEGORIES = [
  "Electronics",
  "IDs & Cards",
  "Keys",
  "Books & Notes",
  "Clothing",
  "Bags",
  "Accessories",
  "Other",
] as const;

export const LOST_FOUND_PAGE_SIZE = 12;
export const LOST_FOUND_BUCKET = "lost-found";
export const MAX_ITEM_IMAGES = 3;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
