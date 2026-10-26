create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on table public.admin_users from public, anon, authenticated;
grant select on table public.admin_users to authenticated;

create policy "Users can read their own admin membership"
  on public.admin_users
  for select
  to authenticated
  using (auth.uid() = user_id);

grant insert, update, delete on table public.cities, public.attractions to authenticated;

create policy "Admins can create cities"
  on public.cities
  for insert
  to authenticated
  with check (exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ));

create policy "Admins can update cities"
  on public.cities
  for update
  to authenticated
  using (exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ));

create policy "Admins can delete cities"
  on public.cities
  for delete
  to authenticated
  using (exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ));

create policy "Admins can create attractions"
  on public.attractions
  for insert
  to authenticated
  with check (exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ));

create policy "Admins can update attractions"
  on public.attractions
  for update
  to authenticated
  using (exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ));

create policy "Admins can delete attractions"
  on public.attractions
  for delete
  to authenticated
  using (exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ));

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
