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

## Manual Staging Checks

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
staging auth users, profiles, and a capacity-one event; runs duplicate/full/QR/check-in checks; and deletes all disposable
records in a `finally` cleanup path.

```bash
npm run verify:event-registration:staging
```

Expected output includes:

```text
Staging ref confirmed? yes
Concurrency overbooking detected? no
Duplicate registration blocked? yes
QR token returned? yes
Availability count accurate? yes
Check-in occupies capacity? yes
Disposable staging cleanup proven? yes
```

If cleanup proof fails or concurrency overbooks, stop immediately and do not merge or deploy further.

4. Optional browser duplicate registration check.

- Sign in as a staging test user.
- Register once for a published event with spare capacity.
- Register for the same event again.
- Expected result: the second request returns an already-registered message and does not create a second row.

5. Optional browser capacity check.

- Use a published staging event with capacity `1`.
- Register as test user A.
- Attempt registration as test user B.
- Expected result: user B receives `Event capacity reached.`

6. Optional browser QR return check.

- After successful registration, verify `/my/registrations` shows the registration and QR token.
- Expected result: QR token is present and non-empty.

7. Optional manual concurrency check.

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
