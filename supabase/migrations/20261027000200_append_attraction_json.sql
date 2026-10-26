create or replace function public.trim_city_attraction_name(p_name text)
returns text
language sql
immutable
strict
set search_path = pg_catalog
as $$
  select btrim(
    p_name,
    ' ' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13)
      || chr(160) || chr(5760)
      || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196)
      || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201)
      || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287)
      || chr(12288) || chr(65279)
  )
$$;

create or replace function public.normalize_city_attraction_name(p_name text)
returns text
language sql
immutable
strict
set search_path = pg_catalog
as $$
  select lower(public.trim_city_attraction_name(p_name))
$$;

create or replace function public.is_valid_https_url(p_url text)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
declare
  url_parts text[];
  host_value text;
  numeric_host_value text;
  numeric_parts text[];
  numeric_part_count integer;
  numeric_part_index integer;
  numeric_part_value numeric;
  numeric_last_part_limit numeric;
begin
  url_parts := regexp_match(
    p_url,
    '^https://(\[[0-9A-Fa-f:.]+\]|[^/?#[:space:]:]+)(:([0-9]+))?([/?#][^[:space:]]*)?$',
    'i'
  );

  if url_parts is null then
    return false;
  end if;

  host_value := url_parts[1];
  if left(host_value, 1) = '[' then
    begin
      if family(substring(host_value from 2 for length(host_value) - 2)::inet) <> 6 then
        return false;
      end if;
    exception when invalid_text_representation then
      return false;
    end;
  elsif host_value ~ '^[0-9.]+$' then
    if right(host_value, 2) = '..' then
      return false;
    end if;
    numeric_host_value := case
      when right(host_value, 1) = '.' then left(host_value, length(host_value) - 1)
      else host_value
    end;
    numeric_parts := string_to_array(numeric_host_value, '.');
    numeric_part_count := cardinality(numeric_parts);
    if numeric_part_count < 1 or numeric_part_count > 4 then
      return false;
    end if;
    numeric_last_part_limit := case numeric_part_count
      when 1 then 4294967295
      when 2 then 16777215
      when 3 then 65535
      else 255
    end;
    for numeric_part_index in 1..numeric_part_count loop
      if numeric_parts[numeric_part_index] = ''
        or length(numeric_parts[numeric_part_index]) > 10 then
        return false;
      end if;
      numeric_part_value := numeric_parts[numeric_part_index]::numeric;
      if numeric_part_index < numeric_part_count and numeric_part_value > 255 then
        return false;
      end if;
      if numeric_part_index = numeric_part_count
        and numeric_part_value > numeric_last_part_limit then
        return false;
      end if;
    end loop;
  elsif host_value !~ '^([[:alnum:]]([[:alnum:]_-]{0,61}[[:alnum:]])?)(\.([[:alnum:]]([[:alnum:]_-]{0,61}[[:alnum:]])?))*\.?$' then
    return false;
  end if;

  return url_parts[3] is null
    or url_parts[3]::numeric between 1 and 65535;
end;
$$;

revoke all on function public.trim_city_attraction_name(text) from public, anon;
grant execute on function public.trim_city_attraction_name(text) to authenticated;
revoke all on function public.normalize_city_attraction_name(text) from public, anon;
grant execute on function public.normalize_city_attraction_name(text) to authenticated;
revoke all on function public.is_valid_https_url(text) from public, anon;
grant execute on function public.is_valid_https_url(text) to authenticated;

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
    raise exception 'Administrator access is required to import attractions.'
      using errcode = '42501';
  end if;

  perform 1 from public.cities where id = p_city_id for update;
  if not found then
    raise exception 'The selected city does not exist.'
      using errcode = '23503';
  end if;

  if jsonb_typeof(p_places) is distinct from 'array' then
    raise exception 'Import data must contain a places array.'
      using errcode = '22023';
  end if;

  places_count := jsonb_array_length(p_places);
  if places_count < 1 or places_count > 500 then
    raise exception 'Import between 1 and 500 attractions at a time.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_places) as item(value)
    where jsonb_typeof(item.value) is distinct from 'object'
      or jsonb_typeof(item.value -> 'name') is distinct from 'string'
      or public.trim_city_attraction_name(item.value ->> 'name') = ''
      or jsonb_typeof(item.value -> 'description') is distinct from 'string'
      or jsonb_typeof(item.value -> 'imageUrl') is distinct from 'string'
      or not public.is_valid_https_url(btrim(item.value ->> 'imageUrl'))
      or jsonb_typeof(item.value -> 'order') is distinct from 'number'
      or (item.value ->> 'order')::numeric <= 0
      or trunc((item.value ->> 'order')::numeric) <> (item.value ->> 'order')::numeric
  ) then
    raise exception 'Every place needs a name, description, HTTPS imageUrl, and positive whole-number order.'
      using errcode = '22023';
  end if;

  if exists (
    select public.normalize_city_attraction_name(item.value ->> 'name')
    from jsonb_array_elements(p_places) as item(value)
    group by public.normalize_city_attraction_name(item.value ->> 'name')
    having count(*) > 1
  ) then
    raise exception 'The import contains duplicate attraction names.'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_places) as item(value)
    join public.attractions as attraction
      on attraction.city_id = p_city_id
      and public.normalize_city_attraction_name(attraction.name)
        = public.normalize_city_attraction_name(item.value ->> 'name')
  ) then
    raise exception 'An attraction with one of these names already exists in this city.'
      using errcode = '23505';
  end if;

  select coalesce(max(sort_order), 0)
  into existing_max_order
  from public.attractions
  where city_id = p_city_id;

  if existing_max_order::bigint + places_count > 2147483647 then
    raise exception 'There is not enough order range to append this batch.'
      using errcode = '22003';
  end if;

  with parsed as (
    select
      value ->> 'name' as name,
      value ->> 'description' as description,
      btrim(value ->> 'imageUrl') as image_url,
      (value ->> 'order')::numeric as requested_order,
      ordinal_position
    from jsonb_array_elements(p_places) with ordinality as item(value, ordinal_position)
  ),
  ordered as (
    select
      name,
      description,
      image_url,
      row_number() over (order by requested_order, ordinal_position)::integer as appended_order
    from parsed
  )
  insert into public.attractions (
    city_id,
    name,
    description,
    image_url,
    sort_order
  )
  select
    p_city_id,
    public.trim_city_attraction_name(ordered.name),
    btrim(ordered.description),
    ordered.image_url,
    existing_max_order + ordered.appended_order
  from ordered;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.append_city_attractions(uuid, jsonb) from public, anon;
grant execute on function public.append_city_attractions(uuid, jsonb) to authenticated;

create or replace function public.create_city_attraction(
  p_city_id uuid,
  p_name text,
  p_description text,
  p_image_url text
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  next_order bigint;
  created_id uuid;
begin
  if current_user_id is null or not exists (
    select 1 from public.admin_users where user_id = current_user_id
  ) then
    raise exception 'Administrator access is required to create attractions.'
      using errcode = '42501';
  end if;

  perform 1 from public.cities where id = p_city_id for update;
  if not found then
    raise exception 'The selected city does not exist.'
      using errcode = '23503';
  end if;

  if p_name is null or public.trim_city_attraction_name(p_name) = '' or p_description is null
    or p_image_url is null
    or (btrim(p_image_url) <> '' and not public.is_valid_https_url(btrim(p_image_url))) then
    raise exception 'Attraction details are invalid. Names must be non-empty and image URLs must use HTTPS.'
      using errcode = '22023';
  end if;

  select coalesce(max(sort_order), 0) + 1
  into next_order
  from public.attractions
  where city_id = p_city_id;

  if next_order > 2147483647 then
    raise exception 'There is not enough order range to add another attraction.'
      using errcode = '22003';
  end if;

  insert into public.attractions (city_id, name, description, image_url, sort_order)
  values (p_city_id, public.trim_city_attraction_name(p_name), btrim(p_description), btrim(p_image_url), next_order)
  returning id into created_id;

  return created_id;
end;
$$;

revoke all on function public.create_city_attraction(uuid, text, text, text) from public, anon;
grant execute on function public.create_city_attraction(uuid, text, text, text) to authenticated;

create or replace function public.reorder_city_attractions(
  p_city_id uuid,
  p_attraction_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  actual_count integer;
  requested_count integer;
  requested_length integer;
begin
  if current_user_id is null or not exists (
    select 1 from public.admin_users where user_id = current_user_id
  ) then
    raise exception 'Administrator access is required to reorder attractions.'
      using errcode = '42501';
  end if;

  perform 1 from public.cities where id = p_city_id for update;
  if not found then
    raise exception 'The selected city does not exist.'
      using errcode = '23503';
  end if;

  select count(*)::integer
  into actual_count
  from public.attractions
  where city_id = p_city_id;

  select count(distinct requested.id)::integer
  into requested_count
  from unnest(coalesce(p_attraction_ids, array[]::uuid[])) as requested(id);

  requested_length := cardinality(coalesce(p_attraction_ids, array[]::uuid[]));

  if requested_length <> actual_count
    or requested_count <> actual_count
    or exists (
      select 1
      from unnest(coalesce(p_attraction_ids, array[]::uuid[])) as requested(id)
      where not exists (
        select 1
        from public.attractions
        where attractions.id = requested.id
          and attractions.city_id = p_city_id
      )
    ) then
    raise exception 'The attraction order must contain every attraction in this city exactly once.'
      using errcode = '22023';
  end if;

  update public.attractions as attraction
  set sort_order = requested.position::integer
  from unnest(coalesce(p_attraction_ids, array[]::uuid[]))
    with ordinality as requested(id, position)
  where attraction.id = requested.id
    and attraction.city_id = p_city_id;
end;
$$;

revoke all on function public.reorder_city_attractions(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_city_attractions(uuid, uuid[]) to authenticated;
