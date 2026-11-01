import { z } from "zod";

export const eventFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  category: z.string().trim().max(50).optional().default(""),
  clubId: z.string().trim().uuid().optional(),
  view: z.enum(["all", "registered", "past"]).catch("all"),
  page: z.coerce.number().int().positive().catch(1),
});

export type EventFilters = z.infer<typeof eventFiltersSchema>;

export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(120, "Title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters.")
    .max(2500, "Description must be 2,500 characters or fewer."),
  venue: z
    .string()
    .trim()
    .min(2, "Venue must be at least 2 characters.")
    .max(120, "Venue must be 120 characters or fewer."),
  startsAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Please provide a valid start date and time."),
  endsAt: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Please provide a valid end date and time."),
  clubId: z.string().uuid().optional().nullable(),
  capacity: z
    .coerce
    .number()
    .int()
    .positive("Capacity must be at least 1 seat.")
    .max(10000, "Capacity cannot exceed 10,000.")
    .optional()
    .nullable(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const eventIdSchema = z.string().uuid("Invalid event ID.");

