import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const REPO_ROOT = process.cwd();
const MIGRATION = path.join(REPO_ROOT, "supabase/migrations/20260621120000_cwb_internal_preview_phase_1.sql");
const FEATURE_GATE = path.join(REPO_ROOT, "src/lib/cwb/feature-gate.ts");

async function readMigration() {
  return readFile(MIGRATION, "utf8");
}

test("server feature gate defaults to false and is not NEXT_PUBLIC", async () => {
  const source = await readFile(FEATURE_GATE, "utf8");

  assert.match(source, /CWB_INTERNAL_PREVIEW_ENABLED/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_CWB/);
  assert.match(source, /value === "true"/);
  assert.match(source, /exposedToClient: false/);
});

test("entitlement access remains independent of application roles", async () => {
  const migration = await readMigration();

  assert.match(migration, /create table if not exists public\.cwb_preview_entitlements/);
  assert.match(migration, /create or replace function public\.has_cwb_preview_access/);
  assert.match(migration, /from public\.cwb_preview_entitlements entitlement/);
  assert.doesNotMatch(migration, /CWB_TESTER/);
});

test("unauthorised users cannot read CWB content rows", async () => {
  const migration = await readMigration();

  assert.match(migration, /alter table public\.cwb_verses enable row level security/);
  assert.match(migration, /create policy "cwb_verses_select_active_entitled"/);
  assert.match(migration, /to authenticated/);
  assert.match(migration, /public\.has_cwb_preview_access\(\)/);
  assert.doesNotMatch(migration, /to anon[\s\S]*cwb_verses/);
});

test("admin diagnostics are separate from Scripture content access", async () => {
  const migration = await readMigration();

  assert.match(migration, /create or replace function public\.is_cwb_diagnostics_admin/);
  assert.match(migration, /current_user_role\(\) in \('ADMIN', 'SUPER_ADMIN'\)/);
  assert.match(migration, /cwb_import_logs_select_diagnostics_admin/);
  assert.match(migration, /cwb_runtime_state_select_diagnostics_admin/);
});

test("normal authenticated users cannot execute activation controls", async () => {
  const migration = await readMigration();

  assert.match(migration, /revoke all on function public\.cwb_activate_distribution\(text, uuid\) from public, anon, authenticated/);
  assert.match(migration, /revoke all on function public\.cwb_rollback_distribution\(uuid\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.cwb_activate_distribution\(text, uuid\) to service_role/);
});

test("failed import function leaves active pointer unchanged", async () => {
  const migration = await readMigration();
  const failedFunction = migration.match(
    /create or replace function public\.cwb_mark_import_failed[\s\S]*?\$\$;/,
  )?.[0];

  assert.ok(failedFunction);
  assert.doesNotMatch(failedFunction, /update public\.cwb_runtime_state/);
  assert.match(failedFunction, /active distribution pointer unchanged/);
});

test("activation accepts validated versions only", async () => {
  const migration = await readMigration();

  assert.match(migration, /target_state <> 'validated'/);
  assert.match(migration, /must be validated before activation/);
  assert.match(migration, /set active_distribution_version = p_distribution_version/);
});

test("rollback restores previous validated pointer", async () => {
  const migration = await readMigration();

  assert.match(migration, /previous_distribution_version/);
  assert.match(migration, /previous_state not in \('validated', 'retired'\)/);
  assert.match(migration, /set active_distribution_version = previous_version/);
});
