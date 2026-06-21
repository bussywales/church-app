import { validateCwbPackage } from "./validation";

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const source = readArg("--source");
  const profile = readArg("--profile");

  if (!source) {
    throw new Error('Missing required --source "/path/to/cwb/dist/cwb-alpha" argument.');
  }

  const result = await validateCwbPackage(source, { profile });
  const summary = {
    ok: result.ok,
    source_schema_profile: result.source_schema_profile,
    consumer_schema_version: result.consumer_schema_version,
    distribution_version: result.distribution_version,
    package_name: result.package_name,
    package_name_contract_drift: result.validationReport.package_name_contract_drift,
    counts: result.counts,
    expected_counts: result.expectedCounts,
    hashes: result.hashes,
    verse_id_set_sha256: result.verseIdSetSha256,
    errors: result.errors,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
