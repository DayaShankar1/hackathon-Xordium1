import { z } from "zod";

import { ISSUE_CATEGORY_VALUES, ISSUE_IMAGE_TYPES, ISSUE_PRIORITY_VALUES, MAX_ISSUE_IMAGE_SIZE, MAX_ISSUE_IMAGES } from "./constants";

export const issueFieldsSchema = z.object({
  title: z.string().trim().min(5, "Enter at least 5 characters.").max(160, "Keep the title under 160 characters."),
  description: z.string().trim().min(20, "Add at least 20 characters of detail.").max(4000, "Keep the description under 4,000 characters."),
  category: z.enum(ISSUE_CATEGORY_VALUES),
  building: z.string().trim().min(2, "Enter a campus building.").max(120),
  location: z.string().trim().min(2, "Enter a room, lab, floor or precise location.").max(200),
  priority: z.enum(ISSUE_PRIORITY_VALUES),
  isAnonymous: z.boolean(),
  notifyAuthority: z.boolean(),
});

export const evidenceSchema = z.object({
  id: z.string().uuid(),
  object_path: z.string().min(20).max(500),
  file_name: z.string().min(1).max(255).refine((value) => !/[\\/]/.test(value)),
  mime_type: z.enum(ISSUE_IMAGE_TYPES),
  file_size_bytes: z.number().int().min(1).max(MAX_ISSUE_IMAGE_SIZE),
  caption: z.string().trim().max(500).optional(),
});

export const createIssueSchema = issueFieldsSchema.extend({
  id: z.string().uuid(),
  evidence: z.array(evidenceSchema).max(MAX_ISSUE_IMAGES),
  requestId: z.string().uuid(),
});

export const editIssueSchema = issueFieldsSchema.omit({ category: true, isAnonymous: true, notifyAuthority: true }).extend({
  id: z.string().uuid(),
  requestId: z.string().uuid(),
});

export const voteSchema = z.object({ issueId: z.string().uuid(), vote: z.enum(["agree", "disagree"]) });
export const reopenSchema = z.object({ issueId: z.string().uuid(), reason: z.string().trim().min(10).max(1000), requestId: z.string().uuid() });

export const transitionSchema = z.object({
  issueId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  newStatus: z.enum(["acknowledged", "in_progress", "resolved", "closed", "rejected"]),
  note: z.string().trim().min(3).max(4000),
  resolutionNotes: z.string().trim().max(4000).optional(),
  rejectionReason: z.string().trim().max(1000).optional(),
  estimatedResolutionAt: z.string().datetime().optional().nullable(),
  evidence: z.array(evidenceSchema).max(MAX_ISSUE_IMAGES).default([]),
  requestId: z.string().uuid(),
}).superRefine((value, context) => {
  if (value.newStatus === "resolved" && (value.resolutionNotes?.length ?? 0) < 10) {
    context.addIssue({ code: "custom", path: ["resolutionNotes"], message: "Add resolution notes." });
  }
  if (value.newStatus === "rejected" && (value.rejectionReason?.length ?? 0) < 5) {
    context.addIssue({ code: "custom", path: ["rejectionReason"], message: "Add a rejection reason." });
  }
});

export const staffUpdateSchema = z.object({
  issueId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  note: z.string().trim().min(3).max(4000),
  estimatedResolutionAt: z.string().datetime().optional().nullable(),
  evidence: z.array(evidenceSchema).max(MAX_ISSUE_IMAGES).default([]),
  requestId: z.string().uuid(),
});

export const assignmentSchema = z.object({ issueId: z.string().uuid(), contactId: z.string().uuid(), reason: z.string().trim().min(3).max(500), requestId: z.string().uuid() });
export const moderationSchema = z.object({ issueId: z.string().uuid(), action: z.enum(["hide", "restore", "delete", "duplicate"]), reason: z.string().trim().min(5).max(1000), duplicateOf: z.string().uuid().optional().nullable(), requestId: z.string().uuid() });

export const issueFiltersSchema = z.object({
  q: z.string().trim().max(160).catch(""),
  category: z.enum(["all", ...ISSUE_CATEGORY_VALUES]).catch("all"),
  building: z.string().trim().max(120).catch(""),
  location: z.string().trim().max(200).catch(""),
  priority: z.enum(["all", ...ISSUE_PRIORITY_VALUES]).catch("all"),
  status: z.enum(["all", "submitted", "acknowledged", "in_progress", "resolved", "closed", "reopened", "rejected"]).catch("all"),
  dateFrom: z.string().trim().catch(""),
  dateTo: z.string().trim().catch(""),
  sort: z.enum(["newest", "oldest", "supported", "priority"]).catch("newest"),
  view: z.enum(["all", "mine"]).catch("all"),
  page: z.coerce.number().int().positive().catch(1),
});

export const departmentSchema = z.object({ id: z.string().uuid().optional(), code: z.string().trim().regex(/^[a-z0-9-]{2,50}$/), name: z.string().trim().min(2).max(100), description: z.string().trim().max(500).optional(), defaultSlaHours: z.number().int().min(1).max(720), isActive: z.boolean() });
export const categoryRouteSchema = z.object({ category: z.enum(ISSUE_CATEGORY_VALUES), departmentId: z.string().uuid(), defaultPriority: z.enum(ISSUE_PRIORITY_VALUES), isActive: z.boolean() });
export const contactSchema = z.object({ id: z.string().uuid().optional(), departmentId: z.string().uuid(), profileId: z.string().uuid().optional().nullable(), staffName: z.string().trim().min(2).max(100), jobTitle: z.string().trim().max(100).optional(), whatsappNumber: z.string().trim().regex(/^\+[1-9][0-9]{7,14}$/).optional().or(z.literal("")), whatsappConsent: z.boolean(), isActive: z.boolean() });
export const scopeSchema = z.object({ contactId: z.string().uuid(), category: z.enum(ISSUE_CATEGORY_VALUES).optional().nullable(), building: z.string().trim().max(120).optional().nullable() }).refine((value) => value.category || value.building, "Choose a category or building scope.");

export type IssueFormValues = z.infer<typeof issueFieldsSchema>;
export type IssueFilters = z.infer<typeof issueFiltersSchema>;
