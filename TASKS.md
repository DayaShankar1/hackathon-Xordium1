# Hackathon Execution Plan

## Team objective

Ship a working, deployed CampusSphere MVP in 12–24 hours. The team should avoid parallel work on the same files and integrate early.

## Current milestone status

- Milestone 1 foundation: complete and production build verified.
- Framework: Next.js 16 App Router, React 19, TypeScript and Tailwind CSS 4.
- Supabase SSR clients and `proxy.ts`: implemented.
- Responsive landing page, app shell and module route foundations: implemented.
- Sign-up, sign-in, sign-out, recovery, password reset and profile editing: implemented.
- Supabase configuration and Auth endpoint: validated without exposing credentials.
- Database schema: applied; all 10 required tables are visible through PostgREST and anonymous profile insertion is blocked by RLS.
- Real signup, automatic student profile, SSR session persistence, login and logout: verified with email confirmation disabled.
- Duplicate registration and student-to-admin role escalation: correctly rejected.
- Lost & Found persistence, photographs, claims, RLS and cross-account permissions: implemented and verified.
- Next priority: keep other modules untouched until Lost & Found review is complete.

## Suggested roles (4-person team)

### Member A – UI/UX and shared shell
- Design tokens and responsive layout.
- Landing page and dashboard.
- Sidebar, topbar, mobile navigation.
- Shared cards, badges, empty/loading/error states.

### Member B – Student modules
- Lost & Found list and create form.
- Marketplace list and create form.
- Image uploader integration.

### Member C – Supabase and data-heavy modules
- Supabase setup and auth.
- Resource Hub.
- Events and registration.
- Database query/service helpers.

### Member D – CampusFix, admin and integration
- CampusFix report form and status list.
- Admin issue queue.
- Integration, testing and deployment.
- Demo data and presentation.

For a smaller team, combine roles and reduce module depth. For a larger team, assign a dedicated QA/demo owner.

## 12-hour compressed plan

| Time | Deliverable |
|---|---|
| 0–1 h | Agree scope, repo, environment, schema |
| 1–3 h | Auth, app shell, dashboard |
| 3–6 h | Lost & Found, Resource Hub, Marketplace core |
| 6–8 h | Events registration and CampusFix submission |
| 8–9 h | Admin status update and seed data |
| 9–10 h | Responsive QA and RLS checks |
| 10–11 h | Deploy and test live |
| 11–12 h | Rehearse demo, fix critical bugs |

## 24-hour plan

| Time | Deliverable |
|---|---|
| 0–2 h | Scope, repo, schema and Supabase setup |
| 2–5 h | Auth, shared shell and dashboard |
| 5–9 h | Lost & Found and Resource Hub |
| 9–12 h | Events and registration |
| 12–15 h | Marketplace |
| 15–17 h | CampusFix and admin workflow |
| 17–19 h | Notifications and visual polish |
| 19–21 h | RLS, upload and mobile testing |
| 21–22 h | Vercel deployment |
| 22–24 h | Demo rehearsal and contingency |

## GitHub workflow

- `main`: stable, deployable branch.
- `develop`: integration branch if team is comfortable with it.
- Feature branches: `feature/auth`, `feature/lost-found`, `feature/resources`, etc.
- Each person owns a feature folder where possible.
- Pull before starting work and before pushing.
- Commit small working changes.
- Open pull requests; one teammate reviews.
- Avoid editing shared router/config files simultaneously.

Suggested commit messages:
- `feat: add student authentication`
- `feat: implement lost and found reports`
- `feat: add resource uploads`
- `fix: handle failed image uploads`
- `style: improve mobile dashboard`

## Definition of done

A feature is not done merely because its screen exists. It is done when:
- It works on a phone-sized viewport.
- Data persists in Supabase.
- Loading, empty and error states exist.
- Permissions are enforced by RLS.
- The deployed version works.
- Another teammate can test it without help.

## Cut list if behind schedule

Cut in this order:
1. Push/email notifications.
2. Advanced filters.
3. Chat/inquiry system.
4. Complex club management.
5. Realtime updates outside CampusFix.

Do not cut authentication, persistence, the main create/list flows, basic permissions or deployment.
