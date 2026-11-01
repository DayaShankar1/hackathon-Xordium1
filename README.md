# CampusSphere

**One campus. Everything connected.**

CampusSphere is a unified campus utility platform for students. It brings five common campus workflows into one responsive web application:

1. Lost & Found
2. Academic Resource Hub
3. ClubConnect (clubs, events and registrations)
4. Campus Marketplace
5. CampusFix (campus issue reporting)

The project is designed for a short hackathon build. Prioritize reliable end-to-end workflows over a large number of unfinished features.

## Product goals

- Give students one place to discover and use useful campus services.
- Make each module independently useful while sharing authentication, profiles, navigation and notifications.
- Demonstrate real value with realistic sample data and measurable outcomes.
- Deliver a live, mobile-friendly demo.

## Tech stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, Storage and Realtime
- Supabase SSR with cookie-based sessions
- React Hook Form and Zod
- Framer Motion, Lucide React and Sonner
- Vercel deployment

## Quick start

```bash
npm install
```

Create `.env.local` using the variable names in `.env.example`. Add the publishable key from the Supabase project's Connect dialog. Never use a service-role key in this file.

Review `supabase/schema.sql`, run it in the Supabase SQL editor, and verify its tables, RLS policies, triggers, and storage buckets before connecting real users.

```bash
npm run dev
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://zdjegvihnwoyimqrfscq.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The publishable key is intentionally not committed. Never expose a Supabase `service_role` key in browser code.

## Current implementation status

Foundation and authentication integration are complete:
- Next.js App Router, TypeScript and Tailwind foundation.
- Responsive marketing page and protected student app shell.
- Route foundations for all five modules, notifications, profile, and admin.
- Supabase browser/server clients and Next.js 16 `proxy.ts` session refresh.
- Verified JWT claims for protected routes and server-side admin role checks.
- Immediate-session Supabase sign-up, sign-in, sign-out, recovery, password reset, and profile editing flows.
- PKCE callback and token-hash confirmation routes with safe redirect validation.
- Honest missing-configuration state; no mocked database writes or records.
- Lost & Found create, browse, search, filter, pagination, detail, edit, resolve, delete and private claim workflows.
- Private Lost & Found photographs with signed URLs and Storage cleanup.
- Resource Hub uploads, search, filters, pagination, details, signed viewing/downloads and owner management.
- Database-enforced Resource Hub moderation with private files and admin hide/restore/remove controls.
- CampusFix issue dashboard, private evidence, community voting, lifecycle timeline, reopen, staff assignment and admin analytics.
- Secure “Contact concerned authority” reporting preference with automatic protected routing.
- Durable server-only WhatsApp notification queue with truthful disabled/failure states and signed Twilio callback handling.

The local publishable key is configured and ignored by Git. Live checks confirm all 10 required tables, immediate signup sessions, automatic student profiles, duplicate-email rejection, cookie-backed session persistence, login, logout, and database-enforced role protection.

## Hackathon MVP scope

**Must work end to end:**
- Sign up / sign in / sign out
- Student profile and role-aware navigation
- Create and browse lost/found reports
- Upload and browse study resources
- Browse events and register
- Create and browse marketplace listings
- Submit and track campus issue reports
- Admin moderation/status updates for demo data
- Responsive dashboard and usable empty/loading/error states

**Can be simplified or mocked if time is short:**
- Email notifications (in-app notifications are enough)
- Payments (do not implement payments in MVP)
- Chat between buyers and sellers (show contact preference safely, or use an inquiry form)
- Advanced search/recommendation
- Push notifications
- Complex club membership approval

## Repository structure

```text
campus-sphere/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── marketing/
│   │   ├── shared/
│   │   └── ui/
│   ├── features/
│   ├── lib/
│   ├── utils/supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── proxy.ts
├── supabase/
│   └── schema.sql
├── .env.example
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Demo data

Seed the project with fictional but realistic campus data:
- 6 lost/found reports
- 8 academic resources
- 4 clubs and 5 events
- 6 marketplace listings
- 5 campus issue reports

Clearly label demo accounts and sample records. Do not use real students' personal information without permission.

## Success metrics for the presentation

Use real measurements from a small student test where possible:
- Time to submit a lost-item report
- Time to find a relevant resource
- Number of steps to register for an event
- Number of students who can complete a task without assistance
- Number of campus users who say they would use the platform

Do not invent impact statistics. If you use simulated data, label it as simulated.

## Important security notes

- Enable Row Level Security (RLS) on every exposed table.
- Use the SQL policies in `supabase/schema.sql` as a starting point and test them with separate student/admin accounts.
- Never place service-role credentials in frontend environment variables.
- Validate user input in the UI and enforce permissions in the database.
- Restrict file type and size in upload flows.
- Do not expose private phone numbers or email addresses in public listings.
