begin;

select plan(19);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
values
  (
    '30000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'checklist-a@example.test',
    '',
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'checklist-b@example.test',
    '',
    now()
  )
on conflict (id) do nothing;

set local role anon;

select throws_ok(
  $$ select * from public.user_visits $$,
  '42501',
  null,
  'guests cannot read user visits'
);

select throws_ok(
  $$ insert into public.user_visits (user_id, attraction_id) values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001') $$,
  '42501',
  null,
  'guests cannot add user visits'
);

select throws_ok(
  $$ select public.set_user_visit('20000000-0000-4000-8000-000000000001', true) $$,
  '42501',
  null,
  'guests cannot call the single-visit update'
);

select throws_ok(
  $$ select public.replace_user_visits(array['20000000-0000-4000-8000-000000000001']::uuid[]) $$,
  '42501',
  null,
  'guests cannot replace account progress'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$ insert into public.user_visits (user_id, attraction_id) values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001') $$,
  'a user can save their own visit'
);

select is(
  (select count(*)::integer from public.user_visits),
  1,
  'a user can read their own visit'
);

select lives_ok(
  $$ select public.set_user_visit('20000000-0000-4000-8000-000000000003', true) $$,
  'a user can mark one attraction visited'
);

select is(
  (select count(*)::integer from public.user_visits where attraction_id = '20000000-0000-4000-8000-000000000003'),
  1,
  'single-visit update stores the selected attraction'
);

select lives_ok(
  $$ select public.set_user_visit('20000000-0000-4000-8000-000000000003', false) $$,
  'a user can unmark one attraction'
);

select is(
  (select count(*)::integer from public.user_visits where attraction_id = '20000000-0000-4000-8000-000000000003'),
  0,
  'single-visit update removes only the selected attraction'
);

select throws_ok(
  $$ insert into public.user_visits (user_id, attraction_id) values ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002') $$,
  '42501',
  null,
  'a user cannot add a visit for another user'
);

select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.user_visits),
  0,
  'a user cannot read another user''s visits'
);

select lives_ok(
  $$ insert into public.user_visits (user_id, attraction_id) values ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002') $$,
  'a second user can save their own visit'
);

select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);

select lives_ok(
  $$ delete from public.user_visits where user_id = '30000000-0000-4000-8000-000000000001' $$,
  'a user cannot delete another user''s visit'
);

select is(
  (select count(*)::integer from public.user_visits),
  1,
  'attempted delete preserves the caller''s own visit'
);

select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*)::integer from public.user_visits where attraction_id = '20000000-0000-4000-8000-000000000001'),
  1,
  'the other user''s visit remains unchanged'
);

select lives_ok(
  $$ select public.replace_user_visits(array['20000000-0000-4000-8000-000000000003']::uuid[]) $$,
  'a user can replace their checklist atomically'
);

select is(
  (select count(*)::integer from public.user_visits where attraction_id = '20000000-0000-4000-8000-000000000003'),
  1,
  'replacement stores the selected visit'
);

select set_config('request.jwt.claim.sub', '30000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.user_visits),
  1,
  'replacement preserves the second user''s progress'
);

select * from finish();
rollback;
