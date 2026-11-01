# Product Requirements Document (PRD)

## 1. Product overview

**Product:** CampusSphere
**Tagline:** One campus. Everything connected.
**Track:** Track 2 – Build for Your Campus
**Primary users:** Students
**Secondary users:** Club coordinators and campus administrators

CampusSphere combines five high-frequency campus utility workflows into one coherent application. The platform should reduce friction caused by scattered WhatsApp groups, notice boards, informal buying/selling channels and disconnected complaint processes.

## 2. Problem statement

Students often rely on multiple disconnected channels to:
- Recover lost belongings.
- Find notes, PDFs and previous-year questions.
- Discover clubs and register for events.
- Buy or sell used student essentials.
- Report hostel, classroom, Wi-Fi and infrastructure issues.

Information becomes difficult to find, ownership is unclear, and students cannot easily track what happened after submitting a request.

**Validation requirement:** Before claiming this is a proven campus-wide problem, interview at least three students. Record the exact pain points and avoid claiming all students experience every problem.

## 3. Product promise

A student can sign in once and access five useful campus services through one consistent interface.

## 4. User personas

### Student
Needs to find resources, report items, discover events, exchange essentials and track issue reports.

### Club coordinator
Needs to publish events and view registrations.

### Administrator
Needs to moderate content, manage reports and update issue statuses.

## 5. Product modules and requirements

### 5.1 Unified dashboard
- Welcome message and profile summary.
- Quick actions for all five modules.
- Recent activity and notifications.
- Upcoming events.
- Recent campus announcements or issue updates.
- Search entry point.

### 5.2 Lost & Found
**Student can:**
- Create a lost or found report.
- Add title, description, category, date, location and optional image.
- Browse and filter reports.
- Open a report detail page.
- Submit a claim or contact request without exposing private contact details publicly.
- Mark their own report resolved when appropriate.

**Admin can:**
- Hide inappropriate or duplicate reports.
- Review claims and reported content.

**MVP acceptance criteria:**
- A signed-in student can submit a report with valid required fields.
- The report appears in the feed after successful save.
- Image upload works or the form gracefully supports no image.
- Filters for Lost / Found and category work.

### 5.3 Academic Resource Hub
**Student can:**
- Upload a resource with title, subject, semester, resource type, description and file.
- Browse and filter resources.
- Preview metadata and download the file.
- Report an incorrect or inappropriate resource.

**MVP acceptance criteria:**
- Resource metadata is stored in PostgreSQL.
- File is stored in Supabase Storage.
- Only permitted file types and reasonable file sizes are accepted.
- A resource can be found by subject or semester.

### 5.4 ClubConnect
**Student can:**
- Browse clubs and events.
- View event details, date, venue, description and organizer.
- Register and cancel registration.
- See their registered events.

**Coordinator/admin can:**
- Create and edit events (admin-only in the first MVP if coordinator role is not implemented).
- View registration counts.

**MVP acceptance criteria:**
- A student can register once per event.
- Duplicate registration is prevented by a database unique constraint.
- Event capacity is shown when configured.

### 5.5 Campus Marketplace
**Student can:**
- Create a listing for an item.
- Add title, description, category, condition, price and images.
- Browse and filter listings.
- Mark their own listing as sold or unavailable.
- Send an in-app inquiry or use a safe contact flow.

**MVP acceptance criteria:**
- Listing creation and browsing work.
- Price and condition are visible.
- Public pages do not reveal private email/phone by default.
- No payment processing is included in the MVP.

### 5.6 CampusFix
**Student can:**
- Submit a campus issue with category, location, description and optional image.
- View their submitted issues and current status.
- See status history or latest update.

**Admin can:**
- View all issues.
- Change status: Submitted → In Review → In Progress → Resolved (or Rejected).
- Add an update note.

**MVP acceptance criteria:**
- Student can create an issue and see it in “My Reports”.
- Admin can change its status.
- Student sees the latest status after refresh or realtime update.

### 5.7 Authentication and profile
- Email/password sign-up and sign-in through Supabase Auth.
- Profile row created for each user.
- Display name and optional avatar.
- Roles: `student`, `admin`. Default new users to `student`.
- Admin role must be assigned securely from Supabase SQL/dashboard, never by trusting a client-side role selector.

### 5.8 Notifications
MVP: in-app notification list for event updates, claim/inquiry updates and issue status changes. If notification automation takes too long, implement issue status updates first and use a simple recent-activity feed.

## 6. Navigation and pages

- `/` – Landing page
- `/auth` – Sign in / sign up
- `/app` – Dashboard
- `/app/lost-found`
- `/app/lost-found/new`
- `/app/lost-found/:id`
- `/app/resources`
- `/app/resources/new`
- `/app/events`
- `/app/events/:id`
- `/app/marketplace`
- `/app/marketplace/new`
- `/app/marketplace/:id`
- `/app/campus-fix`
- `/app/campus-fix/new`
- `/app/profile`
- `/app/admin` – Admin-only

## 7. Non-functional requirements

- Mobile-first responsive layout.
- Clear loading, empty, success and error states.
- Accessible labels, keyboard navigation and adequate contrast.
- Avoid unnecessary animations that slow the app.
- Use reusable components and typed data models.
- Protect all data using RLS, not just hidden UI controls.
- Use realistic seeded demo records, clearly identified as sample data.

## 8. Out of scope for the hackathon MVP

- Payments and escrow.
- Delivery or logistics.
- Private real-time chat.
- Complex club membership workflows.
- Native mobile application.
- AI recommendations or chatbot unless all core flows are complete.
- College ERP integrations.

## 9. Demo acceptance checklist

A judge should be able to:
1. Open the deployed app on a phone.
2. Sign in with a demo account.
3. Navigate to all five modules.
4. Create a lost/found report.
5. Find and download a sample resource.
6. Register for an event.
7. Browse a marketplace listing.
8. Submit a CampusFix issue.
9. See an admin update its status using a separate admin account.

If time is short, prioritize the first, third, fifth, seventh and eighth flows, then demonstrate the remaining modules with seeded data.
