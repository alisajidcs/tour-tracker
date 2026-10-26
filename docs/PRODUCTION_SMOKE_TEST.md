# Production smoke-test checklist

Complete Phase 1 against a deployed preview and a non-production Supabase project. Only after those checks pass, complete Phase 2 for production. Do not load the sample seed into either project. Use a temporary test city and remove it after the admin checks.

## Phase 1: staging and preview

- [ ] Apply pending migrations to the staging Supabase project with `npx supabase db push`; do not use `--include-seed`.
- [ ] In Supabase SQL Editor, confirm the required tables have Row Level Security enabled:

  ```sql
  select tablename, rowsecurity
  from pg_tables
  where schemaname = 'public'
    and tablename in ('cities', 'attractions', 'user_visits', 'admin_users')
  order by tablename;
  ```

  Each returned row should have `rowsecurity = true`.
- [ ] Confirm migrations `20261018000100`, `20261026000100`, `20261027000100`, and `20261027000200` appear in the Supabase migration history.
- [ ] Set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Cloudflare Pages preview environment, pointing to staging.
- [ ] Set the staging Supabase Auth Site URL to the deployed preview origin and allow that preview origin.
- [ ] Confirm Google OAuth is enabled for staging and the callback URL shown by staging Supabase is listed in the Google OAuth client.
- [ ] Confirm the intended administrator has a row in `public.admin_users`.

### Check the preview app

- [ ] Open the preview origin and confirm the city list loads without a console error.
- [ ] Open a city, then refresh its direct URL. Confirm the page still loads and lists attractions in recommended order.
- [ ] As a guest, mark and unmark an attraction, refresh, and confirm progress remains in this browser.
- [ ] Open `/admin` while signed out. Confirm catalog controls are not shown.
- [ ] Sign in with the administrator account. Create a temporary city and attraction, edit them, reorder the attraction, and confirm changes appear in the public catalog.
- [ ] Import a valid JSON batch into the temporary city. Confirm the new entries appear in supplied relative order and the existing attraction remains unchanged.
- [ ] Try malformed JSON, a blank name, and a duplicate name. Confirm each import is rejected and no partial attractions appear.
- [ ] Sign in with a regular account and confirm admin controls remain unavailable. Confirm it cannot call the import, manual-create, or reorder database operations.
- [ ] With an admin account, verify Google sign-in survives a page refresh and checklist progress appears in a second browser session.
- [ ] Sign out and confirm account progress is no longer shown in guest mode.
- [ ] Delete the temporary city and confirm the public catalog returns to its original contents.

## Phase 2: production

After all staging and preview checks pass:

- [ ] Apply pending migrations to the production Supabase project with `npx supabase db push`; do not use `--include-seed`.
- [ ] Confirm production has Row Level Security enabled for the required tables and the four migration IDs listed above in its migration history.
- [ ] Set only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Cloudflare Pages production environment, pointing to production.
- [ ] Set the production Supabase Auth Site URL to the production origin and allow the production origin.
- [ ] Confirm production Google OAuth uses the callback URL shown by production Supabase and that it is listed in the Google OAuth client.
- [ ] Confirm the intended production administrator has a row in `public.admin_users`.
- [ ] Open the production origin and verify catalog loading, direct-route refresh, sign-in, and account checklist sync. If running catalog mutation/import checks, use a temporary city and delete it afterward.

For database-level assertions, run `npm run test:db` against a local Supabase stack before applying migrations to a hosted project. The SQL assertions must not be treated as passed until that command completes successfully.
