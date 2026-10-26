begin;

select plan(24);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
values
  (
    '40000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'catalog-admin@example.test',
    '',
    now()
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'catalog-user@example.test',
    '',
    now()
  )
on conflict (id) do nothing;

insert into public.admin_users (user_id)
values ('40000000-0000-4000-8000-000000000001')
on conflict (user_id) do nothing;

set local role anon;

select throws_ok(
  $$ select * from public.admin_users $$,
  '42501',
  null,
  'guests cannot inspect administrator membership'
);

select throws_ok(
  $$ insert into public.cities (name) values ('Guest city') $$,
  '42501',
  null,
  'guests cannot create catalog entries'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.admin_users),
  0,
  'regular users cannot see another account''s admin membership'
);

select throws_ok(
  $$ insert into public.cities (name) values ('Regular user city') $$,
  '42501',
  null,
  'regular users cannot create catalog entries'
);

select throws_ok(
  $$ insert into public.attractions (city_id, name, sort_order) values ('10000000-0000-4000-8000-000000000001', 'Regular user attraction', 1) $$,
  '42501',
  null,
  'regular users cannot create attractions'
);

select throws_ok(
  $$ insert into public.admin_users (user_id) values ('40000000-0000-4000-8000-000000000002') $$,
  '42501',
  null,
  'regular users cannot grant themselves admin access'
);

select throws_ok(
  $$ select public.reorder_city_attractions('10000000-0000-4000-8000-000000000001', array[]::uuid[]) $$,
  '42501',
  null,
  'regular users cannot call the attraction reorder operation'
);

select lives_ok(
  $$ update public.cities set name = 'Unauthorized rename' where id = '10000000-0000-4000-8000-000000000001' $$,
  'regular user update is denied by row security'
);

select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*)::integer from public.admin_users),
  1,
  'the administrator can read their membership'
);

select is(
  (select name from public.cities where id = '10000000-0000-4000-8000-000000000001'),
  'Dresden',
  'regular user update did not change the public catalog'
);

select lives_ok(
  $$ insert into public.cities (id, name, description) values ('50000000-0000-4000-8000-000000000001', 'Test city', 'Admin-created city') $$,
  'administrator can create a city'
);

select lives_ok(
  $$ update public.cities set name = 'Updated test city' where id = '50000000-0000-4000-8000-000000000001' $$,
  'administrator can update a city'
);

select lives_ok(
  $$ insert into public.attractions (id, city_id, name, sort_order) values ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'First stop', 1), ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001', 'Second stop', 2) $$,
  'administrator can create attractions'
);

select lives_ok(
  $$ update public.attractions set name = 'Edited stop' where id = '60000000-0000-4000-8000-000000000001' $$,
  'administrator can update an attraction'
);

select throws_ok(
  $$ select public.reorder_city_attractions('50000000-0000-4000-8000-000000000001', array['60000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001']::uuid[]) $$,
  '22023',
  null,
  'duplicate attraction ids cannot pass as a complete order'
);

select lives_ok(
  $$ select public.reorder_city_attractions('50000000-0000-4000-8000-000000000001', array['60000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001']::uuid[]) $$,
  'administrator can reorder all city attractions atomically'
);

select is(
  (select sort_order::integer from public.attractions where id = '60000000-0000-4000-8000-000000000001'),
  2,
  'reordering updates the selected attraction position'
);

select lives_ok(
  $$ insert into public.user_visits (user_id, attraction_id) values ('40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001') $$,
  'administrator can have progress on the managed catalog'
);

select lives_ok(
  $$ delete from public.attractions where id = '60000000-0000-4000-8000-000000000001' $$,
  'administrator can delete an attraction'
);

select is(
  (select count(*)::integer from public.user_visits where attraction_id = '60000000-0000-4000-8000-000000000001'),
  0,
  'deleting an attraction cascades to associated visit progress'
);

select lives_ok(
  $$ insert into public.user_visits (user_id, attraction_id) values ('40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002') $$,
  'administrator can track the remaining attraction'
);

select lives_ok(
  $$ delete from public.cities where id = '50000000-0000-4000-8000-000000000001' $$,
  'administrator can delete a city'
);

select is(
  (select count(*)::integer from public.attractions where city_id = '50000000-0000-4000-8000-000000000001'),
  0,
  'deleting a city cascades to its attractions'
);

select is(
  (select count(*)::integer from public.user_visits where attraction_id = '60000000-0000-4000-8000-000000000001'),
  0,
  'deleting a city cascades to associated visit progress'
);

select * from finish();
rollback;
