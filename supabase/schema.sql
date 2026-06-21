create extension if not exists "pgcrypto";

create type public.app_role as enum ('MEMBER', 'ADMIN', 'SUPER_ADMIN', 'EVENTS_LEAD', 'FINANCE', 'PASTORAL');

do $$
begin
  alter type public.app_role add value if not exists 'PASTORAL';
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  address_line1 text,
  city text,
  postcode text,
  status text not null default 'VISITOR',
  tags text[] not null default '{}',
  role public.app_role not null default 'MEMBER',
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists status text not null default 'VISITOR';
alter table public.profiles add column if not exists tags text[] not null default '{}';

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
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.registrations add column if not exists checked_in_at timestamptz;

create table if not exists public.funds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true
);

create table if not exists public.settings (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.people_notes (
  id uuid primary key default gen_random_uuid(),
  profile_user_id uuid not null references public.profiles(user_id) on delete cascade,
  note text not null,
  created_by uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  consent boolean not null default false,
  status text not null default 'NEW',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  fund_id uuid references public.funds(id) on delete set null,
  amount_pence int not null check (amount_pence > 0),
  currency text not null default 'gbp',
  stripe_session_id text unique,
  payment_intent_id text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

alter table public.donations add column if not exists payment_intent_id text;

create table if not exists public.gift_aid_declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  accepted_at timestamptz not null,
  address_snapshot jsonb not null,
  wording_version text not null
);

create index if not exists sermons_published_idx on public.sermons(is_published, preached_at desc);
create index if not exists events_published_idx on public.events(is_published, starts_at asc);
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists registrations_user_id_idx on public.registrations(user_id);
create index if not exists registrations_event_id_idx on public.registrations(event_id);
create index if not exists registrations_checked_in_at_idx on public.registrations(checked_in_at desc);
create index if not exists donations_user_id_idx on public.donations(user_id);
create unique index if not exists donations_stripe_session_id_idx on public.donations(stripe_session_id);
create index if not exists gift_aid_declarations_user_id_idx on public.gift_aid_declarations(user_id);
create index if not exists people_notes_profile_user_id_idx on public.people_notes(profile_user_id);
create index if not exists leads_status_idx on public.leads(status);

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

-- Atomic event registration RPC.
--
-- Expected application-facing errors:
-- - AUTH_REQUIRED: caller is not authenticated.
-- - EVENT_NOT_FOUND: event does not exist or is not published.
-- - EVENT_FULL: capacity is reached by REGISTERED/CHECKED_IN registrations.
-- - DUPLICATE_REGISTRATION: duplicate insert race could not be resolved.
create or replace function public.register_for_event(p_event_id uuid)
returns table (
  registration_id uuid,
  qr_code text,
  event_title text,
  event_starts_at timestamptz,
  status text,
  message text,
  was_created boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_title text;
  v_event_starts_at timestamptz;
  v_event_capacity int;
  v_event_is_published boolean;
  v_existing_id uuid;
  v_existing_qr_code text;
  v_existing_status text;
  v_active_count int := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  select e.title, e.starts_at, e.capacity, e.is_published
  into v_event_title, v_event_starts_at, v_event_capacity, v_event_is_published
  from public.events e
  where e.id = p_event_id
  for update;

  if not found or v_event_is_published is not true then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  select r.id, r.qr_code, r.status
  into v_existing_id, v_existing_qr_code, v_existing_status
  from public.registrations r
  where r.event_id = p_event_id
    and r.user_id = v_user_id;

  if v_existing_id is not null then
    if v_existing_qr_code is null then
      v_existing_qr_code := gen_random_uuid()::text;

      update public.registrations
      set qr_code = v_existing_qr_code
      where id = v_existing_id;
    end if;

    return query
    select
      v_existing_id,
      v_existing_qr_code,
      v_event_title,
      v_event_starts_at,
      v_existing_status,
      'You are already registered for this event.'::text,
      false;
    return;
  end if;

  if v_event_capacity is not null then
    select count(*)::int
    into v_active_count
    from public.registrations r
    where r.event_id = p_event_id
      and r.status in ('REGISTERED', 'CHECKED_IN');

    if v_active_count >= v_event_capacity then
      raise exception 'EVENT_FULL' using errcode = 'P0001';
    end if;
  end if;

  registration_id := gen_random_uuid();
  qr_code := gen_random_uuid()::text;
  event_title := v_event_title;
  event_starts_at := v_event_starts_at;
  status := 'REGISTERED';
  message := 'Registration successful.';
  was_created := true;

  insert into public.registrations (
    id,
    event_id,
    user_id,
    status,
    qr_code
  )
  values (
    registration_id,
    p_event_id,
    v_user_id,
    status,
    qr_code
  );

  return next;
exception
  when unique_violation then
    select r.id, r.qr_code, r.status
    into v_existing_id, v_existing_qr_code, v_existing_status
    from public.registrations r
    where r.event_id = p_event_id
      and r.user_id = v_user_id;

    if v_existing_id is null then
      raise exception 'DUPLICATE_REGISTRATION' using errcode = 'P0001';
    end if;

    return query
    select
      v_existing_id,
      v_existing_qr_code,
      v_event_title,
      v_event_starts_at,
      v_existing_status,
      'You are already registered for this event.'::text,
      false;
end;
$$;

revoke all on function public.register_for_event(uuid) from public;
revoke all on function public.register_for_event(uuid) from anon;
revoke all on function public.register_for_event(uuid) from authenticated;
grant execute on function public.register_for_event(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.sermons enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.funds enable row level security;
alter table public.settings enable row level security;
alter table public.people_notes enable row level security;
alter table public.leads enable row level security;
alter table public.donations enable row level security;
alter table public.gift_aid_declarations enable row level security;

-- profiles: users can read/update own; admins can read all.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (
  auth.uid() = user_id
  or public.current_user_role() in ('ADMIN', 'SUPER_ADMIN', 'PASTORAL')
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

-- settings: authenticated users can read; finance/admin can manage.
drop policy if exists "settings_select_authenticated" on public.settings;
create policy "settings_select_authenticated"
on public.settings
for select
to authenticated
using (true);

drop policy if exists "settings_manage_finance_admin" on public.settings;
create policy "settings_manage_finance_admin"
on public.settings
for all
to authenticated
using (public.current_user_role() in ('FINANCE', 'ADMIN', 'SUPER_ADMIN'))
with check (public.current_user_role() in ('FINANCE', 'ADMIN', 'SUPER_ADMIN'));

-- people notes: strict access for admin/pastoral only.
drop policy if exists "people_notes_admin_pastoral_select" on public.people_notes;
create policy "people_notes_admin_pastoral_select"
on public.people_notes
for select
to authenticated
using (public.current_user_role() in ('SUPER_ADMIN', 'ADMIN', 'PASTORAL'));

drop policy if exists "people_notes_admin_pastoral_insert" on public.people_notes;
create policy "people_notes_admin_pastoral_insert"
on public.people_notes
for insert
to authenticated
with check (
  public.current_user_role() in ('SUPER_ADMIN', 'ADMIN', 'PASTORAL')
  and created_by = auth.uid()
);

-- leads: public can submit; admin/pastoral can read/manage.
drop policy if exists "leads_anon_insert_with_consent" on public.leads;
create policy "leads_anon_insert_with_consent"
on public.leads
for insert
to anon, authenticated
with check (consent = true);

drop policy if exists "leads_admin_pastoral_read" on public.leads;
create policy "leads_admin_pastoral_read"
on public.leads
for select
to authenticated
using (public.current_user_role() in ('SUPER_ADMIN', 'ADMIN', 'PASTORAL'));

drop policy if exists "leads_admin_pastoral_manage" on public.leads;
create policy "leads_admin_pastoral_manage"
on public.leads
for all
to authenticated
using (public.current_user_role() in ('SUPER_ADMIN', 'ADMIN', 'PASTORAL'))
with check (public.current_user_role() in ('SUPER_ADMIN', 'ADMIN', 'PASTORAL'));

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

insert into public.settings (key, value_json)
values ('gift_aid_enabled', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;
