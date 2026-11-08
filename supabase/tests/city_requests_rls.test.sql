begin;

select plan(13);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
values
  ('72000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'requester@example.test', '', now()),
  ('72000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'request-admin@example.test', '', now())
on conflict (id) do nothing;
insert into public.admin_users (user_id) values ('72000000-0000-4000-8000-000000000002') on conflict do nothing;

set local role anon;
select throws_ok(
  $$ insert into public.city_requests (city_name) values ('Oslo') $$,
  '42501', null, 'guests cannot submit a city request'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$ insert into public.city_requests (city_name) values ('Oslo') $$,
  'an authenticated user can submit a request using their authenticated identity'
);
select is(
  (select user_id from public.city_requests where city_name = 'Oslo'),
  '72000000-0000-4000-8000-000000000001'::uuid,
  'the request is attributed to its authenticated owner'
);
update public.city_requests
set status = 'fulfilled', fulfilled_at = now()
where city_name = 'Oslo';
select is(
  (select status from public.city_requests where city_name = 'Oslo'),
  'pending',
  'requesters cannot fulfill or edit requests'
);

select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.city_requests where status = 'pending'),
  1,
  'an admin can read all pending city requests'
);
select lives_ok(
  $$ select public.create_city_from_request(
    (select id from public.city_requests where city_name = 'Oslo'),
    'Oslo',
    'A city guide.',
    'https://example.com/oslo.jpg'
  ) $$,
  'an admin can create a city from a pending request'
);
select is(
  (select status from public.city_requests where city_name = 'Oslo'),
  'fulfilled',
  'successful city creation fulfills the request'
);
select is(
  (select count(*)::integer from public.cities where name = 'Oslo'),
  1,
  'fulfillment creates exactly one city'
);
select throws_ok(
  $$ select public.create_city_from_request(
    (select id from public.city_requests where city_name = 'Oslo'),
    'Oslo',
    '',
    ''
  ) $$,
  '22023', null, 'a fulfilled request cannot be added twice'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$ insert into public.city_requests (city_name) values ('Bergen') $$,
  'the requester can submit another request'
);
select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$ select public.create_city_with_request_attractions(
    (select id from public.city_requests where city_name = 'Bergen'),
    '{"name":"Bergen","description":"","imageUrl":""}'::jsonb,
    '[{"name":"Invalid","description":"","imageUrl":"http://invalid.example/image.jpg","order":1}]'::jsonb
  ) $$,
  '22023', null, 'invalid combined city data rolls back request fulfillment'
);
select is(
  (select status from public.city_requests where city_name = 'Bergen'),
  'pending',
  'the request remains pending when city creation fails'
);
select is(
  (select count(*)::integer from public.cities where name = 'Bergen'),
  0,
  'failed city creation leaves no city behind'
);

select * from finish();
rollback;
