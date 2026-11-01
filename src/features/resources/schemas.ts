import { z } from "zod";

import {
  MAX_RESOURCE_FILE_SIZE,
  RESOURCE_BRANCHES,
  RESOURCE_MIME_TYPES,
  RESOURCE_SEMESTERS,
  RESOURCE_TYPES,
} from "./constants";

export const resourceFieldsSchema = z.object({
  title: z.string().trim().min(3, "Enter at least 3 characters.").max(160, "Keep the title under 160 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Add at least 10 characters of detail.")
    .max(4000, "Keep the description under 4,000 characters."),
  subject: z.string().trim().min(2, "Enter a subject.").max(100, "Keep the subject under 100 characters."),
  branch: z.enum(RESOURCE_BRANCHES),
  semester: z.enum(RESOURCE_SEMESTERS),
  resourceType: z.enum(RESOURCE_TYPES),
});

const filePath = z.string().trim().min(10).max(500);
const fileName = z.string().trim().min(1).max(255).refine((value) => !/[\\/]/.test(value), "File name is invalid.");

export const createResourceSchema = resourceFieldsSchema.extend({
  id: z.string().uuid(),
  filePath,
  fileName,
  mimeType: z.enum(RESOURCE_MIME_TYPES),
  fileSizeBytes: z.number().int().min(1).max(MAX_RESOURCE_FILE_SIZE),
});

export const updateResourceSchema = resourceFieldsSchema.extend({ id: z.string().uuid() });
export const resourceIdSchema = z.string().uuid();

export const moderateResourceSchema = z
  .object({
    id: z.string().uuid(),
    action: z.enum(["hide", "restore"]),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((value) => value.action !== "hide" || (value.reason?.length ?? 0) >= 3, {
    message: "Add a moderation reason.",
    path: ["reason"],
  });

export const resourceFiltersSchema = z.object({
  q: z.string().trim().max(160).catch(""),
  subject: z.string().trim().max(100).catch(""),
  branch: z.enum(["all", ...RESOURCE_BRANCHES]).catch("all"),
  semester: z.enum(["all", ...RESOURCE_SEMESTERS]).catch("all"),
  resourceType: z.enum(["all", ...RESOURCE_TYPES]).catch("all"),
  view: z.enum(["all", "mine"]).catch("all"),
  page: z.coerce.number().int().positive().catch(1),
});

export type ResourceFormValues = z.infer<typeof resourceFieldsSchema>;
export type ResourceFilters = z.infer<typeof resourceFiltersSchema>;
