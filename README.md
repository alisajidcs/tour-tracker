# Tour Tracker

A lightweight city guide and travel checklist built with React, Vite, TypeScript, and Supabase.

## Prerequisites

- Node.js and npm
- A Supabase project (hosted or local)
- Supabase CLI, for applying database migrations
- Docker Desktop only if you want to run Supabase locally

Install the Supabase CLI using the [official installation instructions](https://supabase.com/docs/guides/local-development/cli/getting-started). You can use `npx supabase` in the commands below if you don't have the CLI installed globally.

## Start with your hosted Supabase project

If you already created a Supabase project, you do **not** need `supabase start`. That command starts a separate local Supabase stack using Docker. Your frontend `.env` settings connect the app to the hosted project, but the CLI needs to be linked to that project separately before it can apply migrations.

From the project folder, install dependencies:

```powershell
npm install
```

Set the hosted project's URL and publishable key in a root `.env` file:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Do not use a service-role key in this frontend app. Keep `.env` local and do not commit credentials.

Log the CLI in, link it to the same project, and apply the repository migrations:

```powershell
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

`db push` applies pending migrations, including the migration that creates the public `cities` and `attractions` tables. For a development or staging project, you can also load the sample Dresden data with:

```powershell
npx supabase db push --include-seed
```

The seed file contains sample data; do not include it in production. Restart the frontend after changing `.env`, then run:

```powershell
npm run dev
```

Open the local URL printed by Vite. The frontend runs locally while reading data from the hosted Supabase project.

## Use the guest checklist

Open a city guide and check an attraction's **Mark as visited** box. Visited attractions move below unvisited ones; unchecking restores the recommended order. Guest progress is saved in this browser's local storage and is independent on other browsers or devices.

## Enable Google sign-in and cloud sync

Apply the `user_visits` migration to the linked Supabase project with `npx supabase db push`. In the Supabase Dashboard, enable Google under **Authentication → Providers**, enter the Google OAuth client ID and secret, and add the callback URL shown by Supabase to the Google OAuth client's authorized redirect URIs. Add the app's local and deployed origins under **Authentication → URL Configuration** so Supabase can redirect back to Tour Tracker. Keep the Google client secret in Supabase; it does not belong in `.env` or frontend code.

After Google sign-in, checklist progress is stored in the account and syncs across devices. If this browser already has guest progress, choose whether to merge it with the account list or keep one list. Signing out returns to the browser's guest checklist.

## Grant administrator access

The administrator account is provisioned manually; signing in alone does not grant catalog write access. First sign in with the Google account that should administer the catalog. Then, as the project owner, open the Supabase SQL Editor and run this statement with that account's email:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'admin@example.com'
on conflict (user_id) do nothing;
```

The account can then open **Manage** or `/admin` to create, edit, delete, and reorder catalog entries. The `admin_users` table has no client write permissions, so users cannot grant themselves access. Deleting a city or attraction also removes its dependent visit records.

## Import attractions from JSON

In **Manage**, select the destination city and paste JSON in this shape:

```json
{
  "places": [
    {
      "name": "Frauenkirche",
      "description": "A historic church in Dresden.",
      "imageUrl": "https://example.com/frauenkirche.jpg",
      "order": 1
    },
    {
      "name": "Zwinger Palace",
      "description": "A Baroque palace complex.",
      "imageUrl": "https://example.com/zwinger.jpg",
      "order": 2
    }
  ]
}
```

Each import must contain 1–500 places. Names and descriptions must be strings, image URLs must use HTTPS, and `order` must be a positive whole number. Names that match an existing attraction in that city or another name in the batch are rejected (case-insensitive after trimming). Imports append after existing attractions, ordered by the supplied `order`; existing entries stay in place. A validation or database error rejects the entire batch without adding any of its places.

The admin can also create a city and its places together with the city guide JSON format. In **Manage → Cities**, enter the city name to reveal a copyable prompt with that name included. The JSON contains a `city` object (`name`, `description`, `imageUrl`) and a `places` array; place entries may also include `longDescription` and `galleryImageUrls`. The city and places are created atomically.

## Request a city

The home page always displays **Request a city**. Guests can open it to see the sign-in prompt; signed-in users can submit a city name. The admin reviews requests in **Manage → Cities** and can use **Add** to open the new-city form with the name prefilled. The request is marked fulfilled only after the city has been saved.

## Deploy to Cloudflare Pages

The repository is configured for a Vite static build with single-page-app routing. In Cloudflare Pages, connect this repository and use:

| Setting                | Value           |
| ---------------------- | --------------- |
| Build command          | `npm run build` |
| Build output directory | `dist`          |
| Root directory         | `/`             |

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Pages project’s environment variables for each environment. These are public browser settings; never add a service-role key, database password, or Google OAuth client secret. Copy `.env.example` locally when needed, but configure the values directly in Cloudflare for deployed builds.

The Cloudflare Pages Function in `functions/` supplies city- and place-specific Open Graph and Twitter metadata to link previews. Configure the same two public Supabase values as Pages Function runtime variables so it can look up the shared catalog when social apps fetch a link.

The `public/_redirects` file sends client-side routes back to `index.html`, so paths such as `/admin` continue to work after refresh. After the first deployment, set the Supabase Auth **Site URL** to the production origin and add the production origin (and any preview origins you use) to the allowed redirect URLs. The Google OAuth client’s authorized redirect URI is the callback URL shown in Supabase Auth, not the Cloudflare Pages URL. See [the production smoke-test checklist](docs/PRODUCTION_SMOKE_TEST.md) before opening the deployed app to users.

## Optional: run Supabase locally

Use this path only if you want a local database instead of your hosted project. It requires Docker Desktop to be running. `supabase start` launches the local Supabase services in Docker; it does not connect to your hosted project.

```powershell
npm install
npx supabase start
npx supabase status
```

Copy the local API URL and anon key reported by `supabase status` into the root `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The first local start applies migrations and the configured `supabase/seed.sql` file, which adds sample Dresden records.

After pulling a later migration, rebuild the **local** database with:

```powershell
npx supabase db reset
```

This erases local database contents, reapplies all migrations, and reruns the seed file. Do not use a linked/remote reset for routine development.

### Sign in as a local administrator

The app uses Google OAuth and the same `admin_users` membership check locally as it does in production. To use `/admin` against the local database:

1. Create or use a Google OAuth web client. Add `http://127.0.0.1:54321/auth/v1/callback` as an authorized redirect URI in Google Cloud.
2. Add the local app origin and Google provider to `supabase/config.toml`:

   ```toml
   [auth]
   site_url = "http://localhost:5173"
   additional_redirect_urls = ["http://localhost:5173/**"]

   [auth.external.google]
   enabled = true
   client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
   secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
   skip_nonce_check = false
   ```

3. Put the Google client ID and secret in the root `.env` file (never commit the secret):

   ```dotenv
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. Restart the local Supabase stack so it reads the config:

   ```powershell
   npx supabase stop
   npx supabase start
   ```

   Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` to the local API URL and publishable key shown by `npx supabase status`. Then start the app with `npm run dev`.

5. Open `http://localhost:5173`, sign in with Google, then open the local Supabase Studio at `http://127.0.0.1:54323`. In its SQL Editor, grant the signed-in account admin membership:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'your-google-email@example.com'
   on conflict (user_id) do nothing;
   ```

6. Open `http://localhost:5173/admin` and refresh if it was already open. This membership is in the local database only; it does not grant access to the hosted project.

The local Google callback and redirect configuration follow [Supabase's local Google OAuth setup](https://supabase.com/docs/guides/auth/social-login/auth-google) and [local Auth config](https://supabase.com/docs/guides/local-development/cli/config).

## Useful commands

```powershell
npm run dev       # Start the frontend
npm run build     # Type-check and build for production
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript checks
npm test          # Run frontend tests
npm run test:db   # Run Supabase database tests (local Supabase must be running)
```

## Checks before pushing

The repository includes a pre-push hook that runs ESLint, the frontend test suite, and the production build. Enable it once in each clone from the repository root:

```powershell
git config core.hooksPath .githooks
```

After that, `git push` stops if any check fails. To run the same checks manually, use `npm run check:push`.

## Troubleshooting

- **The page says Supabase is not configured:** check that `.env` is in the project root and both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set, then restart Vite.
- **The request says `public.cities` is missing:** apply migrations with `npx supabase db reset` for the local database, or `npx supabase db push` for the linked hosted project.
- **The city list is empty:** confirm the seed ran locally, or load the sample data in a development/staging project with `npx supabase db push --include-seed`.
- **Local Supabase will not start:** make sure Docker Desktop is running, then try `npx supabase start` again.

For product scope and technical decisions, see [PRODUCT.md](PRODUCT.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [ROADMAP.md](ROADMAP.md).
