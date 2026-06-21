# CWB Internal Preview Runbook

This runbook is for Phase 1 only.

Required label: `CWB Internal Preview`

Required status: `First Draft - Review Required`

Required warning: `Internal preview only. Not reviewed, approved, final, published, or released.`

## Validate Only

Validate the generated distribution in place. Do not copy the package into this repository.

```bash
npm run cwb:validate -- --source "/Users/olubusayoadewale/Coding Projects/Covenant Ways Bible/covenant-ways-bible/dist/cwb-alpha"
```

The command reports counts, hashes, distribution version, the compatibility profile, the verse ID set hash, and validation errors. It must not print Scripture text.

## Staging Import

Use service-role credentials for a non-production Supabase project only.

```bash
npm run cwb:import -- --source "/Users/olubusayoadewale/Coding Projects/Covenant Ways Bible/covenant-ways-bible/dist/cwb-alpha"
```

The importer validates first, imports under an inactive `distribution_version`, recomputes source hashes after import, verifies database counts, and then marks the version `validated`. It does not activate unless activation is explicit.

## Explicit Activation

Activate during the same import:

```bash
npm run cwb:import -- --source "/Users/olubusayoadewale/Coding Projects/Covenant Ways Bible/covenant-ways-bible/dist/cwb-alpha" --activate
```

Activate an already validated version:

```bash
npm run cwb:import -- --version v7.7.0-alpha --activate
```

Activation is service-role-only and accepts only a `validated` distribution.

## Failed Import Behaviour

Failed validation or import marks the attempted version `failed`, writes a sanitised import log, and leaves `cwb_runtime_state.active_distribution_version` unchanged.

Import logs must not include Scripture text.

## Rollback

Rollback is service-role-only and restores `cwb_runtime_state.previous_distribution_version` when that previous version is a validated rollback target.

```bash
npm run cwb:import -- --rollback
```

## Entitlement Grant/Revoke

Entitlement is independent of app roles. Do not add a CWB application role.

Grant access to a known profile user:

```sql
insert into public.cwb_preview_entitlements (user_id, enabled, granted_by, reason)
values (
  '00000000-0000-0000-0000-000000000000',
  true,
  '00000000-0000-0000-0000-000000000000',
  'Phase 1 internal preview testing'
)
on conflict (user_id)
do update set
  enabled = true,
  granted_by = excluded.granted_by,
  granted_at = now(),
  expires_at = null,
  reason = excluded.reason;
```

Revoke access:

```sql
update public.cwb_preview_entitlements
set enabled = false
where user_id = '00000000-0000-0000-0000-000000000000';
```

## Production Prohibition

Do not import, activate, deploy, or operate CWB data in production during Phase 1.

Do not place CWB JSON, shards, SQLite packages, or generated distribution directories in `public/`, `src/`, or any client bundle.

## Public-Build Exclusion Verification

Run after a build exists:

```bash
npm run cwb:assert-public-clean
```

The assertion checks tracked files, `public/`, static imports, CWB import scripts, and `.next` build output for CWB payload files.
