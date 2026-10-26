begin;

select plan(8);

set local role anon;

select lives_ok(
  $$ select id, name from public.cities $$,
  'anonymous visitors can read cities'
);

select lives_ok(
  $$ select id, name from public.attractions $$,
  'anonymous visitors can read attractions'
);

select throws_ok(
  $$ insert into public.cities (name) values ('Unauthorized city') $$,
  '42501',
  null,
  'anonymous visitors cannot insert cities'
);

select throws_ok(
  $$ insert into public.attractions (city_id, name) values ('10000000-0000-4000-8000-000000000001', 'Unauthorized attraction') $$,
  '42501',
  null,
  'anonymous visitors cannot insert attractions'
);

select throws_ok(
  $$ update public.cities set name = 'Unauthorized change' $$,
  '42501',
  null,
  'anonymous visitors cannot update cities'
);

select throws_ok(
  $$ update public.attractions set name = 'Unauthorized change' $$,
  '42501',
  null,
  'anonymous visitors cannot update attractions'
);

select throws_ok(
  $$ delete from public.cities $$,
  '42501',
  null,
  'anonymous visitors cannot delete cities'
);

select throws_ok(
  $$ delete from public.attractions $$,
  '42501',
  null,
  'anonymous visitors cannot delete attractions'
);

select * from finish();

rollback;
