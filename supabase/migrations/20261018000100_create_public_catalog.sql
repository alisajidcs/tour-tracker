create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  image_url text not null default '',
  created_at timestamptz not null default now()
);

create table public.attractions (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  image_url text not null default '',
  sort_order integer not null check (sort_order > 0),
  created_at timestamptz not null default now()
);

create index attractions_city_order_idx
  on public.attractions (city_id, sort_order, created_at);

alter table public.cities enable row level security;
alter table public.attractions enable row level security;

revoke all on table public.cities, public.attractions from public, anon, authenticated;
grant select on table public.cities, public.attractions to anon, authenticated;

create policy "Cities are readable by everyone"
  on public.cities
  for select
  to anon, authenticated
  using (true);

create policy "Attractions are readable by everyone"
  on public.attractions
  for select
  to anon, authenticated
  using (true);
