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
