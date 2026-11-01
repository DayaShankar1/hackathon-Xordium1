import "server-only";

import { getVerifiedClaims } from "@/features/auth/session";
import type { ActionResult } from "@/lib/action-result";
import type { CampusIssuePriority, CampusIssueStatus, TableRow } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import { ACTIVE_ISSUE_STATUSES, CAMPUS_FIX_BUCKET, CAMPUS_FIX_PAGE_SIZE, ISSUE_PRIORITY_WEIGHT } from "./constants";
import { issueFiltersSchema, type IssueFilters } from "./schemas";
import type { AnalyticsSummary, CampusFixDashboard, CampusIssueView, EvidenceView, TimelineView } from "./types";

type IssueRow = TableRow<"campus_issues">;
const ISSUE_COLUMNS = "id,reference_id,reporter_name,is_anonymous,notify_authority,title,description,category,building,location,image_path,status,priority,moderation_status,moderation_reason,moderated_by,moderated_at,department_id,assigned_contact_id,assigned_staff_name,estimated_resolution_at,resolution_notes,rejection_reason,duplicate_of_issue_id,resolved_at,closed_at,reopened_at,agree_count,disagree_count,created_at,updated_at,last_activity_at,version";

function queryError(context: string, error: { code?: string; message?: string }) {
  console.error(`[CampusFix] ${context}`, error.code ?? "unknown");
  return "CampusFix data could not be loaded. Please try again.";
}

export async function getCampusFixViewer(): Promise<ActionResult<{ id: string; role: "student" | "admin"; isStaff: boolean }>> {
  const claims = await getVerifiedClaims();
  const userId = claims?.sub;
  if (typeof userId !== "string") return { ok: false, error: "Your session expired. Sign in again." };

  const supabase = await createClient();
  const [profile, contact] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase.from("campus_fix_contacts").select("id").eq("profile_id", userId).eq("is_active", true).maybeSingle(),
  ]);
  if (profile.error || !profile.data) return { ok: false, error: "Your CampusSphere profile could not be loaded." };
  return { ok: true, data: { id: userId, role: profile.data.role, isStaff: Boolean(contact.data) } };
}

async function hydrateIssues(rows: IssueRow[]): Promise<ActionResult<CampusIssueView[]>> {
  if (!rows.length) return { ok: true, data: [] };
  const supabase = await createClient();
  const departmentIds = [...new Set(rows.map((issue) => issue.department_id))];
  const departments = await supabase.from("campus_fix_departments").select("id, name").in("id", departmentIds);
  if (departments.error) return { ok: false, error: queryError("department hydration failed", departments.error) };
  const names = new Map(departments.data.map((department) => [department.id, department.name]));
  return { ok: true, data: rows.map((issue) => ({ ...issue, departmentName: names.get(issue.department_id) ?? "Campus Operations" })) };
}

async function countIssues(builder: PromiseLike<{ error: { code?: string; message?: string } | null; count: number | null }>) {
  const result = await builder;
  return result.error ? null : result.count ?? 0;
}

export async function getCampusFixDashboard(rawFilters: IssueFilters, _viewerId: string): Promise<ActionResult<CampusFixDashboard>> {
  void _viewerId;
  const filters = issueFiltersSchema.parse(rawFilters);
  const supabase = await createClient();
  const from = (filters.page - 1) * CAMPUS_FIX_PAGE_SIZE;
  const to = from + CAMPUS_FIX_PAGE_SIZE - 1;
  let listQuery = supabase.from("campus_issues").select(ISSUE_COLUMNS, { count: "exact" });
  if (filters.view === "mine") {
    listQuery = listQuery.neq("moderation_status", "deleted");
  } else {
    listQuery = listQuery.eq("moderation_status", "visible");
  }
  if (filters.q) listQuery = listQuery.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
  if (filters.category !== "all") listQuery = listQuery.eq("category", filters.category);
  if (filters.building) listQuery = listQuery.ilike("building", `%${filters.building}%`);
  if (filters.location) listQuery = listQuery.ilike("location", `%${filters.location}%`);
  if (filters.priority !== "all") listQuery = listQuery.eq("priority", filters.priority);
  if (filters.status !== "all") listQuery = listQuery.eq("status", filters.status);
  if (filters.dateFrom) listQuery = listQuery.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
  if (filters.dateTo) listQuery = listQuery.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);

  if (filters.sort === "newest") listQuery = listQuery.order("created_at", { ascending: false });
  if (filters.sort === "oldest") listQuery = listQuery.order("created_at", { ascending: true });
  if (filters.sort === "supported") listQuery = listQuery.order("agree_count", { ascending: false }).order("created_at", { ascending: false });

  let data: IssueRow[] = [];
  let total = 0;
  if (filters.sort === "priority" || filters.view === "mine") {
    const result = await listQuery.limit(500);
    if (result.error) return { ok: false, error: queryError("priority list failed", result.error) };
    let filteredRows = result.data as unknown as IssueRow[];
    if (filters.view === "mine") {
      const permissions = await Promise.all(filteredRows.map((issue) => supabase.rpc("campus_fix_issue_permissions", { p_issue_id: issue.id })));
      filteredRows = filteredRows.filter((_, index) => permissions[index].data?.[0]?.is_reporter);
    }
    const sorted = filters.sort === "priority"
      ? filteredRows.sort((a, b) => ISSUE_PRIORITY_WEIGHT[b.priority] - ISSUE_PRIORITY_WEIGHT[a.priority] || Date.parse(b.created_at) - Date.parse(a.created_at))
      : filteredRows;
    total = sorted.length;
    data = sorted.slice(from, to + 1);
  } else {
    const result = await listQuery.range(from, to);
    if (result.error) return { ok: false, error: queryError("issue list failed", result.error) };
    data = result.data as unknown as IssueRow[];
    total = result.count ?? 0;
  }

  const now = new Date().toISOString();
  const [totalCount, pendingCount, acknowledgedCount, progressCount, resolvedCount, overdueCount, recentRows, supportedRows, criticalRows, resolvedRows] = await Promise.all([
    countIssues(supabase.from("campus_issues").select("id", { count: "exact", head: true }).eq("moderation_status", "visible")),
    countIssues(supabase.from("campus_issues").select("id", { count: "exact", head: true }).in("status", ["submitted", "reopened"]).eq("moderation_status", "visible")),
    countIssues(supabase.from("campus_issues").select("id", { count: "exact", head: true }).eq("status", "acknowledged").eq("moderation_status", "visible")),
    countIssues(supabase.from("campus_issues").select("id", { count: "exact", head: true }).eq("status", "in_progress").eq("moderation_status", "visible")),
    countIssues(supabase.from("campus_issues").select("id", { count: "exact", head: true }).in("status", ["resolved", "closed"]).eq("moderation_status", "visible")),
    countIssues(supabase.from("campus_issues").select("id", { count: "exact", head: true }).in("status", ACTIVE_ISSUE_STATUSES).lt("estimated_resolution_at", now).eq("moderation_status", "visible")),
    supabase.from("campus_issues").select(ISSUE_COLUMNS).eq("moderation_status", "visible").order("created_at", { ascending: false }).limit(5),
    supabase.from("campus_issues").select(ISSUE_COLUMNS).eq("moderation_status", "visible").order("agree_count", { ascending: false }).limit(5),
    supabase.from("campus_issues").select(ISSUE_COLUMNS).eq("priority", "critical").eq("moderation_status", "visible").in("status", ACTIVE_ISSUE_STATUSES).order("created_at", { ascending: false }).limit(5),
    supabase.from("campus_issues").select(ISSUE_COLUMNS).eq("status", "resolved").eq("moderation_status", "visible").order("resolved_at", { ascending: false }).limit(5),
  ]);

  const sectionErrors = [recentRows.error, supportedRows.error, criticalRows.error, resolvedRows.error].filter(Boolean);
  if (sectionErrors.length) return { ok: false, error: queryError("dashboard sections failed", sectionErrors[0]!) };

  const allRows = [...data, ...((recentRows.data ?? []) as unknown as IssueRow[]), ...((supportedRows.data ?? []) as unknown as IssueRow[]), ...((criticalRows.data ?? []) as unknown as IssueRow[]), ...((resolvedRows.data ?? []) as unknown as IssueRow[])];
  const uniqueRows = [...new Map(allRows.map((issue) => [issue.id, issue])).values()];
  const hydrated = await hydrateIssues(uniqueRows);
  if (!hydrated.ok) return hydrated;
  const byId = new Map(hydrated.data.map((issue) => [issue.id, issue]));
  const mapRows = (rows: unknown[]) => (rows as IssueRow[]).map((row) => byId.get(row.id)!).filter(Boolean);

  return { ok: true, data: {
    items: data.map((row) => byId.get(row.id)!).filter(Boolean), total, page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / CAMPUS_FIX_PAGE_SIZE)),
    stats: { total: totalCount ?? 0, pending: pendingCount ?? 0, acknowledged: acknowledgedCount ?? 0, inProgress: progressCount ?? 0, resolved: resolvedCount ?? 0, overdue: overdueCount ?? 0 },
    recent: mapRows(recentRows.data ?? []), mostSupported: mapRows(supportedRows.data ?? []), critical: mapRows(criticalRows.data ?? []), recentlyResolved: mapRows(resolvedRows.data ?? []),
  } };
}

export async function getCampusIssue(id: string): Promise<ActionResult<CampusIssueView>> {
  const supabase = await createClient();
  const issueResult = await supabase.from("campus_issues").select(ISSUE_COLUMNS).eq("id", id).maybeSingle();
  if (issueResult.error) return { ok: false, error: queryError("issue detail failed", issueResult.error) };
  if (!issueResult.data) return { ok: false, error: "Issue not found." };
  const issue = issueResult.data as unknown as IssueRow;
  if (issue.moderation_status === "deleted") {
    return { ok: false, error: "This issue has been removed." };
  }

  const [hydrated, evidenceResult, timelineResult, permissionsResult, voteResult, relatedResult, assignmentsResult] = await Promise.all([
    hydrateIssues([issue]),
    supabase.from("campus_issue_evidence").select("*").eq("issue_id", id).order("created_at"),
    supabase.from("issue_updates").select("*").eq("issue_id", id).order("created_at"),
    supabase.rpc("campus_fix_issue_permissions", { p_issue_id: id }),
    supabase.from("campus_issue_votes").select("vote").eq("issue_id", id).maybeSingle(),
    supabase.from("campus_issues").select(ISSUE_COLUMNS).neq("id", id).eq("moderation_status", "visible").or(`category.eq.${issue.category},building.ilike.%${issue.building}%`).limit(3),
    supabase.from("campus_issue_assignments").select("*").eq("issue_id", id).order("assigned_at", { ascending: false }),
  ]);
  if (!hydrated.ok) return hydrated;
  if (evidenceResult.error || timelineResult.error || permissionsResult.error) return { ok: false, error: "Issue details could not be fully loaded." };

  const paths = evidenceResult.data.map((evidence) => evidence.object_path);
  const signed = paths.length ? await supabase.storage.from(CAMPUS_FIX_BUCKET).createSignedUrls(paths, 600) : { data: [], error: null };
  const urlByPath = new Map((signed.data ?? []).filter((item) => item.path && item.signedUrl).map((item) => [item.path!, item.signedUrl]));
  const actorIds = [...new Set(timelineResult.data.map((entry) => entry.actor_id).filter((value): value is string => Boolean(value)))];
  const actors = actorIds.length ? await supabase.from("profiles").select("id, display_name").in("id", actorIds) : { data: [], error: null };
  const actorNames = new Map((actors.data ?? []).map((profile) => [profile.id, profile.display_name]));
  const permissions = permissionsResult.data?.[0];
  const relatedHydrated = relatedResult.error ? { ok: true as const, data: [] } : await hydrateIssues(relatedResult.data as unknown as IssueRow[]);

  return { ok: true, data: {
    ...hydrated.data[0],
    isReporter: permissions?.is_reporter ?? false,
    canManage: permissions?.can_manage ?? false,
    isAdmin: permissions?.is_admin ?? false,
    actualReporterName: permissions?.actual_reporter_name,
    evidence: evidenceResult.data.map((evidence) => ({ ...evidence, signedUrl: urlByPath.get(evidence.object_path) ?? null })) as EvidenceView[],
    timeline: timelineResult.data.map((entry) => ({ ...entry, actorName: entry.actor_id ? actorNames.get(entry.actor_id) ?? "CampusFix staff" : "CampusFix system" })) as TimelineView[],
    userVote: voteResult.data?.vote ?? null,
    assignments: assignmentsResult.error ? [] : assignmentsResult.data ?? [],
    related: relatedHydrated.ok ? relatedHydrated.data : [],
  } as CampusIssueView & { related: CampusIssueView[] } };
}

export async function getCampusFixAdminData(): Promise<ActionResult<{ issues: CampusIssueView[]; departments: TableRow<"campus_fix_departments">[]; routes: TableRow<"campus_fix_category_routes">[]; contacts: TableRow<"campus_fix_contacts">[]; scopes: TableRow<"campus_fix_contact_scopes">[]; notifications: TableRow<"campus_fix_notification_logs">[]; analytics: AnalyticsSummary }>> {
  const viewer = await getCampusFixViewer();
  if (!viewer.ok) return viewer;
  if (viewer.data.role !== "admin") return { ok: false, error: "Administrator access is required." };
  const supabase = await createClient();
  const [issues, departments, routes, contacts, scopes, notifications] = await Promise.all([
    supabase.from("campus_issues").select(ISSUE_COLUMNS).order("created_at", { ascending: false }).limit(1000),
    supabase.from("campus_fix_departments").select("*").order("name"),
    supabase.from("campus_fix_category_routes").select("*").order("category"),
    supabase.from("campus_fix_contacts").select("*").order("staff_name"),
    supabase.from("campus_fix_contact_scopes").select("*").order("created_at"),
    supabase.from("campus_fix_notification_logs").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  const error = issues.error ?? departments.error ?? routes.error ?? contacts.error ?? scopes.error ?? notifications.error;
  if (error) return { ok: false, error: queryError("admin dashboard failed", error) };
  const hydrated = await hydrateIssues((issues.data ?? []) as unknown as IssueRow[]);
  if (!hydrated.ok) return hydrated;
  const statusDistribution = Object.fromEntries(["submitted", "acknowledged", "in_progress", "resolved", "closed", "reopened", "rejected"].map((status) => [status, 0])) as Record<CampusIssueStatus, number>;
  const priorityDistribution = { low: 0, medium: 0, high: 0, critical: 0 } as Record<CampusIssuePriority, number>;
  const categories = new Map<string, number>();
  const daily = new Map<string, number>();
  const departmentMetrics = new Map<string, { total: number; resolved: number }>();
  let resolutionHours = 0;
  let resolutionCount = 0;
  hydrated.data.forEach((issue) => {
    statusDistribution[issue.status]++;
    priorityDistribution[issue.priority]++;
    categories.set(issue.category, (categories.get(issue.category) ?? 0) + 1);
    const day = issue.created_at.slice(0, 10);
    daily.set(day, (daily.get(day) ?? 0) + 1);
    const metric = departmentMetrics.get(issue.departmentName) ?? { total: 0, resolved: 0 };
    metric.total++;
    if (issue.resolved_at) { metric.resolved++; resolutionHours += (Date.parse(issue.resolved_at) - Date.parse(issue.created_at)) / 3600000; resolutionCount++; }
    departmentMetrics.set(issue.departmentName, metric);
  });
  return { ok: true, data: { issues: hydrated.data, departments: departments.data ?? [], routes: routes.data ?? [], contacts: contacts.data ?? [], scopes: scopes.data ?? [], notifications: notifications.data ?? [], analytics: {
    statusDistribution, priorityDistribution,
    categoryDistribution: [...categories].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    dailyTrend: [...daily].sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([date, value]) => ({ date, value })),
    departmentPerformance: [...departmentMetrics].map(([department, value]) => ({ department, ...value })),
    averageResolutionHours: resolutionCount ? resolutionHours / resolutionCount : null,
  } } };
}

export async function getActiveCampusFixContacts(): Promise<ActionResult<TableRow<"campus_fix_contacts">[]>> {
  const viewer = await getCampusFixViewer();
  if (!viewer.ok) return viewer;
  if (viewer.data.role !== "admin") return { ok: false, error: "Administrator access is required." };
  const supabase = await createClient();
  const result = await supabase.from("campus_fix_contacts").select("*").eq("is_active", true).order("staff_name");
  if (result.error) return { ok: false, error: queryError("contacts failed", result.error) };
  return { ok: true, data: result.data ?? [] };
}

export async function getCampusFixStaffIssues(): Promise<ActionResult<CampusIssueView[]>> {
  const viewer = await getCampusFixViewer();
  if (!viewer.ok) return viewer;
  if (!viewer.data.isStaff && viewer.data.role !== "admin") return { ok: false, error: "Authorized staff access is required." };
  const supabase = await createClient();
  const result = await supabase.from("campus_issues").select(ISSUE_COLUMNS).eq("moderation_status", "visible").in("status", ACTIVE_ISSUE_STATUSES).order("priority", { ascending: false }).order("created_at").limit(500);
  if (result.error) return { ok: false, error: queryError("staff queue failed", result.error) };
  const rows = result.data as unknown as IssueRow[];
  const permissions = await Promise.all(rows.map((issue) => supabase.rpc("campus_fix_issue_permissions", { p_issue_id: issue.id })));
  const permitted = rows.filter((_, index) => permissions[index].data?.[0]?.can_manage);
  return hydrateIssues(permitted);
}
