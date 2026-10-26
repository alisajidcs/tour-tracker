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

## Useful commands

```powershell
npm run dev       # Start the frontend
npm run build     # Type-check and build for production
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript checks
npm test          # Run frontend tests
npm run test:db   # Run Supabase database tests (local Supabase must be running)
```

## Troubleshooting

- **The page says Supabase is not configured:** check that `.env` is in the project root and both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set, then restart Vite.
- **The request says `public.cities` is missing:** apply migrations with `npx supabase db reset` for the local database, or `npx supabase db push` for the linked hosted project.
- **The city list is empty:** confirm the seed ran locally, or load the sample data in a development/staging project with `npx supabase db push --include-seed`.
- **Local Supabase will not start:** make sure Docker Desktop is running, then try `npx supabase start` again.

For product scope and technical decisions, see [PRODUCT.md](PRODUCT.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [ROADMAP.md](ROADMAP.md).
