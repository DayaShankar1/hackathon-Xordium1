# Supabase Database & Storage Plan

The executable starting schema is in `supabase/schema.sql`. It runs in a transaction so a setup error rolls back the schema instead of leaving a partial installation.

## 1. Tables

| Table | Purpose |
|---|---|
| `profiles` | User display name, avatar and role |
| `lost_found_items` | Lost/found reports |
| `lost_found_item_images` | Ordered private Storage references for report photographs |
| `lost_found_claims` | Private ownership claims and review status |
| `resources` | Academic resource metadata |
| `clubs` | Club directory |
| `events` | Club/campus events |
| `event_registrations` | Student event registrations |
| `marketplace_listings` | Buy/sell listings |
| `campus_issues` | Campus issue reports |
| `issue_updates` | Status history and admin notes |
| `campus_issue_evidence` | Private report, progress and resolution images |
| `campus_issue_votes` | One Agree/Disagree vote per student and issue |
| `campus_fix_departments` | Maintenance departments and SLA settings |
| `campus_fix_category_routes` | Category-to-department routing |
| `campus_fix_contacts` | Private authorized maintenance contacts |
| `campus_fix_contact_scopes` | Staff category/building permissions |
| `campus_issue_assignments` | Immutable issue assignment history |
| `campus_fix_notification_logs` | Durable WhatsApp delivery queue and status |
| `campus_fix_notification_events` | Immutable provider callback events |
| `notifications` | In-app notifications |

## 2. Roles

- `student`: default role for all new users.
- `admin`: manually assigned by a trusted project owner in Supabase SQL editor.

Do not allow a user to set their own role through a profile form.

## 3. Storage buckets

Create buckets:
- `lost-found`
- `resources`
- `marketplace`
- `campus-fix`
- `avatars`

The `lost-found`, `resources` and `campus-fix` buckets are private. Files are delivered with short-lived signed URLs to authenticated users who can read the parent record.

## 4. Security and privacy

- Enable RLS for every table.
- Public browsing should expose only records intended for campus users.
- Users can edit/delete only their own records, except admins.
- Users can register/cancel only their own event registrations.
- Admin-only status changes must be enforced in SQL policies.
- Do not store private contact details in publicly selectable fields.
- Lost & Found claim statements and identifying details are visible only to the claimant, report owner and administrators.
- Lost & Found report ownership is immutable and student status transitions are database-controlled.
- Use fictional sample data for the public demo.

## 5. Setup steps

1. Create a Supabase project.
2. Open SQL Editor.
3. Open `supabase/schema.sql`, review it, and run the complete file as one query.
4. Run `supabase/migrations/202611010002_lost_found_foundation.sql` as one query.
5. Run `supabase/migrations/202611010003_resource_hub_foundation.sql` as one query.
6. Run `supabase/migrations/202611010004_campus_fix_foundation.sql` as one query.
7. Run `supabase/migrations/202611010005_campus_fix_timeline_rls_fix.sql` as one query.
8. Run `supabase/migrations/202611010006_campus_fix_authority_notification_preference.sql` as one query.
9. Confirm tables, RLS and buckets were created.
10. Create an admin test account through normal signup.
11. Find that user's UUID in Authentication → Users.
12. Assign admin role using the SQL command in the schema comments.
13. Add frontend environment variables from `.env.example`.
14. Test using separate student, scoped staff and admin accounts.

The schema creates the `profiles` table before profile-dependent helper functions, installs the `on_auth_user_created` trigger, and backfills profiles for Auth users that existed before setup. A separate database trigger prevents authenticated students from changing their own role.

For local authentication emails, add `http://localhost:3000/auth/callback` to Supabase Authentication > URL Configuration > Redirect URLs. Add the deployed callback URL before production testing.

## 6. Lost & Found security model

- Reports start in `open` and visible state.
- Owners may edit their own report, resolve it, or delete it; RLS rejects cross-user changes.
- Approving a private claim atomically marks the report `claimed` and rejects other pending claims.
- Only a report owner or administrator can review claims.
- Resolved timestamps and ownership immutability are enforced by a trigger.
- Images use `<user-id>/<item-id>/<random-file-name>` paths in the private `lost-found` bucket.
- Storage deletion is restricted to the uploader's folder or an administrator.

## 7. Resource Hub security model

- New resources require title, description, subject, branch, semester, type and immutable file metadata.
- Files use `<user-id>/<resource-id>/<random-file-name>` paths in the private `resources` bucket.
- Visible resources are readable by authenticated students; hidden resources remain visible only to the uploader and administrators.
- Uploaders may edit visible metadata and delete their records, but cannot replace files or change moderation fields.
- Administrators may hide, restore or permanently remove resources, with moderation timestamps, actor and reason enforced by a trigger.
- View and download links are signed for five minutes; public bucket URLs are blocked.
- Supported files are PDF, DOC, DOCX, PPT and PPTX up to 20 MB.

## 8. CampusFix security model

- Students submit through a transactional RPC; owner identity, initial status, routing, history and evidence links are server-derived.
- Campus-visible issues expose a reporter label but not the internal reporter UUID. Anonymous reports remain attributable only to the reporter and authorized operators.
- Agree/Disagree votes are upserted through a protected function with one row per student and issue.
- Status changes, staff notes, reopens, assignments and moderation append immutable timeline records.
- Scoped staff can manage only assigned issues or issues matching an active category/building scope.
- Departments, contacts, scopes and moderation are admin-only. WhatsApp numbers are not selectable by ordinary students.
- Evidence uses `<uploader-id>/<issue-id>/<evidence-id>/<random-file>` paths in the private `campus-fix` bucket.
- WhatsApp logs use unique idempotency keys, five-attempt limits, recipient rate limiting and signed callback events.
- Reporters can opt out of notifying the automatically matched authority without selecting staff or exposing private phone numbers.
- Migration `005` replaces the timeline reporter check with a security-definer helper after reporter UUID column access is revoked.
