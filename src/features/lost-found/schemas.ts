import { z } from "zod";

import { LOST_FOUND_CATEGORIES, MAX_ITEM_IMAGES } from "./constants";

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date.")
  .refine((value) => value === "" || value <= new Date().toISOString().slice(0, 10), "Date cannot be in the future.");

export const reportFieldsSchema = z.object({
  itemType: z.enum(["lost", "found"]),
  title: z.string().trim().min(3, "Enter at least 3 characters.").max(100, "Keep the title under 100 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Add at least 10 characters of detail.")
    .max(2000, "Keep the description under 2,000 characters."),
  category: z.enum(LOST_FOUND_CATEGORIES),
  location: z.string().trim().min(2, "Enter a campus location.").max(120, "Keep the location under 120 characters."),
  incidentDate: optionalDate,
});

const storagePathSchema = z.string().trim().min(10).max(500);

export const createReportSchema = reportFieldsSchema.extend({
  id: z.string().uuid(),
  imagePaths: z.array(storagePathSchema).max(MAX_ITEM_IMAGES),
});

export const updateReportSchema = reportFieldsSchema.extend({
  id: z.string().uuid(),
});

export const claimSchema = z.object({
  itemId: z.string().uuid(),
  statement: z
    .string()
    .trim()
    .min(10, "Explain why you believe this item is yours.")
    .max(1000, "Keep the statement under 1,000 characters."),
  identifyingDetails: z
    .string()
    .trim()
    .min(10, "Add a private detail that can verify ownership.")
    .max(1000, "Keep identifying details under 1,000 characters."),
});

export const reviewClaimSchema = z.object({
  claimId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
});

export const itemIdSchema = z.string().uuid();

export const lostFoundFiltersSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  category: z.enum(["all", ...LOST_FOUND_CATEGORIES]).catch("all"),
  location: z.string().trim().max(120).catch(""),
  type: z.enum(["all", "lost", "found", "mine"]).catch("all"),
  status: z.enum(["active", "open", "claimed", "resolved", "all"]).catch("active"),
  page: z.coerce.number().int().positive().catch(1),
});

export type ReportFormValues = z.infer<typeof reportFieldsSchema>;
export type LostFoundFilters = z.infer<typeof lostFoundFiltersSchema>;
