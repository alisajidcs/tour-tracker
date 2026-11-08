alter table public.attractions
  add column long_description text not null default '',
  add column gallery_image_urls text[] not null default '{}';

create or replace function public.append_city_attractions(
  p_city_id uuid,
  p_places jsonb
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  existing_max_order integer;
  places_count integer;
  inserted_count integer;
begin
  if current_user_id is null or not exists (
    select 1 from public.admin_users where user_id = current_user_id
  ) then
    raise exception 'Administrator access is required to import attractions.' using errcode = '42501';
  end if;

  perform 1 from public.cities where id = p_city_id for update;
  if not found then
    raise exception 'The selected city does not exist.' using errcode = '23503';
  end if;
  if jsonb_typeof(p_places) is distinct from 'array' then
    raise exception 'Import data must contain a places array.' using errcode = '22023';
  end if;
  places_count := jsonb_array_length(p_places);
  if places_count < 1 or places_count > 500 then
    raise exception 'Import between 1 and 500 attractions at a time.' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_places) as item(value)
    where jsonb_typeof(item.value) is distinct from 'object'
      or jsonb_typeof(item.value -> 'name') is distinct from 'string'
      or public.trim_city_attraction_name(item.value ->> 'name') = ''
      or jsonb_typeof(item.value -> 'description') is distinct from 'string'
      or jsonb_typeof(item.value -> 'imageUrl') is distinct from 'string'
      or not public.is_valid_https_url(btrim(item.value ->> 'imageUrl'))
      or jsonb_typeof(item.value -> 'order') is distinct from 'number'
      or (item.value ->> 'order')::numeric <= 0
      or trunc((item.value ->> 'order')::numeric) <> (item.value ->> 'order')::numeric
      or (item.value ? 'longDescription' and jsonb_typeof(item.value -> 'longDescription') is distinct from 'string')
      or (item.value ? 'galleryImageUrls' and jsonb_typeof(item.value -> 'galleryImageUrls') is distinct from 'array')
      or exists (
        select 1 from jsonb_array_elements_text(
          case when jsonb_typeof(item.value -> 'galleryImageUrls') = 'array'
            then item.value -> 'galleryImageUrls' else '[]'::jsonb end
        ) as gallery(url)
        where gallery.url is null or not public.is_valid_https_url(btrim(gallery.url))
      )
  ) then
    raise exception 'Every place needs valid details, order, and HTTPS gallery image URLs.' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_places) as item(value)
    group by public.normalize_city_attraction_name(item.value ->> 'name') having count(*) > 1
  ) then
    raise exception 'The import contains duplicate attraction names.' using errcode = '23505';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_places) as item(value)
    join public.attractions as attraction on attraction.city_id = p_city_id
      and public.normalize_city_attraction_name(attraction.name) = public.normalize_city_attraction_name(item.value ->> 'name')
  ) then
    raise exception 'An attraction with one of these names already exists in this city.' using errcode = '23505';
  end if;

  select coalesce(max(sort_order), 0) into existing_max_order
  from public.attractions where city_id = p_city_id;
  if existing_max_order::bigint + places_count > 2147483647 then
    raise exception 'There is not enough order range to append this batch.' using errcode = '22003';
  end if;

  with parsed as (
    select value ->> 'name' as name, value ->> 'description' as description,
      btrim(value ->> 'imageUrl') as image_url,
      coalesce(value ->> 'longDescription', '') as long_description,
      coalesce(array(select jsonb_array_elements_text(value -> 'galleryImageUrls')), array[]::text[]) as gallery_image_urls,
      (value ->> 'order')::numeric as requested_order, ordinal_position
    from jsonb_array_elements(p_places) with ordinality as item(value, ordinal_position)
  ), ordered as (
    select *, row_number() over (order by requested_order, ordinal_position)::integer as appended_order from parsed
  )
  insert into public.attractions (city_id, name, description, image_url, long_description, gallery_image_urls, sort_order)
  select p_city_id, public.trim_city_attraction_name(name), btrim(description), image_url,
    btrim(long_description), gallery_image_urls, existing_max_order + appended_order
  from ordered;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.create_city_attraction(
  p_city_id uuid,
  p_name text,
  p_description text,
  p_image_url text,
  p_long_description text,
  p_gallery_image_urls text[]
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  created_id uuid;
  next_order bigint;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or not exists (select 1 from public.admin_users where user_id = current_user_id) then
    raise exception 'Administrator access is required to create attractions.' using errcode = '42501';
  end if;
  perform 1 from public.cities where id = p_city_id for update;
  if not found then raise exception 'The selected city does not exist.' using errcode = '23503'; end if;
  if p_name is null or public.trim_city_attraction_name(p_name) = '' or p_description is null
    or p_image_url is null or (btrim(p_image_url) <> '' and not public.is_valid_https_url(btrim(p_image_url)))
    or exists (select 1 from unnest(coalesce(p_gallery_image_urls, array[]::text[])) as gallery(url) where url is null or not public.is_valid_https_url(btrim(url))) then
    raise exception 'Attraction details or image URLs are invalid.' using errcode = '22023';
  end if;
  select coalesce(max(sort_order), 0) + 1 into next_order from public.attractions where city_id = p_city_id;
  if next_order > 2147483647 then raise exception 'There is not enough order range to add another attraction.' using errcode = '22003'; end if;
  insert into public.attractions (city_id, name, description, image_url, long_description, gallery_image_urls, sort_order)
  values (p_city_id, public.trim_city_attraction_name(p_name), btrim(p_description), btrim(p_image_url),
    btrim(coalesce(p_long_description, '')), coalesce(p_gallery_image_urls, array[]::text[]), next_order)
  returning id into created_id;
  return created_id;
end;
$$;

revoke all on function public.create_city_attraction(uuid, text, text, text, text, text[]) from public, anon;
grant execute on function public.create_city_attraction(uuid, text, text, text, text, text[]) to authenticated;

create or replace function public.create_city_with_attractions(p_city jsonb, p_places jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  city_id uuid;
  city_name text;
  city_description text;
  city_image_url text;
  places_count integer;
begin
  if current_user_id is null or not exists (select 1 from public.admin_users where user_id = current_user_id) then
    raise exception 'Administrator access is required to create a city guide.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_city) is distinct from 'object'
    or jsonb_typeof(p_city -> 'name') is distinct from 'string'
    or jsonb_typeof(p_city -> 'description') is distinct from 'string'
    or jsonb_typeof(p_city -> 'imageUrl') is distinct from 'string' then
    raise exception 'City needs a name, description, and imageUrl.' using errcode = '22023';
  end if;
  city_name := public.trim_city_attraction_name(p_city ->> 'name');
  city_description := btrim(p_city ->> 'description');
  city_image_url := btrim(p_city ->> 'imageUrl');
  if city_name = '' or (city_image_url <> '' and not public.is_valid_https_url(city_image_url)) then
    raise exception 'City name or imageUrl is invalid.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_places) is distinct from 'array' then
    raise exception 'Guide data must contain a places array.' using errcode = '22023';
  end if;
  places_count := jsonb_array_length(p_places);
  if places_count < 1 or places_count > 500 then
    raise exception 'Add between 1 and 500 places to the guide.' using errcode = '22023';
  end if;

  -- Reuse the existing atomic validator/append operation inside this transaction by
  -- inserting the city first; any validation error rolls the entire function back.
  insert into public.cities (name, description, image_url)
  values (city_name, city_description, city_image_url) returning id into city_id;
  perform public.append_city_attractions(city_id, p_places);
  return city_id;
end;
$$;

revoke all on function public.create_city_with_attractions(jsonb, jsonb) from public, anon;
grant execute on function public.create_city_with_attractions(jsonb, jsonb) to authenticated;
