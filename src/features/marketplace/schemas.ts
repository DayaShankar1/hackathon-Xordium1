import { z } from "zod";

export const marketplaceFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  category: z.string().trim().max(50).optional().default(""),
  condition: z.string().trim().max(50).optional().default(""),
  view: z.enum(["all", "mine", "sold"]).catch("all"),
  page: z.coerce.number().int().positive().catch(1),
});

export type MarketplaceFilters = z.infer<typeof marketplaceFiltersSchema>;

export const createListingSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(100, "Title must be 100 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(2000, "Description must be 2,000 characters or fewer."),
  category: z.string().trim().min(1, "Please choose a category."),
  condition: z.enum(["new", "like_new", "good", "fair"], {
    message: "Please select an item condition.",
  }),
  price: z.coerce
    .number()
    .min(0, "Price cannot be negative.")
    .max(1000000, "Price cannot exceed ₹10,00,000."),
  imagePath: z.string().trim().optional().nullable(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

export const listingIdSchema = z.string().uuid("Invalid listing ID.");
