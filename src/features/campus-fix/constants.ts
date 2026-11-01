import type { CampusIssueCategory, CampusIssuePriority, CampusIssueStatus } from "@/types/database";

export const CAMPUS_FIX_BUCKET = "campus-fix";
export const CAMPUS_FIX_PAGE_SIZE = 12;
export const MAX_ISSUE_IMAGES = 3;
export const MAX_ISSUE_IMAGE_SIZE = 5 * 1024 * 1024;
export const ISSUE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const ISSUE_CATEGORIES: Array<{ value: CampusIssueCategory; label: string }> = [
  { value: "network", label: "Network / Internet" },
  { value: "computer_lab", label: "Computer Lab" },
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water" },
  { value: "classroom", label: "Classroom" },
  { value: "hostel", label: "Hostel" },
  { value: "library", label: "Library" },
  { value: "washroom", label: "Washroom" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];

export const ISSUE_CATEGORY_VALUES = ["network", "computer_lab", "electricity", "water", "classroom", "hostel", "library", "washroom", "security", "other"] as const satisfies readonly CampusIssueCategory[];

export const ISSUE_PRIORITIES: Array<{ value: CampusIssuePriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const ISSUE_PRIORITY_VALUES = ["low", "medium", "high", "critical"] as const satisfies readonly CampusIssuePriority[];

export const ISSUE_STATUS_LABELS: Record<CampusIssueStatus, string> = {
  submitted: "Submitted",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
  rejected: "Rejected",
};

export const ISSUE_PRIORITY_WEIGHT: Record<CampusIssuePriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const ACTIVE_ISSUE_STATUSES: CampusIssueStatus[] = [
  "submitted",
  "acknowledged",
  "in_progress",
  "reopened",
];
