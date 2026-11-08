create table public.city_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  city_name text not null check (length(trim(city_name)) between 1 and 120),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'fulfilled')),
  fulfilled_at timestamptz,
  check (
    (status = 'pending' and fulfilled_at is null)
    or (status = 'fulfilled' and fulfilled_at is not null)
  )
);

create index city_requests_pending_created_at_idx
  on public.city_requests (created_at, id)
  where status = 'pending';

alter table public.city_requests enable row level security;
revoke all on table public.city_requests from public, anon, authenticated;
grant select on table public.city_requests to authenticated;
grant insert (city_name) on table public.city_requests to authenticated;
grant update (status, fulfilled_at) on table public.city_requests to authenticated;

create policy "Requesters and admins can read city requests"
  on public.city_requests
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.admin_users where user_id = auth.uid())
  );

create policy "Authenticated users can request a city for themselves"
  on public.city_requests
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and fulfilled_at is null
  );

create policy "Admins can fulfill city requests"
  on public.city_requests
  for update
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (
    status = 'fulfilled'
    and fulfilled_at is not null
    and exists (select 1 from public.admin_users where user_id = auth.uid())
  );

create or replace function public.create_city_from_request(
  p_request_id uuid,
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
  created_city_id uuid;
begin
  if current_user_id is null or not exists (
    select 1 from public.admin_users where user_id = current_user_id
  ) then
    raise exception 'Administrator access is required to create a city from a request.'
      using errcode = '42501';
  end if;

  perform 1
  from public.city_requests
  where id = p_request_id and status = 'pending'
  for update;
  if not found then
    raise exception 'The city request is no longer pending.' using errcode = '22023';
  end if;
  if p_name is null or public.trim_city_attraction_name(p_name) = ''
    or p_description is null or p_image_url is null
    or (btrim(p_image_url) <> '' and not public.is_valid_https_url(btrim(p_image_url))) then
    raise exception 'City details or image URL are invalid.' using errcode = '22023';
  end if;

  insert into public.cities (name, description, image_url)
  values (public.trim_city_attraction_name(p_name), btrim(p_description), btrim(p_image_url))
  returning id into created_city_id;

  update public.city_requests
  set status = 'fulfilled', fulfilled_at = now()
  where id = p_request_id;

  return created_city_id;
end;
$$;

revoke all on function public.create_city_from_request(uuid, text, text, text) from public, anon;
grant execute on function public.create_city_from_request(uuid, text, text, text) to authenticated;

create or replace function public.create_city_with_request_attractions(
  p_request_id uuid,
  p_city jsonb,
  p_places jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  created_city_id uuid;
begin
  if current_user_id is null or not exists (
    select 1 from public.admin_users where user_id = current_user_id
  ) then
    raise exception 'Administrator access is required to create a city guide.'
      using errcode = '42501';
  end if;

  perform 1 from public.city_requests
  where id = p_request_id and status = 'pending'
  for update;
  if not found then
    raise exception 'The city request is no longer pending.' using errcode = '22023';
  end if;

  created_city_id := public.create_city_with_attractions(p_city, p_places);
  update public.city_requests
  set status = 'fulfilled', fulfilled_at = now()
  where id = p_request_id;
  return created_city_id;
end;
$$;

revoke all on function public.create_city_with_request_attractions(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.create_city_with_request_attractions(uuid, jsonb, jsonb) to authenticated;
