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

The `lost-found` bucket is converted to private by the Phase 1 migration. Listing photographs are delivered with short-lived signed URLs to authenticated users who can read the parent report. Other bucket policies remain in their starter state until those modules are implemented.

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
5. Confirm tables, RLS and buckets were created.
6. Create an admin test account through normal signup.
7. Find that user's UUID in Authentication → Users.
8. Assign admin role using the SQL command in the schema comments.
9. Add frontend environment variables from `.env.example`.
10. Test using separate student and admin accounts.

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
