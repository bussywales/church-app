import assert from "node:assert/strict";
import test from "node:test";
import { assertPublicClean } from "../../scripts/cwb/assert-public-clean";

test("CWB payload is excluded from tracked files, public assets, static imports, and build output", async () => {
  const result = await assertPublicClean(process.cwd());

  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.deepEqual(result.checked, [
    "git-tracked-files",
    "public-directory",
    "static-imports",
    "import-scripts",
    ".next-build-output",
  ]);
});
