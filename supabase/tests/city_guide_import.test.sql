begin;

select plan(9);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
values
  ('71000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'guide-admin@example.test', '', now()),
  ('71000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'guide-user@example.test', '', now())
on conflict (id) do nothing;
insert into public.admin_users (user_id) values ('71000000-0000-4000-8000-000000000001') on conflict do nothing;

set local role anon;
select throws_ok(
  $$ select public.create_city_with_attractions('{"name":"Osaka","description":"","imageUrl":""}'::jsonb, '[]'::jsonb) $$,
  '42501', null, 'guests cannot create a combined city guide'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000002', true);
select throws_ok(
  $$ select public.create_city_with_attractions('{"name":"Osaka","description":"","imageUrl":""}'::jsonb, '[{"name":"Castle","description":"","imageUrl":"https://example.com/castle.jpg","order":1}]'::jsonb) $$,
  '42501', null, 'regular users cannot create a combined city guide'
);

select set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000001', true);
select throws_ok(
  $$ select public.create_city_with_attractions('{"name":"Osaka","description":"","imageUrl":""}'::jsonb, '[{"name":"Broken","description":"","imageUrl":"https://example.com/place.jpg","order":0}]'::jsonb) $$,
  '22023', null, 'an invalid place rejects the complete city guide'
);
select is(
  (select count(*)::integer from public.cities where name = 'Osaka'),
  0,
  'failed combined imports leave no city record behind'
);

select lives_ok(
  $$ select public.create_city_with_attractions(
    '{"name":"Osaka","description":"A lively city.","imageUrl":"https://example.com/osaka.jpg"}'::jsonb,
    '[{"name":"Osaka Castle","description":"Historic castle.","longDescription":"A fuller visitor guide.","imageUrl":"https://example.com/castle.jpg","galleryImageUrls":["https://example.com/castle-view.jpg"],"order":1}]'::jsonb
  ) $$,
  'administrator can atomically create a city and its places'
);
select is(
  (select count(*)::integer from public.cities city join public.attractions attraction on attraction.city_id = city.id where city.name = 'Osaka'),
  1,
  'combined import creates the city and place'
);
select is(
  (select attraction.long_description from public.cities city join public.attractions attraction on attraction.city_id = city.id where city.name = 'Osaka'),
  'A fuller visitor guide.',
  'combined import stores the long description'
);
select is(
  (select attraction.gallery_image_urls from public.cities city join public.attractions attraction on attraction.city_id = city.id where city.name = 'Osaka'),
  array['https://example.com/castle-view.jpg']::text[],
  'combined import stores gallery image URLs'
);
select is(
  (select attraction.sort_order from public.cities city join public.attractions attraction on attraction.city_id = city.id where city.name = 'Osaka'),
  1,
  'combined import applies the requested place ordering'
);

select * from finish();
rollback;
