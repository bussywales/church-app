import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { CWB_DIAGNOSTIC_ROLES } from "@/lib/roles";
import { CWB_DISPLAY_STATUS, CWB_EXPECTED_COUNTS, CWB_FULL_WARNING, CWB_LABEL } from "@/lib/cwb/constants";
import { getCwbFeatureGateDiagnostics } from "@/lib/cwb/feature-gate";
import { getCwbDiagnostics } from "@/lib/cwb/diagnostics";

export const dynamic = "force-dynamic";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatJson(value: unknown) {
  if (!value || (typeof value === "object" && Object.keys(value).length === 0)) {
    return "No validation report recorded";
  }

  return JSON.stringify(value, null, 2);
}

export default async function AdminCwbPage() {
  await requireRole(CWB_DIAGNOSTIC_ROLES);

  const featureGate = getCwbFeatureGateDiagnostics();
  const diagnostics = await getCwbDiagnostics();
  const activeVersion = diagnostics.activeVersion;

  return (
    <section className="space-y-5">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{CWB_LABEL}</h2>
            <p className="mt-1 text-sm font-medium text-amber-800">{CWB_DISPLAY_STATUS}</p>
            <p className="mt-2 text-sm text-slate-700">{CWB_FULL_WARNING}</p>
          </div>
          <div className="rounded-md border border-slate-200 px-3 py-2 text-sm">
            <p className="font-medium text-slate-900">Server feature gate</p>
            <p className={featureGate.enabled ? "text-emerald-700" : "text-rose-700"}>
              {featureGate.name}: {featureGate.enabled ? "enabled" : "disabled"}
            </p>
            <p className="text-xs text-slate-500">Client exposure: {featureGate.exposedToClient ? "yes" : "no"}</p>
          </div>
        </div>

        {diagnostics.error ? <p className="mt-4 text-sm text-rose-700">{diagnostics.error}</p> : null}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Runtime state</h3>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-900">Active distribution version</dt>
            <dd className="mt-1 font-mono text-slate-600">
              {diagnostics.runtimeState?.active_distribution_version ?? "None"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Previous distribution version</dt>
            <dd className="mt-1 font-mono text-slate-600">
              {diagnostics.runtimeState?.previous_distribution_version ?? "None"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Generated date</dt>
            <dd className="mt-1 text-slate-600">{formatDate(activeVersion?.generated_at)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Updated</dt>
            <dd className="mt-1 text-slate-600">{formatDate(diagnostics.runtimeState?.updated_at)}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Counts and checksums</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Metric</th>
                <th className="py-2 pr-4 font-medium">Imported</th>
                <th className="py-2 pr-4 font-medium">Expected</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr>
                <td className="py-2 pr-4">Books</td>
                <td className="py-2 pr-4">{activeVersion?.imported_books ?? 0}</td>
                <td className="py-2 pr-4">{activeVersion?.expected_books ?? CWB_EXPECTED_COUNTS.books}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Chapters/Psalms</td>
                <td className="py-2 pr-4">{activeVersion?.imported_chapters ?? 0}</td>
                <td className="py-2 pr-4">{activeVersion?.expected_chapters ?? CWB_EXPECTED_COUNTS.chapters}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Verses</td>
                <td className="py-2 pr-4">{activeVersion?.imported_verses ?? 0}</td>
                <td className="py-2 pr-4">{activeVersion?.expected_verses ?? CWB_EXPECTED_COUNTS.verses}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Search index</td>
                <td className="py-2 pr-4">{activeVersion?.imported_search_index ?? 0}</td>
                <td className="py-2 pr-4">{activeVersion?.expected_verses ?? CWB_EXPECTED_COUNTS.verses}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          {[
            ["Manifest SHA-256", activeVersion?.manifest_sha256],
            ["Books SHA-256", activeVersion?.books_sha256],
            ["Chapters SHA-256", activeVersion?.chapters_sha256],
            ["Verses SHA-256", activeVersion?.verses_sha256],
            ["Search index SHA-256", activeVersion?.search_index_sha256],
            ["CWB status SHA-256", activeVersion?.cwb_status_sha256],
            ["Verse ID set SHA-256", activeVersion?.verse_id_set_sha256],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="font-medium text-slate-900">{label}</dt>
              <dd className="mt-1 break-all font-mono text-xs text-slate-600">{value ?? "Not recorded"}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Validation and import state</h3>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-900">Checksum/validation state</dt>
            <dd className="mt-1 text-slate-600">{activeVersion?.state ?? "No active package"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Import method</dt>
            <dd className="mt-1 text-slate-600">{activeVersion?.import_method ?? "Not imported"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Imported</dt>
            <dd className="mt-1 text-slate-600">{formatDate(activeVersion?.imported_at)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Activated</dt>
            <dd className="mt-1 text-slate-600">{formatDate(activeVersion?.activated_at)}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Last validation result</dt>
            <dd className="mt-1 font-mono text-xs text-slate-600">
              {diagnostics.lastValidation?.distribution_version ?? "None"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-900">Last failed import</dt>
            <dd className="mt-1 text-slate-600">
              {diagnostics.lastFailedImport
                ? `${diagnostics.lastFailedImport.distribution_version}: ${
                    diagnostics.lastFailedImport.failure_reason ?? "failed"
                  }`
                : "None"}
            </dd>
          </div>
        </dl>

        <pre className="mt-4 max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
          {formatJson(activeVersion?.validation_report ?? diagnostics.lastValidation?.validation_report)}
        </pre>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Activation and rollback history</h3>
        {diagnostics.activationHistory.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Event</th>
                  <th className="py-2 pr-4 font-medium">Distribution</th>
                  <th className="py-2 pr-4 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {diagnostics.activationHistory.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-4 whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="py-2 pr-4">{log.event_type}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{log.distribution_version ?? "n/a"}</td>
                    <td className="py-2 pr-4">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No activation or rollback events recorded.</p>
        )}
      </Card>
    </section>
  );
}
