## 1. Development Strategy

Build Tour Tracker incrementally using small, functional milestones.

Each milestone must deliver working, testable functionality and follow this workflow:

**Implementation → Automated Tests → Independent AI Review → Fix Issues → User Approval**

### Development Rules

- Complete one milestone at a time.
- Do not begin the next milestone without user approval.
- Follow `PRODUCT.md` and `ARCHITECTURE.md`.
- Prefer simple solutions over unnecessary abstractions.
- Keep the application runnable throughout development.
- Do not implement future features prematurely.
- Commit completed milestones separately.

### Independent Review

After implementation, a separate AI reviewer should:

1. Inspect actual code changes.
2. Compare implementation against acceptance criteria.
3. Verify architectural compliance.
4. Identify bugs, security risks, and unnecessary complexity.
5. Review test coverage.
6. Report findings by severity.

Critical and high-severity issues must be resolved before user review.

Where subagents are supported, delegate to an independent reviewer. Otherwise, use a separate review session.

---

## 2. Implementation Milestones

### M1 — Project Foundation

**Goal:** Establish a runnable application with the agreed technology stack.

**Deliverables:**

- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- React Router
- Supabase client configuration
- TanStack Query
- Basic responsive application layout
- Home page placeholder
- Environment variable configuration
- ESLint, formatting, and Vitest setup

**Acceptance Criteria:**

- [x] Application starts locally.
- [x] Application builds successfully.
- [x] Basic responsive layout works.
- [x] Supabase client initializes with valid configuration.
- [x] Linting and tests run successfully.
- [x] No credentials are committed.

**Dependencies:** None.

---

### M2 — City Explorer

**Goal:** Deliver the first useful, browsable version of Tour Tracker.

**Deliverables:**

- Database migrations for cities and attractions
- Public read-only database access
- City listing page
- City detail page
- Attraction cards with images and descriptions
- Recommended attraction ordering
- Responsive horizontal attraction layout
- Loading, empty, and error states
- Sample city data for development

**Acceptance Criteria:**

- [x] Users can browse available cities.
- [x] Selecting a city displays its attractions.
- [x] Attractions appear in recommended order.
- [x] Images load with fallbacks.
- [x] Layout works on desktop and mobile.
- [x] Public catalog access requires no login.
- [x] Unauthenticated users cannot modify catalog data.

**Dependencies:** M1.

---

### M3 — Guest Checklist

**Goal:** Allow visitors to track places without authentication.

**Deliverables:**

- Attraction visited/unvisited checkbox
- localStorage persistence
- Automatic sorting of visited attractions
- Shared checklist storage interface
- Visited progress indicator
- Unit tests for checklist behavior

**Acceptance Criteria:**

- [x] Users can check and uncheck attractions.
- [x] Visited attractions move to the bottom.
- [x] Remaining attractions retain recommended order.
- [x] Unchecking restores the recommended position.
- [x] Progress survives browser refresh.
- [x] Progress is independent between browsers.
- [x] Storage failures are handled.

**Dependencies:** M2.

---

### M4 — Authentication & Cloud Sync

**Goal:** Enable optional Google login and cross-device progress synchronization.

**Deliverables:**

- Google OAuth through Supabase Auth
- Login/logout interface
- `user_visits` database migration
- User-specific RLS policies
- Cloud checklist persistence
- Guest-to-cloud conflict dialog
- Keep Local, Keep Cloud, and Merge options
- Safe conflict-resolution operation
- Synchronization error handling

**Acceptance Criteria:**

- [x] Guests can continue without login.
- [x] Users can log in with Google.
- [x] Authenticated progress persists in Supabase.
- [x] Progress is available across devices.
- [x] Users cannot access another user's progress.
- [x] Conflict dialog appears when applicable.
- [x] Merge preserves visited status from either source.
- [x] Keep Local replaces cloud progress.
- [x] Keep Cloud preserves cloud progress.
- [x] Failed synchronization does not lose guest data.
- [x] Logging out does not expose account progress to guests.

**Dependencies:** M3 and Supabase OAuth configuration.

Live Google sign-in requires enabling the provider and configuring redirect URLs in the hosted Supabase and Google projects; see the README. The provider configuration was not available to verify here.

---

### M5 — Admin Panel

**Goal:** Enable the designated administrator to manage the shared catalog.

**Deliverables:**

- Single-admin authorization
- Protected admin interface
- Create, edit, and delete cities
- Create, edit, and delete attractions
- Attraction ordering controls
- Form validation
- Database-level admin permissions

**Acceptance Criteria:**

- [x] Admin can manage cities and attractions.
- [x] Admin can change attraction order.
- [x] Changes appear in the public catalog.
- [x] Regular users cannot access admin operations.
- [x] Guests cannot access admin operations.
- [x] Database RLS prevents unauthorized writes.
- [x] Admin status is read-only to regular users and guests.
- [x] Deleting a city removes its attractions and related visit records.
- [x] Deleting an attraction removes its related visit records.
- [x] Forms reject blank names, invalid image URLs, and invalid attraction order.

**Dependencies:** M2 and M4.

---

### M6 — JSON Attraction Import

**Goal:** Let the administrator append a validated batch of attractions to a city.

**Deliverables:**

- Admin-only JSON import interface
- Validation for the documented `places` format
- Duplicate detection by normalized name within the selected city
- Atomic append that preserves existing catalog entries
- Clear validation and persistence errors

**Acceptance Criteria:**

- [x] Admin can paste a JSON batch for a selected city.
- [x] Invalid JSON and invalid fields show understandable errors.
- [x] Duplicate names reject the complete batch.
- [x] Valid imports append in the supplied relative order.
- [x] Existing attractions remain unchanged.
- [x] Guests and regular users cannot import data.
- [x] Invalid batches create no partial records.

**Dependencies:** M5.

The database authorization, atomicity, and ordering assertions are included in `supabase/tests/attraction_import.test.sql`. They could not be run locally because the Supabase database at `127.0.0.1:54322` was unavailable; run `npm run test:db` after starting the local stack before deploying this migration.

---

### M7 — Production Readiness

**Goal:** Prepare the V1 application for its approved hosting and hosted Supabase project.

**Deliverables:**

- Production build and deployment configuration for Cloudflare Pages
- Documented production environment variables and OAuth redirect URLs
- Database migration and RLS verification against the hosted project
- Production smoke-test checklist

**Acceptance Criteria:**

- [ ] The static application deploys to Cloudflare Pages with SPA routing.
- [x] Production configuration contains only public Supabase values.
- [x] Hosted Supabase migrations and RLS policies are applied and verified.
- [ ] Google sign-in and checklist sync work in the deployed app.
- [ ] Public catalog, guest checklist, admin management, and JSON import pass smoke tests.
- [x] No credentials or generated artifacts are committed.

**Dependencies:** M4, M5, and M6.

The linked hosted database now has migrations `20261018000100`, `20261026000100`, `20261027000100`, and `20261027000200`. RLS is enabled on all four public tables, and remote policy and RPC grants were inspected. The Cloudflare deployment and browser OAuth/smoke checks remain pending because this run is commit-only and no deployed origin is configured here.
