# Admin Portal Audit – Missing Features & Improvements

**Scope:** Admin portal only. Student Progress and Communities (create/manage) are **teacher** features and are not part of the admin nav.

## Current admin structure

| Section | Route | Status |
|--------|--------|--------|
| Dashboard | `/admin` | ✅ Stats, chart, recent courses |
| User Management | `/admin/users` | ✅ List, ban, unban, delete, change role |
| Teacher Management | `/admin/teachers` | ✅ Teacher applications (approve/reject) |
| Course Management | `/admin/courses` | ✅ List, edit, delete, archive, publish/unpublish |
| Analytics | `/admin/analytics` | ✅ Enrollment chart + dashboard stats |
| Settings | `/admin/settings` | ⚠️ UI only – **no persistence** |

---

## Critical missing / broken

### 1. **Settings don’t persist**
- **What:** Platform name, support email, notification toggles, security toggles, and “Export” are UI-only; no form actions or DB/config storage.
- **Fix:** Either:
  - Add a `PlatformSettings` (or similar) table and server actions to save/load, or
  - Use env-based config and document that these are “display only” until backend is added.

### 2. **No “Create course” on Course Management page**
- **What:** Admin can only reach “Create course” from the dashboard empty state. The main `/admin/courses` page has no “Create course” button.
- **Fix:** Add a primary “Create course” button (linking to `/admin/courses/create`) in the header of `app/admin/courses/page.tsx`.

---

## High‑value improvements

### 3. **Revenue / payments overview**
- **What:** No admin view of payments, revenue, or refunds. Stripe is used for checkout but there’s no admin dashboard for it.
- **Suggestion:** Add an “Revenue” or “Payments” section (e.g. under Analytics or its own nav item) with:
  - Total revenue (from `Enrollment.amount` or Stripe).
  - Recent payments / enrollments.
  - Optional: link to Stripe Dashboard or a simple export.

### 4. **Admin audit log**
- **What:** No record of who did what (e.g. who banned a user, who approved a teacher, who deleted a course).
- **Suggestion:** Add an `AdminAuditLog` (or `ActivityLog`) model and write to it from admin actions (user ban/unban, role change, course delete/archive/publish, teacher approve/reject). Add an “Audit log” or “Activity” page in admin to view and filter.

### 5. **User search and filters**
- **What:** User Management lists all users with no search or filters.
- **Suggestion:** Add search by name/email and filters (e.g. role, banned, has enrollments) and optional pagination for large user lists.

### 6. **Course search and filters**
- **What:** Course Management has no search or status filter.
- **Suggestion:** Add search by title and filters (e.g. status: Published/Draft/Archived, owner/teacher) and optional pagination.

### 7. **Bulk actions**
- **What:** Users and courses are managed one-by-one.
- **Suggestion:** Add checkboxes and bulk actions (e.g. bulk ban/unban, bulk archive, bulk delete) with confirmation.

### 8. **Teacher list beyond applications**
- **What:** “Teacher Management” only shows **applications** (pending/approved/rejected). There’s no list of **all teachers** (e.g. users with role `teacher` or who have created courses).
- **Suggestion:** Add an “All teachers” view (and optionally a tab or sub-nav) with teacher list, courses count, and ability to revoke teacher role.

### 9. **Analytics depth**
- **What:** Analytics is enrollment chart + same dashboard stats (signups, customers, courses, lessons). No signups-over-time, course-level revenue, or top courses.
- **Suggestion:** Add:
  - Signups / new users over time.
  - Revenue over time (if you add revenue tracking).
  - Top courses by enrollments or revenue.
  - Optional: course-level or teacher-level breakdown.

### 10. **Content moderation**
- **What:** No admin UI to review or moderate course content, reviews, or community posts.
- **Suggestion:** Add “Content moderation” or “Reports” (if you add reporting): list of flagged reviews/comments/posts and actions (hide, delete, dismiss).

### 11. **Notifications / announcements**
- **What:** No way for admins to send platform-wide announcements or emails to users/teachers.
- **Suggestion:** Add “Announcements” or “Notifications”: create and send (e.g. via Resend) to all users or by role (students, teachers).

### 12. **Dashboard quick actions**
- **What:** Dashboard shows stats and recent courses but no shortcuts.
- **Suggestion:** Add quick action buttons/cards: “Create course”, “View pending teachers”, “View recent enrollments”, “Open analytics”.

### 13. **Export data**
- **What:** Settings has an “Export” button that does nothing.
- **Suggestion:** Implement export (e.g. users, courses, enrollments) as CSV/Excel and optionally restrict to admins and rate-limit.

### 14. **Role-based admin check consistency**
- **What:** Admin layout uses email lookup for role; `requireAdmin()` redirects to `/not-admin`. Not-admin page exists.
- **Suggestion:** Ensure every admin-only server action and data function calls `requireAdmin()` (or equivalent) so no admin action is callable by non-admins.

### 15. **Admin course edit vs teacher course edit**
- **What:** Admin can edit any course (full content/structure). Teacher can only edit own courses. No “view as teacher” or “preview workflow” for admin.
- **Suggestion:** Optional: “Preview as student” / “View as teacher” links from admin course edit to improve support and verification.

---

## Nice to have

- **Two-factor authentication** for admin accounts (Settings mentions 2FA but it’s not implemented).
- **Session timeout** (Settings toggle) – implement actual session expiry.
- **Platform name / support email** in footer or contact page from DB or env.
- **Categories management** – if courses use categories, add admin CRUD for categories.
- **Email templates** – admin UI to edit (or choose) email templates for transactional emails.
- **Backup / maintenance mode** – simple “maintenance mode” flag that shows a message to non-admins.

---

## Summary checklist

| Priority | Item | Effort |
|----------|------|--------|
| P0 | Add “Create course” on Course Management page | Small |
| P1 | Make Settings save (DB or document limitation) | Medium |
| P2 | Revenue / payments overview | Medium |
| P2 | User and course search/filters | Medium |
| P2 | Audit log for admin actions | Medium |
| P2 | All-teachers list + revoke role | Medium |
| P3 | Richer analytics (signups, top courses) | Medium |
| P3 | Bulk actions (users/courses) | Medium |
| P3 | Export data implementation | Small–Medium |
| P3 | Content moderation / reports | Large |

Use this list to prioritize; P0 items are quick wins that fix clear gaps in the current admin portal.
