# Technical Architecture

## 1. Overview

CampusSphere is a Next.js App Router application backed by Supabase. Server Components handle protected initial rendering, Client Components provide interactive UI, and Supabase SSR stores sessions in cookies.

```text
Browser (Next.js Client Components)
        |
        | Cookie-backed Supabase session
        v
Next.js App Router (Server Components, Actions, Route Handlers)
        |
        | Supabase JS client (publishable key + user JWT)
        v
Supabase
  ├── Auth          - sign-in, sign-up, sessions
  ├── PostgreSQL    - profiles and module records
  ├── Storage       - item, resource and issue images/files
  └── Realtime      - selected live updates
```

Do not add a custom Express server for the hackathon MVP unless a genuine requirement cannot be handled safely through Supabase.

## 2. Frontend structure

Organize by feature. Keep shared UI and infrastructure separate.

- `src/app/`: App Router layouts, pages, route handlers, loading and error boundaries.
- `src/components/`: shared layout, marketing, UI and feedback components.
- `src/features/`: module-specific schemas, actions, components, hooks and service functions.
- `src/lib/`: environment checks, shared metadata and utilities.
- `src/utils/supabase/`: browser, server and session-refresh clients.
- `src/proxy.ts`: Next.js 16 session refresh boundary.
- `src/types/`: generated or shared TypeScript types as modules are implemented.

Each feature should own its queries/mutations in a small service file rather than placing Supabase calls throughout JSX.

Lost & Found follows this structure in `src/features/lost-found/`: schemas and constants define the contract, `queries.ts` handles reads and signed URLs, `actions.ts` handles authenticated mutations, and `storage.ts` owns browser uploads and cleanup.

## 3. Authentication flow

1. User signs up or signs in through a validated Server Action and Supabase Auth.
2. Database trigger creates a `profiles` row for the new auth user.
3. `src/proxy.ts` calls `getClaims()` to verify and refresh cookie sessions.
4. The protected `/app` layout verifies claims again before rendering private UI.
5. Admin layouts additionally query the database-backed profile role.
6. RLS policies enforce authorization for every database or Storage operation.

A hidden admin route is not security. The server route check improves UX, but the database must still reject unauthorized writes.

## 4. Data flow

For a typical create flow:
1. Validate form values in the browser.
2. Upload optional file to the correct Storage bucket.
3. Insert metadata row into the relevant table.
4. If the insert fails after upload, attempt to remove the orphaned file or clearly handle it.
5. Show success only after the database operation succeeds.
6. Refresh/invalidate the list query.

## 5. Storage buckets

Create private buckets by default:
- `lost-found`
- `resources`
- `marketplace`
- `campus-fix`
- `avatars`

For a fast public demo, public read access may be enabled only for non-sensitive listing images and public resource files. Never store identity documents or sensitive personal information in public buckets.

Prefer signed URLs for private files. Validate allowed MIME types and file size in the UI and enforce storage policies.

## 6. Realtime

Use Supabase Realtime only where it improves the demo:
- New CampusFix status updates.
- New event or announcement updates if time permits.

Do not make the entire app depend on realtime. Every view must work with normal fetch/refresh if realtime is unavailable.

## 7. Error handling

Create consistent helpers for:
- Authentication errors.
- RLS/permission errors.
- Upload failures.
- Network errors.
- Validation errors.

Show human-readable feedback. Log technical details to the browser console during development, but do not expose secrets.

## 8. Deployment

- Frontend: Vercel.
- Supabase: hosted Supabase project.
- Set environment variables in Vercel.
- Configure allowed redirect URLs in Supabase Auth.
- Test the deployed site, not only localhost.
- Use a separate admin account for judging.

## 9. Security checklist

- RLS enabled on all public-schema tables.
- Student role assigned by database default.
- No client-side role escalation.
- No service-role key in frontend.
- File upload policies restrict bucket/path and size where supported.
- Users can update/delete only their own records unless admin.
- Public queries select only fields intended for public display.
- Private email/phone are not exposed in public listing queries.
- Validate all user-controlled strings and URLs.
