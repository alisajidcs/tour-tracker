begin;

select plan(23);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
values
  (
    '70000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'import-admin@example.test',
    '',
    now()
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'import-user@example.test',
    '',
    now()
  )
on conflict (id) do nothing;

insert into public.admin_users (user_id)
values ('70000000-0000-4000-8000-000000000001')
on conflict (user_id) do nothing;

set local role anon;
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[]'::jsonb) $$,
  '42501', null,
  'guests cannot import attractions'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":"Denied","description":"","imageUrl":"https://example.com/image.jpg","order":1}]'::jsonb) $$,
  '42501', null,
  'regular users cannot import attractions'
);
select throws_ok(
  $$ select public.create_city_attraction('10000000-0000-4000-8000-000000000001', 'Denied', '', '') $$,
  '42501', null,
  'regular users cannot call the serialized manual create operation'
);

select set_config('request.jwt.claim.sub', '70000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":"New","description":"","imageUrl":"https://example.com/new.jpg","order":1},{"name":" frauenkirche ","description":"Duplicate","imageUrl":"https://example.com/duplicate.jpg","order":2}]'::jsonb) $$,
  '23505', null,
  'a duplicate existing city name rejects the complete import'
);

select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":"New","description":"","imageUrl":"http://example.com/new.jpg","order":1}]'::jsonb) $$,
  '22023', null,
  'invalid fields are rejected by the database'
);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":"New","description":"","imageUrl":"https://example.com:99999/new.jpg","order":1}]'::jsonb) $$,
  '22023', null,
  'invalid HTTPS ports are rejected by the database'
);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":"New","description":"","imageUrl":"https://exa%mple.com/new.jpg","order":1}]'::jsonb) $$,
  '22023', null,
  'invalid HTTPS host characters are rejected by the database'
);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":"New","description":"","imageUrl":"https://../new.jpg","order":1}]'::jsonb) $$,
  '22023', null,
  'empty DNS labels are rejected by the database'
);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":"New","description":"","imageUrl":"https://-/new.jpg","order":1}]'::jsonb) $$,
  '22023', null,
  'DNS labels cannot start or end with a hyphen'
);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":"New","description":"","imageUrl":"https://999.999.999.999/new.jpg","order":1}]'::jsonb) $$,
  '22023', null,
  'out-of-range IPv4 authorities are rejected by the database'
);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":"New","description":"","imageUrl":"https://999.999.999/new.jpg","order":1}]'::jsonb) $$,
  '22023', null,
  'out-of-range short IPv4 authorities are rejected by the database'
);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":"New","description":"","imageUrl":"https://1.2.3.4../new.jpg","order":1}]'::jsonb) $$,
  '22023', null,
  'multiple trailing dots are rejected on numeric IPv4 authorities'
);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":"New","description":"","imageUrl":"https://1.2.999../new.jpg","order":1}]'::jsonb) $$,
  '22023', null,
  'multiple trailing dots are rejected on short numeric authorities'
);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":" \t  ","description":"Whitespace only","imageUrl":"https://example.com/new.jpg","order":1}]'::jsonb) $$,
  '22023', null,
  'Unicode and ASCII whitespace-only names are rejected by the database'
);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":"New","description":"","imageUrl":"https://example.com/new.jpg","order":1},{"name":" new ","description":"Duplicate in batch","imageUrl":"https://example.com/duplicate.jpg","order":2}]'::jsonb) $$,
  '23505', null,
  'duplicate normalized names within the batch reject the complete import'
);
select throws_ok(
  $$ select public.append_city_attractions('10000000-0000-4000-8000-000000000001', '[{"name":" Frauenkirche ","description":"Duplicate with Unicode spacing","imageUrl":"https://example.com/duplicate.jpg","order":1}]'::jsonb) $$,
  '23505', null,
  'Unicode whitespace is trimmed consistently when checking existing names'
);

select is(
  (select count(*)::integer from public.attractions where city_id = '10000000-0000-4000-8000-000000000001'),
  3,
  'failed imports leave the existing city attractions unchanged'
);

select is(
  public.append_city_attractions(
    '10000000-0000-4000-8000-000000000001',
    '[{"name":"Newer stop","description":"Second in requested order","imageUrl":"https://example.com/newer.jpg","order":20},{"name":"Earlier stop","description":"First in requested order","imageUrl":"https://example.com/earlier.jpg","order":10}]'::jsonb
  ),
  2,
  'administrator can append a valid batch'
);

select is(
  (select sort_order from public.attractions where city_id = '10000000-0000-4000-8000-000000000001' and name = 'Earlier stop'),
  4,
  'imported attractions append after existing entries in requested order'
);

select is(
  (select sort_order from public.attractions where city_id = '10000000-0000-4000-8000-000000000001' and name = 'Newer stop'),
  5,
  'provided order values determine imported relative order'
);

select is(
  (select count(*)::integer from public.attractions where city_id = '10000000-0000-4000-8000-000000000001'),
  5,
  'a valid batch adds exactly its records without replacing existing attractions'
);

select lives_ok(
  $$ select public.create_city_attraction('10000000-0000-4000-8000-000000000001', 'Manual stop', 'Added from the form', 'https://example.com/manual.jpg') $$,
  'administrator can add an attraction through the serialized manual create operation'
);

select is(
  (select sort_order from public.attractions where city_id = '10000000-0000-4000-8000-000000000001' and name = 'Manual stop'),
  6,
  'manual additions append after the latest imported attraction'
);

select * from finish();
rollback;
