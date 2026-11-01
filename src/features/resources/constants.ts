export const RESOURCE_BUCKET = "resources";
export const RESOURCE_PAGE_SIZE = 12;
export const MAX_RESOURCE_FILE_SIZE = 20 * 1024 * 1024;

export const RESOURCE_BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Electrical",
  "Mechanical",
  "Civil",
  "Business",
  "Sciences",
  "Humanities",
  "Other",
] as const;

export const RESOURCE_SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8", "Other"] as const;

export const RESOURCE_TYPES = ["notes", "pyq", "assignment", "book", "other"] as const;

export const RESOURCE_TYPE_LABELS: Record<(typeof RESOURCE_TYPES)[number], string> = {
  notes: "Notes",
  pyq: "Previous-year questions",
  assignment: "Assignment",
  book: "Book or reference",
  other: "Other material",
};

export const RESOURCE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;
