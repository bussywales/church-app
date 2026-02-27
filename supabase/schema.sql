create extension if not exists "pgcrypto";

create type public.app_role as enum ('MEMBER', 'ADMIN', 'SUPER_ADMIN', 'EVENTS_LEAD', 'FINANCE');

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address_line1 text,
  city text,
  postcode text,
  role public.app_role not null default 'MEMBER',
  created_at timestamptz not null default now()
);

create table if not exists public.sermons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  speaker text,
  series text,
  youtube_url text,
  preached_at date,
  notes_md text,
  tags text[] not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity int,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  status text not null default 'REGISTERED',
  qr_code text,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.funds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  fund_id uuid references public.funds(id) on delete set null,
  amount_pence int not null check (amount_pence > 0),
  currency text not null default 'gbp',
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table if not exists public.gift_aid_declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  accepted_at timestamptz not null,
  address_snapshot jsonb not null,
  wording_version text not null
);

create index if not exists sermons_published_idx on public.sermons(is_published, preached_at desc);
create index if not exists events_published_idx on public.events(is_published, starts_at asc);
create index if not exists registrations_user_id_idx on public.registrations(user_id);
create index if not exists registrations_event_id_idx on public.registrations(event_id);
create index if not exists donations_user_id_idx on public.donations(user_id);
create index if not exists gift_aid_declarations_user_id_idx on public.gift_aid_declarations(user_id);

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid()
$$;

grant execute on function public.current_user_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.sermons enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.funds enable row level security;
alter table public.donations enable row level security;
alter table public.gift_aid_declarations enable row level security;

-- profiles: users can read/update own; admins can read all.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (
  auth.uid() = user_id
  or public.current_user_role() in ('ADMIN', 'SUPER_ADMIN')
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

-- sermons/events: public can read published; admins can manage.
drop policy if exists "sermons_select_published" on public.sermons;
create policy "sermons_select_published"
on public.sermons
for select
using (is_published = true);

drop policy if exists "sermons_admin_manage" on public.sermons;
create policy "sermons_admin_manage"
on public.sermons
for all
to authenticated
using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN', 'EVENTS_LEAD'))
with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN', 'EVENTS_LEAD'));

drop policy if exists "events_select_published" on public.events;
create policy "events_select_published"
on public.events
for select
using (is_published = true);

drop policy if exists "events_admin_manage" on public.events;
create policy "events_admin_manage"
on public.events
for all
to authenticated
using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN', 'EVENTS_LEAD'))
with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN', 'EVENTS_LEAD'));

-- registrations: user can read own; events/admin can read all; create only for self.
drop policy if exists "registrations_select_own_or_events_admin" on public.registrations;
create policy "registrations_select_own_or_events_admin"
on public.registrations
for select
using (
  auth.uid() = user_id
  or public.current_user_role() in ('EVENTS_LEAD', 'ADMIN', 'SUPER_ADMIN')
);

drop policy if exists "registrations_insert_self" on public.registrations;
create policy "registrations_insert_self"
on public.registrations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "registrations_update_events_admin" on public.registrations;
create policy "registrations_update_events_admin"
on public.registrations
for update
to authenticated
using (public.current_user_role() in ('EVENTS_LEAD', 'ADMIN', 'SUPER_ADMIN'))
with check (public.current_user_role() in ('EVENTS_LEAD', 'ADMIN', 'SUPER_ADMIN'));

-- funds: public can read active funds; admins can manage.
drop policy if exists "funds_select_active" on public.funds;
create policy "funds_select_active"
on public.funds
for select
using (is_active = true);

drop policy if exists "funds_admin_manage" on public.funds;
create policy "funds_admin_manage"
on public.funds
for all
to authenticated
using (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN', 'FINANCE'))
with check (public.current_user_role() in ('ADMIN', 'SUPER_ADMIN', 'FINANCE'));

-- donations/declarations: user can read own; FINANCE can read all.
drop policy if exists "donations_select_own_or_finance" on public.donations;
create policy "donations_select_own_or_finance"
on public.donations
for select
using (
  auth.uid() = user_id
  or public.current_user_role() = 'FINANCE'
);

drop policy if exists "donations_insert_self" on public.donations;
create policy "donations_insert_self"
on public.donations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "gift_aid_select_own_or_finance" on public.gift_aid_declarations;
create policy "gift_aid_select_own_or_finance"
on public.gift_aid_declarations
for select
using (
  auth.uid() = user_id
  or public.current_user_role() = 'FINANCE'
);

drop policy if exists "gift_aid_insert_self" on public.gift_aid_declarations;
create policy "gift_aid_insert_self"
on public.gift_aid_declarations
for insert
to authenticated
with check (auth.uid() = user_id);
