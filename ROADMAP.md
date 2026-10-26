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
- [ ] Admin can manage cities and attractions.
- [ ] Admin can change attraction order.
- [ ] Changes appear in the public catalog.
- [ ] Regular users cannot access admin operations.
- [ ] Guests cannot access admin operations.
- [ ] Database RLS prevents unauthorized writes.
- [ ] Deleting a city handles related
