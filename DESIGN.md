# Design System & UX Direction

## 1. Design concept

**Direction:** Premium, modern campus super-app.
**Personality:** Trustworthy, energetic, student-friendly, organized.
**Visual goal:** Polished enough to feel like a real product, but simple enough to use immediately.

Avoid a generic admin template. The dashboard should feel like a student-facing product.

## 2. Visual language

- Background: soft neutral (`#F7F8FC`) or deep navy for a dark theme.
- Primary: indigo/violet family.
- Accent: teal or lime used sparingly for positive states.
- Text: high-contrast slate/navy.
- Cards: clean surfaces, subtle borders and restrained shadows.
- Radius: 14–20px for cards; pill shapes for filters and status chips.
- Typography: Inter, Geist or system sans-serif.
- Icons: Lucide React, consistent stroke weight.

Do not use gradients on every component. Use one restrained brand gradient for hero/highlight areas.

## 3. Layout

### Desktop
- Left sidebar with CampusSphere brand and module navigation.
- Top bar with global search, notifications and profile menu.
- Main content with a clear page title, short description and primary action.
- Responsive cards and tables where appropriate.

### Mobile
- Compact top bar.
- Bottom navigation for Dashboard, Explore, Create, Notifications and Profile, or a compact collapsible menu.
- Single-column content.
- Large touch targets and sticky primary actions where useful.

## 4. Core screens

### Landing page
- Brand and concise tagline.
- Hero headline: “Your campus, all in one place.”
- Short explanation of five services.
- Clear “Get started” CTA.
- Product preview using real app UI, not decorative stock photography.

### Dashboard
- Greeting and small profile summary.
- Five module cards with clear labels and descriptions.
- Quick action buttons.
- Upcoming events section.
- Recent activity / issue updates.
- Empty states that explain what to do next.

### Lost & Found
- Tabs: All, Lost, Found, My Reports.
- Search and category filters.
- Item cards with image, title, location, date and status.
- “Report an item” primary CTA.
- Detail view with a safe claim/contact action.

### Resource Hub
- Search first.
- Subject and semester filters.
- Resource cards showing title, subject, semester, type, uploader display name and date.
- Clear download action and file metadata.

### ClubConnect
- Event cards with date block, club, venue and registration status.
- Event detail with description, capacity and register/cancel action.
- “My events” filter.

### Marketplace
- Product grid with image, title, price, condition and category.
- Search and filters.
- “Create listing” CTA.
- Detail page with seller display name and safe inquiry action.

### CampusFix
- Issue form with category and location.
- “My reports” list with visible status chips.
- Admin queue with filters and status update controls.
- Status timeline on issue detail.

### Admin
- Simple moderation dashboard.
- Counts for open issues, pending content and events.
- Tables/lists with actions.
- Keep admin controls visually distinct but consistent.

## 5. Reusable components

- `AppShell`
- `Sidebar`
- `MobileNav`
- `Topbar`
- `PageHeader`
- `ModuleCard`
- `StatCard`
- `SearchInput`
- `FilterChips`
- `StatusBadge`
- `EmptyState`
- `LoadingSkeleton`
- `ErrorState`
- `ConfirmDialog`
- `ImageUploader`
- `FormField`
- `Toast`
- `ProtectedRoute`
- `AdminRoute`

## 6. Interaction rules

- Every button must have a real action.
- Show disabled/loading states during async operations.
- Confirm destructive actions.
- After a successful create action, show confirmation and update the relevant list.
- Preserve form input if a request fails.
- Use optimistic updates only when rollback is handled.
- Do not show fake success for a database operation that failed.

## 7. UX quality bar

A first-time student should understand:
- What CampusSphere does within 5 seconds.
- How to reach each module within 1 click from the dashboard.
- How to complete the main task in each module without instructions.
- Whether their submission succeeded.
- What happens next after submitting a report or registering for an event.
