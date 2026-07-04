# Event Registration Verification

Use this checklist after applying `supabase/migrations/20260621144212_atomic_event_registration.sql` to staging.
Do not run these checks against production.

## Scope

The registration API calls `public.register_for_event(p_event_id uuid)`, which:

- uses `auth.uid()` instead of a client-provided user id;
- locks the target event row before capacity checks;
- counts `REGISTERED` and `CHECKED_IN` registrations as occupying capacity;
- returns `registration_id`, `qr_code`, event details, `status`, `message`, and `was_created`;
- blocks unpublished/missing events, unauthenticated users, duplicates, and full events.

Public event availability uses `public.get_event_registration_availability(p_event_id uuid)`, which returns only aggregate
availability fields and avoids misleading RLS-scoped registration counts.

## Automated RPC/Database Verification

1. Apply the migration to staging.

```bash
npx supabase link --project-ref onikyhqhcbmrrlrcirrg
npx supabase db push
```

2. Confirm the staging app is deployed with the migration applied.

```bash
npx vercel@54.4.1 link --yes --project church-app-staging
npx vercel@54.4.1 --prod
```

3. Run the automated staging verification script.

The script refuses to run unless `.env.local` points at staging project ref `onikyhqhcbmrrlrcirrg`. It creates disposable
staging auth users, profiles, published/unpublished test events, and a capacity-one event; runs
duplicate/full/QR/availability/rejection checks; proves `CHECKED_IN` rows still occupy capacity at the database level; and
deletes all disposable records in a `finally` cleanup path.

```bash
npm run verify:event-registration:staging
```

Expected output includes:

```text
Staging ref confirmed? yes
Concurrency overbooking detected? no
Concurrency winner: user-1
Concurrency loser: user-2
Concurrency loser received EVENT_FULL? yes
Duplicate registration blocked? yes
QR token returned? yes
Availability count accurate? yes
Database-level CHECKED_IN capacity accounting? yes
Unpublished event rejected? yes
Non-existent event rejected? yes
Unauthenticated RPC rejected? yes
Disposable staging cleanup proven? yes
Disposable auth user cleanup proven? yes
```

The concurrency winner may be either user. The important invariant is exactly one winner, exactly one `EVENT_FULL` loser,
and zero overbooking.

If cleanup proof fails or concurrency overbooks, stop immediately and do not merge or deploy further.

## Manual Browser Checks

These checks validate the app routes and admin RBAC surfaces that the automated RPC/database verification does not claim to
cover.

### Duplicate Registration

- Sign in as a staging test user.
- Register once for a published event with spare capacity.
- Register for the same event again.
- Expected result: the second request returns an already-registered message and does not create a second row.

### Capacity

- Use a published staging event with capacity `1`.
- Register as test user A.
- Attempt registration as test user B.
- Expected result: user B receives `Event capacity reached.`

### QR Display

- After successful registration, verify `/my/registrations` shows the registration and QR token.
- Expected result: QR token is present and non-empty.

### Concurrency

- Create or use a published staging event with capacity `1`.
- Use two separate authenticated browser sessions or test users.
- Submit registration requests for both users as close together as possible.
- Expected result: exactly one request succeeds and exactly one request is rejected as full.
- Confirm the database has no more than one active registration for that event:

```sql
select count(*) as active_registrations
from public.registrations
where event_id = '<STAGING_EVENT_ID>'
  and status in ('REGISTERED', 'CHECKED_IN');
```

The count must not exceed the event capacity.

### Admin Check-In Route

Use a disposable staging event and registration. Do not use production data.

1. Create or use a published staging event with spare capacity.
2. Register as a staging member and copy the real QR token from `/my/registrations`.
3. Sign in as a staging user with one of the admin roles allowed for event check-in.
4. Open `/admin/events/<STAGING_EVENT_ID>/checkin`.
5. Submit the QR token.
6. Expected result: the registration status becomes `CHECKED_IN` and `checked_in_at` is populated.
7. Sign in as a normal member without an admin role and open the same check-in route.
8. Expected result: access is denied or redirected.

Cleanup after the manual check:

```sql
delete from public.registrations
where event_id = '<STAGING_EVENT_ID>';

delete from public.events
where id = '<STAGING_EVENT_ID>';
```

If a disposable auth user/profile was created for the browser check, remove it from Supabase Auth and `public.profiles`.
Do not claim the admin check-in route is validated until this browser check has been completed.
