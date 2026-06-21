# Church App

Next.js + Supabase + Stripe church management app with public content, registrations, giving, and admin tools.

## Local development

## Node version

Use Node `20.x` for local development, CI, and Vercel. With `nvm`:

```bash
nvm use
```

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Start dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Required in `.env.local`:

- `APP_ENV`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

See [`.env.example`](./.env.example) for a template.

## Supabase setup

1. Open your Supabase project dashboard.
2. Go to SQL Editor.
3. Open [`supabase/schema.sql`](./supabase/schema.sql).
4. Run the script to create schema and RLS policies.

## Demo seed data

After applying the schema and setting `.env.local`, seed demo-ready public content:

```bash
npm run seed
```

The seed script uses `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` or exported
environment variables. It upserts fixed demo IDs for funds, sermons, and events so it can be rerun without creating
duplicates. Do not commit `.env.local` or service-role keys.

## Bootstrapping SUPER_ADMIN

The safest first-admin flow is manual and explicit:

1. Create the first user through the app registration flow.
2. Sign in once so the app creates a matching `profiles` row.
3. In Supabase SQL Editor, promote only that known user by exact email or `user_id`.
4. Do not put service-role keys or admin credentials in committed files.

Promote by exact email:

```sql
update public.profiles
set role = 'SUPER_ADMIN',
    status = 'MEMBER'
where user_id = (
  select id
  from auth.users
  where email = 'admin@example.com'
);
```

If the profile row does not exist yet, create or update it from the auth user:

```sql
insert into public.profiles (user_id, email, role, status)
select id, email, 'SUPER_ADMIN', 'MEMBER'
from auth.users
where email = 'admin@example.com'
on conflict (user_id)
do update set
  email = excluded.email,
  role = 'SUPER_ADMIN',
  status = 'MEMBER';
```

Promote by known `user_id`:

```sql
update public.profiles
set role = 'SUPER_ADMIN',
    status = 'MEMBER'
where user_id = '00000000-0000-0000-0000-000000000000';
```

## Database migrations (Supabase)

- Migrations live in `supabase/migrations/` and are the source of truth.
- `supabase/schema.sql` is kept as a reference snapshot.
- Create two Supabase projects:
  - Staging project for `develop` branch migration deploys.
  - Production project for `main` branch migration deploys.

Link locally:

```bash
npx supabase login
npx supabase link --project-ref <STAGING_OR_PRODUCTION_PROJECT_REF>
```

Push locally:

```bash
npx supabase db push
```

- Staging CI deploys migrations on pushes to `develop` when `supabase/migrations/**` or `supabase/config.toml` changes.
- Production CI deploys migrations on pushes to `main` when `supabase/migrations/**` or `supabase/config.toml` changes.
- Maintainers can manually deploy a feature branch migration to staging without touching production:

```bash
gh workflow run supabase-migrate-staging.yml \
  --ref main \
  -f migration_ref=fix/atomic-event-registration
```

Manual staging dispatch uses the `staging` GitHub Environment secrets and refuses to run unless the target Supabase
project ref is the staging project. It never deploys to production. Once a migration has been manually deployed to
staging, do not edit that migration file; create a new migration for corrections.

- Create GitHub Environments named exactly:
  - `staging`
  - `production`
- Add these Environment secrets to both `staging` and `production` (do not use repo-wide secrets for migration deploys):
  - `SUPABASE_PROJECT_REF`
  - `SUPABASE_ACCESS_TOKEN`
  - `SUPABASE_DB_PASSWORD`
- Recommended branch protection:
  - Protect `main`.
  - Require pull requests before merging.
  - Require the `CI` lint/build check before merging.
  - Optionally require the production environment approval before deployment.

Notes:

- `registrations` has unique `(event_id, user_id)` to prevent duplicates.
- `registrations.checked_in_at` stores check-in timestamp.
- `settings` stores feature flags (for example `gift_aid_enabled`).
- `people_notes` is restricted by RLS to `SUPER_ADMIN`, `ADMIN`, `PASTORAL`.
- `leads` stores `/new-here` submissions.

## Stripe webhook testing

1. Start the app:

```bash
npm run dev
```

2. Start Stripe event forwarding:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

3. Copy the reported `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.
4. Trigger a test Checkout flow from `/give`.

## Deploy to Vercel

Runtime environment separation is required: preview deployments should use staging Supabase, Stripe test keys, and
staging/shared Resend; production deployments should use production Supabase, Stripe live keys, and production Resend.

See [`docs/VERCEL_DEPLOYMENT.md`](./docs/VERCEL_DEPLOYMENT.md) for the full setup checklist and commands.

## Validation

```bash
npm run lint
npm run build
```
