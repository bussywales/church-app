import "server-only";
import { createClient } from "@/lib/supabase/server";

type RuntimeState = {
  active_distribution_version: string | null;
  previous_distribution_version: string | null;
  updated_at: string;
  updated_by: string | null;
};

type DistributionVersion = {
  distribution_version: string;
  generated_at: string;
  state: string;
  expected_books: number;
  expected_chapters: number;
  expected_verses: number;
  imported_books: number;
  imported_chapters: number;
  imported_verses: number;
  imported_search_index: number;
  manifest_sha256: string;
  books_sha256: string;
  chapters_sha256: string;
  verses_sha256: string;
  search_index_sha256: string;
  cwb_status_sha256: string;
  verse_id_set_sha256: string | null;
  validation_report: unknown;
  import_method: string;
  imported_at: string | null;
  activated_at: string | null;
  failure_reason: string | null;
};

type ImportLog = {
  id: number;
  distribution_version: string | null;
  event_type: string;
  level: string;
  message: string;
  details: unknown;
  created_at: string;
};

export type CwbDiagnostics = {
  runtimeState: RuntimeState | null;
  activeVersion: DistributionVersion | null;
  lastValidation: DistributionVersion | null;
  lastFailedImport: DistributionVersion | null;
  activationHistory: ImportLog[];
  error: string | null;
};

export async function getCwbDiagnostics(): Promise<CwbDiagnostics> {
  const supabase = await createClient();

  const runtimeResult = await supabase
    .from("cwb_runtime_state")
    .select("active_distribution_version, previous_distribution_version, updated_at, updated_by")
    .eq("id", true)
    .maybeSingle();

  if (runtimeResult.error) {
    return {
      runtimeState: null,
      activeVersion: null,
      lastValidation: null,
      lastFailedImport: null,
      activationHistory: [],
      error: runtimeResult.error.message,
    };
  }

  const runtimeState = runtimeResult.data;
  const [activeResult, lastValidationResult, lastFailedResult, historyResult] = await Promise.all([
    runtimeState?.active_distribution_version
      ? supabase
          .from("cwb_distribution_versions")
          .select(
            "distribution_version, generated_at, state, expected_books, expected_chapters, expected_verses, imported_books, imported_chapters, imported_verses, imported_search_index, manifest_sha256, books_sha256, chapters_sha256, verses_sha256, search_index_sha256, cwb_status_sha256, verse_id_set_sha256, validation_report, import_method, imported_at, activated_at, failure_reason",
          )
          .eq("distribution_version", runtimeState.active_distribution_version)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("cwb_distribution_versions")
      .select(
        "distribution_version, generated_at, state, expected_books, expected_chapters, expected_verses, imported_books, imported_chapters, imported_verses, imported_search_index, manifest_sha256, books_sha256, chapters_sha256, verses_sha256, search_index_sha256, cwb_status_sha256, verse_id_set_sha256, validation_report, import_method, imported_at, activated_at, failure_reason",
      )
      .in("state", ["validated", "active", "retired"])
      .order("imported_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("cwb_distribution_versions")
      .select(
        "distribution_version, generated_at, state, expected_books, expected_chapters, expected_verses, imported_books, imported_chapters, imported_verses, imported_search_index, manifest_sha256, books_sha256, chapters_sha256, verses_sha256, search_index_sha256, cwb_status_sha256, verse_id_set_sha256, validation_report, import_method, imported_at, activated_at, failure_reason",
      )
      .eq("state", "failed")
      .order("imported_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("cwb_import_logs")
      .select("id, distribution_version, event_type, level, message, details, created_at")
      .in("event_type", ["validated", "activated", "rolled_back"])
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const error =
    activeResult.error?.message ||
    lastValidationResult.error?.message ||
    lastFailedResult.error?.message ||
    historyResult.error?.message ||
    null;

  return {
    runtimeState,
    activeVersion: activeResult.data,
    lastValidation: lastValidationResult.data,
    lastFailedImport: lastFailedResult.data,
    activationHistory: historyResult.data ?? [],
    error,
  };
}
