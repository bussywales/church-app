# Church App

Next.js + Supabase + Stripe church management app with public content, registrations, giving, and admin tools.

## Local development

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

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

See [`.env.example`](./.env.example) for a template.

## Supabase setup

1. Open your Supabase project dashboard.
2. Go to SQL Editor.
3. Open [`supabase/schema.sql`](./supabase/schema.sql).
4. Run the script to create schema and RLS policies.

## Database migrations (Supabase)

- Migrations live in `supabase/migrations/` and are the source of truth.
- `supabase/schema.sql` is kept as a reference snapshot.

Link locally:

```bash
npx supabase login
npx supabase link --project-ref uaqbybbnqjzqxggcknhz
```

Push locally:

```bash
npx supabase db push
```

- CI deploys migrations on pushes to `main` when `supabase/migrations/**` or `supabase/config.toml` changes.
- Required GitHub Secrets:
  - `SUPABASE_PROJECT_REF`
  - `SUPABASE_ACCESS_TOKEN`
  - `SUPABASE_DB_PASSWORD`

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

## Validation

```bash
npm run lint
npm run build
```
