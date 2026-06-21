create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create table if not exists public.cwb_distribution_versions (
  distribution_version text primary key,
  source_schema_profile text not null,
  consumer_schema_version text not null,
  package_name text not null,
  generated_at timestamptz not null,
  distribution_type text not null,
  translation text not null,
  source_status text not null,
  display_status text not null,
  warning text not null,
  state text not null default 'importing' check (state in ('importing', 'failed', 'validated', 'active', 'retired')),
  expected_books integer not null,
  expected_chapters integer not null,
  expected_verses integer not null,
  imported_books integer not null default 0,
  imported_chapters integer not null default 0,
  imported_verses integer not null default 0,
  imported_search_index integer not null default 0,
  manifest_sha256 text not null,
  books_sha256 text not null,
  chapters_sha256 text not null,
  verses_sha256 text not null,
  search_index_sha256 text not null,
  cwb_status_sha256 text not null,
  verse_id_set_sha256 text,
  validation_report jsonb not null default '{}'::jsonb,
  import_method text not null default 'cli_service_role',
  imported_at timestamptz,
  imported_by uuid references public.profiles(user_id) on delete set null,
  activated_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  constraint cwb_distribution_warning_exact check (
    warning = 'Internal preview only. Not reviewed, approved, final, published, or released.'
  ),
  constraint cwb_distribution_display_status_exact check (display_status = 'First Draft - Review Required'),
  constraint cwb_distribution_translation_exact check (translation = 'CWB'),
  constraint cwb_distribution_expected_counts check (
    expected_books = 66 and expected_chapters = 1189 and expected_verses = 31102
  )
);

create table if not exists public.cwb_books (
  distribution_version text not null references public.cwb_distribution_versions(distribution_version) on delete cascade,
  "order" integer not null check ("order" > 0),
  testament text not null,
  book text not null,
  book_slug text not null,
  chapters integer not null check (chapters > 0),
  verses integer not null check (verses > 0),
  primary key (distribution_version, book_slug),
  unique (distribution_version, "order"),
  unique (distribution_version, book_slug)
);

create table if not exists public.cwb_chapters (
  distribution_version text not null references public.cwb_distribution_versions(distribution_version) on delete cascade,
  book_slug text not null,
  chapter integer not null check (chapter > 0),
  reference text not null,
  verse_count integer not null check (verse_count > 0),
  primary key (distribution_version, book_slug, chapter),
  unique (distribution_version, reference),
  foreign key (distribution_version, book_slug) references public.cwb_books(distribution_version, book_slug) on delete cascade
);

create table if not exists public.cwb_verses (
  distribution_version text not null references public.cwb_distribution_versions(distribution_version) on delete cascade,
  verse_id text not null,
  translation text not null,
  testament text not null,
  book text not null,
  book_slug text not null,
  chapter integer not null check (chapter > 0),
  verse integer not null check (verse > 0),
  reference text not null,
  text text not null check (length(text) > 0),
  source_status text not null,
  source_file text not null,
  source_version text not null,
  primary key (distribution_version, verse_id),
  unique (distribution_version, book_slug, chapter, verse),
  foreign key (distribution_version, book_slug, chapter) references public.cwb_chapters(distribution_version, book_slug, chapter) on delete cascade,
  constraint cwb_verses_translation_exact check (translation = 'CWB')
);

create table if not exists public.cwb_search_index (
  distribution_version text not null references public.cwb_distribution_versions(distribution_version) on delete cascade,
  verse_id text not null,
  reference text not null,
  book_slug text not null,
  chapter integer not null check (chapter > 0),
  verse integer not null check (verse > 0),
  plain_text text not null,
  searchable_text text not null,
  primary key (distribution_version, verse_id),
  foreign key (distribution_version, verse_id) references public.cwb_verses(distribution_version, verse_id) on delete cascade
);

create table if not exists public.cwb_runtime_state (
  id boolean primary key default true check (id),
  active_distribution_version text references public.cwb_distribution_versions(distribution_version) on delete restrict,
  previous_distribution_version text references public.cwb_distribution_versions(distribution_version) on delete restrict,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(user_id) on delete set null
);

create table if not exists public.cwb_import_logs (
  id bigserial primary key,
  distribution_version text references public.cwb_distribution_versions(distribution_version) on delete set null,
  event_type text not null,
  level text not null default 'info' check (level in ('info', 'warning', 'error')),
  message text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(user_id) on delete set null
);

create table if not exists public.cwb_preview_entitlements (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  enabled boolean not null default false,
  granted_by uuid references public.profiles(user_id) on delete set null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  reason text
);

create index if not exists cwb_books_distribution_order_idx on public.cwb_books(distribution_version, "order");
create index if not exists cwb_chapters_distribution_order_idx on public.cwb_chapters(distribution_version, book_slug, chapter);
create index if not exists cwb_verses_canonical_idx on public.cwb_verses(distribution_version, book_slug, chapter, verse);
create index if not exists cwb_search_index_trgm_idx on public.cwb_search_index using gin (searchable_text gin_trgm_ops);
create index if not exists cwb_import_logs_distribution_created_idx on public.cwb_import_logs(distribution_version, created_at desc);
create index if not exists cwb_import_logs_event_created_idx on public.cwb_import_logs(event_type, created_at desc);
create index if not exists cwb_preview_entitlements_enabled_idx on public.cwb_preview_entitlements(user_id, enabled);

insert into public.cwb_runtime_state (id)
values (true)
on conflict (id) do nothing;

create or replace function public.has_cwb_preview_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cwb_preview_entitlements entitlement
    where entitlement.user_id = auth.uid()
      and entitlement.enabled = true
      and (entitlement.expires_at is null or entitlement.expires_at > now())
  )
$$;

create or replace function public.is_cwb_diagnostics_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('ADMIN', 'SUPER_ADMIN')
$$;

create or replace function public.cwb_mark_import_failed(
  p_distribution_version text,
  p_failure_reason text,
  p_validation_report jsonb default '{}'::jsonb,
  p_failed_by uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cwb_distribution_versions
  set state = 'failed',
      failure_reason = p_failure_reason,
      validation_report = coalesce(p_validation_report, '{}'::jsonb),
      imported_at = coalesce(imported_at, now()),
      imported_by = coalesce(imported_by, p_failed_by)
  where distribution_version = p_distribution_version
    and state <> 'active';

  insert into public.cwb_import_logs (distribution_version, event_type, level, message, details, created_by)
  values (
    p_distribution_version,
    'failed',
    'error',
    'CWB import failed; active distribution pointer unchanged.',
    jsonb_build_object('failure_reason', p_failure_reason),
    p_failed_by
  );
end;
$$;

create or replace function public.cwb_validate_distribution(
  p_distribution_version text,
  p_validation_report jsonb default '{}'::jsonb,
  p_validated_by uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_state text;
begin
  select state
  into target_state
  from public.cwb_distribution_versions
  where distribution_version = p_distribution_version
  for update;

  if target_state is null then
    raise exception 'Unknown CWB distribution version %', p_distribution_version;
  end if;

  if target_state <> 'importing' then
    raise exception 'CWB distribution % must be importing before validation; current state is %', p_distribution_version, target_state;
  end if;

  update public.cwb_distribution_versions
  set state = 'validated',
      validation_report = coalesce(p_validation_report, '{}'::jsonb),
      imported_at = coalesce(imported_at, now()),
      imported_by = coalesce(imported_by, p_validated_by),
      failure_reason = null
  where distribution_version = p_distribution_version;

  insert into public.cwb_import_logs (distribution_version, event_type, level, message, details, created_by)
  values (
    p_distribution_version,
    'validated',
    'info',
    'CWB distribution validated and ready for explicit activation.',
    coalesce(p_validation_report, '{}'::jsonb),
    p_validated_by
  );
end;
$$;

create or replace function public.cwb_activate_distribution(
  p_distribution_version text,
  p_activated_by uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_active text;
  target_state text;
begin
  select state
  into target_state
  from public.cwb_distribution_versions
  where distribution_version = p_distribution_version
  for update;

  if target_state is null then
    raise exception 'Unknown CWB distribution version %', p_distribution_version;
  end if;

  if target_state <> 'validated' then
    raise exception 'CWB distribution % must be validated before activation; current state is %', p_distribution_version, target_state;
  end if;

  select active_distribution_version
  into current_active
  from public.cwb_runtime_state
  where id = true
  for update;

  if current_active is not null and current_active <> p_distribution_version then
    update public.cwb_distribution_versions
    set state = 'retired'
    where distribution_version = current_active;
  end if;

  update public.cwb_distribution_versions
  set state = 'active',
      activated_at = now()
  where distribution_version = p_distribution_version;

  update public.cwb_runtime_state
  set active_distribution_version = p_distribution_version,
      previous_distribution_version = current_active,
      updated_at = now(),
      updated_by = p_activated_by
  where id = true;

  insert into public.cwb_import_logs (distribution_version, event_type, level, message, details, created_by)
  values (
    p_distribution_version,
    'activated',
    'info',
    'CWB distribution activated for entitled internal preview users.',
    jsonb_build_object('previous_distribution_version', current_active),
    p_activated_by
  );
end;
$$;

create or replace function public.cwb_rollback_distribution(p_rolled_back_by uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_active text;
  previous_version text;
  previous_state text;
begin
  select active_distribution_version, previous_distribution_version
  into current_active, previous_version
  from public.cwb_runtime_state
  where id = true
  for update;

  if previous_version is null then
    raise exception 'No previous CWB distribution is available for rollback';
  end if;

  select state
  into previous_state
  from public.cwb_distribution_versions
  where distribution_version = previous_version
  for update;

  if previous_state not in ('validated', 'retired') then
    raise exception 'Previous CWB distribution % is not a validated rollback target; current state is %', previous_version, previous_state;
  end if;

  if current_active is not null then
    update public.cwb_distribution_versions
    set state = 'retired'
    where distribution_version = current_active;
  end if;

  update public.cwb_distribution_versions
  set state = 'active',
      activated_at = now()
  where distribution_version = previous_version;

  update public.cwb_runtime_state
  set active_distribution_version = previous_version,
      previous_distribution_version = current_active,
      updated_at = now(),
      updated_by = p_rolled_back_by
  where id = true;

  insert into public.cwb_import_logs (distribution_version, event_type, level, message, details, created_by)
  values (
    previous_version,
    'rolled_back',
    'warning',
    'CWB runtime state rolled back to the previous validated distribution.',
    jsonb_build_object('rolled_back_from', current_active),
    p_rolled_back_by
  );
end;
$$;

revoke all on function public.cwb_mark_import_failed(text, text, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.cwb_validate_distribution(text, jsonb, uuid) from public, anon, authenticated;
revoke all on function public.cwb_activate_distribution(text, uuid) from public, anon, authenticated;
revoke all on function public.cwb_rollback_distribution(uuid) from public, anon, authenticated;

grant execute on function public.has_cwb_preview_access() to authenticated;
grant execute on function public.is_cwb_diagnostics_admin() to authenticated;
grant execute on function public.cwb_mark_import_failed(text, text, jsonb, uuid) to service_role;
grant execute on function public.cwb_validate_distribution(text, jsonb, uuid) to service_role;
grant execute on function public.cwb_activate_distribution(text, uuid) to service_role;
grant execute on function public.cwb_rollback_distribution(uuid) to service_role;

alter table public.cwb_distribution_versions enable row level security;
alter table public.cwb_books enable row level security;
alter table public.cwb_chapters enable row level security;
alter table public.cwb_verses enable row level security;
alter table public.cwb_search_index enable row level security;
alter table public.cwb_runtime_state enable row level security;
alter table public.cwb_import_logs enable row level security;
alter table public.cwb_preview_entitlements enable row level security;

drop policy if exists "cwb_distribution_versions_select_diagnostics_or_active_entitled" on public.cwb_distribution_versions;
create policy "cwb_distribution_versions_select_diagnostics_or_active_entitled"
on public.cwb_distribution_versions
for select
to authenticated
using (
  public.is_cwb_diagnostics_admin()
  or (
    public.has_cwb_preview_access()
    and distribution_version = (
      select active_distribution_version
      from public.cwb_runtime_state
      where id = true
    )
  )
);

drop policy if exists "cwb_books_select_active_entitled" on public.cwb_books;
create policy "cwb_books_select_active_entitled"
on public.cwb_books
for select
to authenticated
using (
  public.has_cwb_preview_access()
  and distribution_version = (
    select active_distribution_version
    from public.cwb_runtime_state
    where id = true
  )
);

drop policy if exists "cwb_chapters_select_active_entitled" on public.cwb_chapters;
create policy "cwb_chapters_select_active_entitled"
on public.cwb_chapters
for select
to authenticated
using (
  public.has_cwb_preview_access()
  and distribution_version = (
    select active_distribution_version
    from public.cwb_runtime_state
    where id = true
  )
);

drop policy if exists "cwb_verses_select_active_entitled" on public.cwb_verses;
create policy "cwb_verses_select_active_entitled"
on public.cwb_verses
for select
to authenticated
using (
  public.has_cwb_preview_access()
  and distribution_version = (
    select active_distribution_version
    from public.cwb_runtime_state
    where id = true
  )
);

drop policy if exists "cwb_search_index_select_active_entitled" on public.cwb_search_index;
create policy "cwb_search_index_select_active_entitled"
on public.cwb_search_index
for select
to authenticated
using (
  public.has_cwb_preview_access()
  and distribution_version = (
    select active_distribution_version
    from public.cwb_runtime_state
    where id = true
  )
);

drop policy if exists "cwb_runtime_state_select_diagnostics_admin" on public.cwb_runtime_state;
create policy "cwb_runtime_state_select_diagnostics_admin"
on public.cwb_runtime_state
for select
to authenticated
using (public.is_cwb_diagnostics_admin());

drop policy if exists "cwb_import_logs_select_diagnostics_admin" on public.cwb_import_logs;
create policy "cwb_import_logs_select_diagnostics_admin"
on public.cwb_import_logs
for select
to authenticated
using (public.is_cwb_diagnostics_admin());

drop policy if exists "cwb_preview_entitlements_select_self_or_admin" on public.cwb_preview_entitlements;
create policy "cwb_preview_entitlements_select_self_or_admin"
on public.cwb_preview_entitlements
for select
to authenticated
using (auth.uid() = user_id or public.is_cwb_diagnostics_admin());

drop policy if exists "cwb_preview_entitlements_manage_admin" on public.cwb_preview_entitlements;
create policy "cwb_preview_entitlements_manage_admin"
on public.cwb_preview_entitlements
for all
to authenticated
using (public.is_cwb_diagnostics_admin())
with check (public.is_cwb_diagnostics_admin());
