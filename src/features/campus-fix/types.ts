import type { CampusIssuePriority, CampusIssueStatus, TableRow } from "@/types/database";

export type EvidenceView = TableRow<"campus_issue_evidence"> & { signedUrl: string | null };
export type TimelineView = TableRow<"issue_updates"> & { actorName: string };
export type CampusIssueView = Omit<TableRow<"campus_issues">, "user_id"> & {
  departmentName: string;
  isReporter?: boolean;
  canManage?: boolean;
  isAdmin?: boolean;
  actualReporterName?: string;
  evidence?: EvidenceView[];
  timeline?: TimelineView[];
  userVote?: "agree" | "disagree" | null;
  assignments?: TableRow<"campus_issue_assignments">[];
};

export type CampusFixStats = {
  total: number;
  pending: number;
  acknowledged: number;
  inProgress: number;
  resolved: number;
  overdue: number;
};

export type CampusFixDashboard = {
  items: CampusIssueView[];
  total: number;
  page: number;
  pageCount: number;
  stats: CampusFixStats;
  recent: CampusIssueView[];
  mostSupported: CampusIssueView[];
  critical: CampusIssueView[];
  recentlyResolved: CampusIssueView[];
};

export type AnalyticsSummary = {
  categoryDistribution: Array<{ label: string; value: number }>;
  dailyTrend: Array<{ date: string; value: number }>;
  departmentPerformance: Array<{ department: string; resolved: number; total: number }>;
  priorityDistribution: Record<CampusIssuePriority, number>;
  statusDistribution: Record<CampusIssueStatus, number>;
  averageResolutionHours: number | null;
};
