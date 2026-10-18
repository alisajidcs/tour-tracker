## 1. Architecture Overview

Tour Tracker is a lightweight, publicly accessible web application for exploring cities, viewing recommended attractions, and tracking visited places.

The architecture prioritizes simplicity, low hosting costs, and minimal maintenance.

### Technology Stack

| Layer          | Technology                   |
| -------------- | ---------------------------- |
| Frontend       | React + Vite + TypeScript    |
| UI             | Tailwind CSS + shadcn/ui     |
| Backend        | Supabase                     |
| Database       | Supabase PostgreSQL          |
| Authentication | Supabase Auth (Google OAuth) |
| Guest storage  | Browser localStorage         |
| Hosting        | Cloudflare Pages             |
| Images         | External image URLs          |

No separate backend server is required for V1.

## 2. System Architecture

React Web Application

Vite · TypeScript · Tailwind · shadcn/ui

Guest progress

Browser localStorage

Visited checklists

API / Auth

Supabase

PostgreSQL

Google OAuth

Row Level Security

Cloudflare Pages hosts the static frontend

The frontend communicates directly with Supabase using its client SDK.

Supabase Row Level Security (RLS) enforces data access permissions.

## 3. Application Structure

The application has three primary areas.

### 3.1 Public Catalog

Accessible without authentication.

Features:

- Browse available cities.
- View city descriptions and cover images.
- View attractions in recommended order.
- See attraction images and descriptions.

The catalog is shared across all users.

### 3.2 Travel Checklist

Available to guests and authenticated users.

Guest mode

- Checklist progress is stored in localStorage.
- Progress survives browser refreshes.
- Progress is specific to the browser/device.
- No login is required.

Authenticated mode

- Checklist progress is stored in Supabase.
- Progress synchronizes across devices.
- Each user has an independent checklist.

Visited attractions automatically move below unvisited attractions.

### 3.3 Admin Panel

Accessible only to the designated admin account.

Features:

- Create, edit, and delete cities.
- Create, edit, and delete attractions.
- Reorder attractions.
- Import attractions using JSON.
- Manage attraction images through external URLs.

Admin permissions are enforced by Supabase RLS, not merely by hiding UI controls.

## 4. Database Design

### 4.1 Cities

`cities`

| Column      | Type        | Description        |
| ----------- | ----------- | ------------------ |
| id          | UUID        | Primary key        |
| name        | TEXT        | City name          |
| description | TEXT        | Short description  |
| image_url   | TEXT        | Cover image URL    |
| created_at  | TIMESTAMPTZ | Creation timestamp |

### 4.2 Attractions

`attractions`

| Column      | Type        | Description                |
| ----------- | ----------- | -------------------------- |
| id          | UUID        | Primary key                |
| city_id     | UUID        | References cities          |
| name        | TEXT        | Attraction name            |
| description | TEXT        | Short description          |
| image_url   | TEXT        | Attraction image URL       |
| sort_order  | INTEGER     | Recommended visiting order |
| created_at  | TIMESTAMPTZ | Creation timestamp         |

Attractions belong to a single city.

Deleting a city should also delete its attractions.

### 4.3 Visited Attractions

`user_visits`

| Column        | Type        | Description                   |
| ------------- | ----------- | ----------------------------- |
| user_id       | UUID        | References Supabase Auth user |
| attraction_id | UUID        | References attractions        |
| visited_at    | TIMESTAMPTZ | Visit timestamp               |

Primary key: `(user_id, attraction_id)`

A record indicates that the attraction is visited. Removing the record marks it unvisited.

This avoids storing unnecessary `false` records.

### 4.4 Admin Users

`admin_users`

| Column  | Type | Description                   |
| ------- | ---- | ----------------------------- |
| user_id | UUID | References Supabase Auth user |

V1 supports a single designated admin.

The admin account is provisioned manually through a secure database migration or administrator-controlled setup.

Users cannot grant themselves admin access.

### Entity Relationships

Conceptual relationships; `auth.users` is managed by Supabase Auth.

## 5. Authentication and Authorization

Authentication uses Google OAuth through Supabase Auth.

### User Roles

| Action               | Guest | Logged-in user | Admin |
| -------------------- | ----- | -------------- | ----- |
| View cities          | Yes   | Yes            | Yes   |
| View attractions     | Yes   | Yes            | Yes   |
| Check attractions    | Local | Cloud          | Cloud |
| Sync across devices  | No    | Yes            | Yes   |
| Add/edit cities      | No    | No             | Yes   |
| Add/edit attractions | No    | No             | Yes   |
| Import JSON          | No    | No             | Yes   |

### Security Rules

Supabase RLS policies enforce:

- Public read access to cities and attractions.
- Admin-only catalog modifications.
- Users can read and modify only their own `user_visits`.
- Users cannot modify another user's progress.
- Admin status cannot be changed by ordinary users.

The frontend uses a public Supabase publishable key.

The Supabase service-role key must never be exposed in the browser.

## 6. Guest Storage and Synchronization

### 6.1 Guest Progress

Guest checklist progress is stored in localStorage.

Example:

```
{
  "visitedAttractionIds": [
    "attraction-uuid-1",
    "attraction-uuid-2"
  ]
}
```

Guest progress is scoped to the current browser.

### 6.2 Login Conflict Resolution

When a guest logs in, the application compares local visited attractions with cloud progress.

If guest progress exists, the user is prompted to choose how to proceed.

You have saved travel progress

Choose how to handle your saved guest checklist when signing in.

Keep Local Data — Replace cloud checklist progress with local progress.

Keep Cloud Data — Keep your existing account progress.

Merge Both — Combine visited attractions from both sources.

Merge rule: an attraction is visited if it is checked in either source.

Illustration of the proposed dialog, not a connected application control.

### Merge Rule

For every attraction:

| Local     | Cloud     | Merged    |
| --------- | --------- | --------- |
| Visited   | Visited   | Visited   |
| Visited   | Unvisited | Visited   |
| Unvisited | Visited   | Visited   |
| Unvisited | Unvisited | Unvisited |

Mathematically:

`mergedVisited = localVisited OR cloudVisited`

This preserves checked attractions from either source.

### Important Behavior

- Cloud data is fetched before conflict resolution.
- No local data is deleted before the user confirms.
- Updates are applied as a single database transaction or equivalent atomic server-side operation.
- Local guest progress is cleared only after successful import or explicit discard.
- Failed synchronization must not cause progress loss.

For V1, cross-device synchronization uses Supabase reads and writes, with refetching when the app opens or regains focus. Real-time subscriptions are unnecessary.

## 7. Frontend Architecture

Recommended project structure:

```
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers/
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
├── features/
│   ├── cities/
│   ├── attractions/
│   ├── checklist/
│   ├── auth/
│   └── admin/
├── lib/
│   ├── supabase.ts
│   └── storage.ts
├── hooks/
├── types/
└── main.tsx
```

### Design Principles

- Organize application code by feature.
- Keep Supabase queries separate from presentation components.
- Use reusable components for attraction cards and city layouts.
- Keep guest and authenticated checklist storage behind a shared interface.
- Avoid unnecessary global state management.

### State Management

Use:

- React state for UI interactions.
- TanStack Query for server data fetching, caching, and invalidation.
- React Context for lightweight authentication state.
- localStorage for guest checklist persistence.

Redux or another large global state library is unnecessary for V1.

## 8. Main User Flows

### Browse a City

1. User opens Tour Tracker.
2. Application loads the public city catalog.
3. User selects a city.
4. Application loads its attractions.
5. Attractions appear in recommended order.

### Mark an Attraction as Visited

1. User checks an attraction.
2. UI immediately reflects the change.
3. Progress is saved locally or to Supabase.
4. Visited attraction moves below unvisited attractions.
5. If persistence fails, the UI restores the previous state and displays an error.

### Admin Adds Attractions

1. Admin signs in with Google.
2. Admin opens the management interface.
3. Admin selects a city.
4. Admin adds an attraction manually or imports JSON.
5. Data is validated.
6. Supabase stores the changes.
7. Updated catalog becomes visible to everyone.

## 9. JSON Import

JSON import is available only to the admin.

The import process:

1. Accepts pasted JSON.
2. Validates required fields and data types.
3. Displays validation errors.
4. Appends new attractions.
5. Preserves existing catalog entries.
6. Assigns a consistent recommended order.

Imports should be atomic: invalid entries reject the entire batch rather than leaving a partially imported catalog.

Duplicate detection should use normalized attraction names within the same city. Exact duplicate names are rejected rather than silently overwritten.

For V1, imported attractions are appended after existing attractions while preserving their relative JSON order. The admin can reorder them afterward.

## 10. Images

V1 stores image URLs as text.

Images are loaded directly from their external sources.

Requirements:

- Support HTTPS image URLs.
- Display a fallback when an image fails to load.
- Use lazy loading for attraction images.
- Maintain consistent card dimensions.
- Avoid downloading and storing images in Supabase.

External images can disappear or become unavailable. This is an accepted V1 limitation.

## 11. Hosting and Deployment

### Cloudflare Pages

The React application is compiled into static assets and deployed to Cloudflare Pages.

Benefits:

- Free-tier static hosting.
- Global CDN.
- Automatic HTTPS.
- Git-based deployments.
- No application server maintenance.

### Supabase

Supabase hosts:

- PostgreSQL database.
- Authentication.
- Row Level Security.
- Data APIs.

### Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Only public configuration values are exposed through Vite environment variables.

Sensitive administrative credentials must remain outside the frontend.

## 12. Error Handling

| Scenario                       | Expected behavior                                            |
| ------------------------------ | ------------------------------------------------------------ |
| Supabase unavailable           | Show error and retry option                                  |
| Image URL broken               | Show placeholder                                             |
| Guest localStorage unavailable | Explain that progress cannot be saved                        |
| Login fails                    | Show authentication error                                    |
| Sync fails                     | Preserve local data for retry                                |
| Invalid JSON                   | Show validation errors                                       |
| Unauthorized admin access      | Deny access                                                  |
| Attraction deleted             | Remove associated visit records through database constraints |

## 13. Testing Strategy

### Unit Tests

Use Vitest and React Testing Library.

Test:

- Attraction sorting.
- Guest checklist storage.
- Merge conflict rules.
- JSON validation.
- Form validation.

### Integration Tests

Test against a dedicated Supabase test environment:

- Catalog access permissions.
- User progress isolation.
- Admin-only modifications.
- Authentication flows.
- Database constraints.

### End-to-End Tests

Use Playwright for critical journeys:

- Browse a city.
- Check and uncheck attractions.
- Persist guest progress.
- Sign in with Google.
- Resolve local/cloud conflicts.
- Admin adds an attraction.

Keep the initial test suite focused on critical functionality.

## 14. Deliberately Excluded Infrastructure

The following are unnecessary for V1:

- Custom Node.js or Python backend
- Microservices
- Docker or Kubernetes
- Message queues
- Redis
- Background workers
- Vector databases
- AI agents
- Real-time WebSocket synchronization
- Dedicated image storage

These technologies should only be introduced when a concrete requirement justifies them.

## 15. Future Architecture Considerations

Potential future requirements:

| Feature                  | Possible extension                |
| ------------------------ | --------------------------------- |
| AI-generated city guides | Supabase Edge Functions + LLM API |
| Image uploads            | Supabase Storage                  |
| Multi-admin management   | Role-based authorization          |
| Maps                     | Mapping API integration           |
| Offline mode             | PWA + IndexedDB                   |
| Public sharing           | Shareable guide URLs              |
| Large catalog            | Pagination and search             |
| Trip recommendations     | Recommendation service            |

These are future possibilities, not V1 dependencies.

## 16. Architecture Decisions

| Decision            | Rationale                                       |
| ------------------- | ----------------------------------------------- |
| React + Vite        | Simple SPA without unnecessary server rendering |
| TypeScript          | Type safety                                     |
| Supabase            | Managed backend with low operational overhead   |
| PostgreSQL          | Relational data model fits the product          |
| Google OAuth        | Convenient authentication                       |
| localStorage        | Simple guest persistence                        |
| Cloudflare Pages    | Low-cost static hosting                         |
| RLS                 | Database-enforced authorization                 |
| External image URLs | Avoid image storage costs                       |
| Single admin        | Minimal permission complexity                   |
| Shared catalog      | Consistent recommendations for all users        |

## 17. Definition of Done

The architecture is successfully implemented when:

- Public users can browse cities and attractions.
- Guests can maintain local visited checklists.
- Google authentication works.
- Logged-in users can synchronize progress across devices.
- Guest-to-cloud conflict resolution works correctly.
- Only the admin can modify the shared catalog.
- JSON import is validated and append-only.
- The application is deployed publicly.
- Database permissions are verified.
- Core functionality has automated tests.
