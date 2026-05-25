# Vercel Deployment

Use separate Vercel runtime environments so preview deployments point at staging services and production deployments point
at production services.

## Install and Login

Check the Vercel CLI using `npx`:

```bash
npx vercel --version
```

Login:

```bash
npx vercel login
```

Link this local repository to the Vercel project:

```bash
npx vercel link
```

If prompted, choose the account/team and project that should deploy `church-app`.

## Project Settings

In the Vercel dashboard, set the Production Branch to `main`.

Preview deployments should be created from non-production branches such as `develop`. Production deployments should come
from `main`.

## Preview Environment Variables

Preview must point to staging services:

```text
APP_ENV=staging
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=<staging>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging>
SUPABASE_SERVICE_ROLE_KEY=<staging>
STRIPE_SECRET_KEY=<test>
STRIPE_WEBHOOK_SECRET=<test>
RESEND_API_KEY=<staging or shared>
RESEND_FROM_EMAIL=<from>
```

Add each preview variable with:

```bash
npx vercel env add <NAME> preview
```

Required preview names:

```bash
npx vercel env add APP_ENV preview
npx vercel env add NEXT_PUBLIC_APP_ENV preview
npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview
npx vercel env add STRIPE_SECRET_KEY preview
npx vercel env add STRIPE_WEBHOOK_SECRET preview
npx vercel env add RESEND_API_KEY preview
npx vercel env add RESEND_FROM_EMAIL preview
```

## Production Environment Variables

Production must point to production services:

```text
APP_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=<production>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production>
SUPABASE_SERVICE_ROLE_KEY=<production>
STRIPE_SECRET_KEY=<live>
STRIPE_WEBHOOK_SECRET=<live>
RESEND_API_KEY=<production>
RESEND_FROM_EMAIL=<from>
```

Add each production variable with:

```bash
npx vercel env add <NAME> production
```

Required production names:

```bash
npx vercel env add APP_ENV production
npx vercel env add NEXT_PUBLIC_APP_ENV production
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add STRIPE_SECRET_KEY production
npx vercel env add STRIPE_WEBHOOK_SECRET production
npx vercel env add RESEND_API_KEY production
npx vercel env add RESEND_FROM_EMAIL production
```

## Redeploy After Env Changes

After changing Vercel environment variables, trigger a fresh deployment.

Preview deployment:

```bash
npx vercel
```

Production deployment:

```bash
npx vercel --prod
```

## Runtime Verification

After deployment, sign in as an admin and open `/admin/health`.

Confirm:

- Preview shows `APP_ENV=staging` and `NEXT_PUBLIC_APP_ENV=staging`.
- Production shows `APP_ENV=production` and `NEXT_PUBLIC_APP_ENV=production`.
- Database connectivity is `Connected`.
