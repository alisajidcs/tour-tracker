create table public.user_visits (
  user_id uuid not null references auth.users(id) on delete cascade,
  attraction_id uuid not null references public.attractions(id) on delete cascade,
  visited_at timestamptz not null default now(),
  primary key (user_id, attraction_id)
);

create index user_visits_attraction_idx
  on public.user_visits (attraction_id);

alter table public.user_visits enable row level security;

revoke all on table public.user_visits from public, anon, authenticated;
grant select, insert, delete on table public.user_visits to authenticated;

create policy "Users can read their own visits"
  on public.user_visits
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add their own visits"
  on public.user_visits
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own visits"
  on public.user_visits
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_user_visit(
  p_attraction_id uuid,
  p_visited boolean
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required to update checklist progress.'
      using errcode = '42501';
  end if;

  if p_visited then
    insert into public.user_visits (user_id, attraction_id)
    values (current_user_id, p_attraction_id)
    on conflict (user_id, attraction_id) do nothing;
  else
    delete from public.user_visits
    where user_id = current_user_id
      and user_visits.attraction_id = p_attraction_id;
  end if;
end;
$$;

create or replace function public.replace_user_visits(visited_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required to replace checklist progress.'
      using errcode = '42501';
  end if;

  delete from public.user_visits
  where user_id = current_user_id;

  insert into public.user_visits (user_id, attraction_id)
  select current_user_id, requested.id
  from unnest(coalesce(visited_ids, array[]::uuid[])) as requested(id)
  where exists (
    select 1
    from public.attractions
    where attractions.id = requested.id
  )
  on conflict (user_id, attraction_id) do nothing;
end;
$$;

revoke all on function public.set_user_visit(uuid, boolean) from public, anon;
grant execute on function public.set_user_visit(uuid, boolean) to authenticated;

revoke all on function public.replace_user_visits(uuid[]) from public, anon;
grant execute on function public.replace_user_visits(uuid[]) to authenticated;
