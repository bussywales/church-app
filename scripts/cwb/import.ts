import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../src/lib/supabase/database.types";
import {
  CWB_CODE,
  CWB_DISPLAY_STATUS,
  CWB_EXPECTED_COUNTS,
  CWB_FULL_WARNING,
  CwbSearchRecord,
  CwbVerse,
  hashSourceFiles,
  sourceFilePaths,
  streamJsonArrayFile,
  validateCwbPackage,
} from "./validation";

const CHUNK_SIZE = 500;

type CwbBookInsert = Database["public"]["Tables"]["cwb_books"]["Insert"];
type CwbChapterInsert = Database["public"]["Tables"]["cwb_chapters"]["Insert"];
type CwbVerseInsert = Database["public"]["Tables"]["cwb_verses"]["Insert"];
type CwbSearchInsert = Database["public"]["Tables"]["cwb_search_index"]["Insert"];
type CwbDistributionInsert = Database["public"]["Tables"]["cwb_distribution_versions"]["Insert"];

function readArg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createServiceClient() {
  return createClient<Database>(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

async function insertImportLog(
  supabase: SupabaseClient<Database>,
  distributionVersion: string | null,
  eventType: string,
  level: "info" | "warning" | "error",
  message: string,
  details: Json = {},
) {
  const { error } = await supabase.from("cwb_import_logs").insert({
    distribution_version: distributionVersion,
    event_type: eventType,
    level,
    message,
    details,
  });

  if (error) {
    throw new Error(`Unable to write CWB import log: ${error.message}`);
  }
}

async function recordFailedAttempt(
  supabase: SupabaseClient<Database>,
  result: Awaited<ReturnType<typeof validateCwbPackage>>,
  failureReason: string,
) {
  if (!result.distribution_version || !result.hashes) {
    return;
  }

  const row: CwbDistributionInsert = {
    distribution_version: result.distribution_version,
    source_schema_profile: result.source_schema_profile,
    consumer_schema_version: result.consumer_schema_version,
    package_name: result.package_name ?? "unknown",
    generated_at:
      typeof result.manifest?.generated_at === "string" ? result.manifest.generated_at : new Date().toISOString(),
    distribution_type: "internal_preview",
    translation: CWB_CODE,
    source_status: "first_draft",
    display_status: CWB_DISPLAY_STATUS,
    warning: CWB_FULL_WARNING,
    state: "failed",
    expected_books: CWB_EXPECTED_COUNTS.books,
    expected_chapters: CWB_EXPECTED_COUNTS.chapters,
    expected_verses: CWB_EXPECTED_COUNTS.verses,
    imported_books: 0,
    imported_chapters: 0,
    imported_verses: 0,
    imported_search_index: 0,
    manifest_sha256: result.hashes.manifest,
    books_sha256: result.hashes.books,
    chapters_sha256: result.hashes.chapters,
    verses_sha256: result.hashes.verses,
    search_index_sha256: result.hashes.searchIndex,
    cwb_status_sha256: result.hashes.cwbStatus,
    verse_id_set_sha256: result.verseIdSetSha256,
    validation_report: result.validationReport as unknown as Json,
    import_method: "cli_service_role",
    imported_at: new Date().toISOString(),
    failure_reason: failureReason,
  };

  const insertResult = await supabase.from("cwb_distribution_versions").insert(row);
  if (insertResult.error) {
    const { error } = await supabase.rpc("cwb_mark_import_failed", {
      p_distribution_version: result.distribution_version,
      p_failure_reason: failureReason,
      p_validation_report: result.validationReport as unknown as Json,
    });

    if (error) {
      await insertImportLog(
        supabase,
        result.distribution_version,
        "failed",
        "error",
        "CWB import failed before activation; active distribution pointer unchanged.",
        { failure_reason: failureReason },
      );
    }
  } else {
    await insertImportLog(
      supabase,
      result.distribution_version,
      "failed",
      "error",
      "CWB validation failed before import; active distribution pointer unchanged.",
      { failure_reason: failureReason },
    );
  }
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Validated CWB record unexpectedly has non-string ${field}.`);
  }

  return value;
}

function assertNumber(value: unknown, field: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(`Validated CWB record unexpectedly has non-integer ${field}.`);
  }

  return value as number;
}

async function insertBooks(supabase: SupabaseClient<Database>, distributionVersion: string, rows: CwbBookInsert[]) {
  const { error } = await supabase.from("cwb_books").insert(
    rows.map((row) => ({
      ...row,
      distribution_version: distributionVersion,
    })),
  );

  if (error) {
    throw new Error(`Unable to insert CWB books: ${error.message}`);
  }
}

async function insertChapters(
  supabase: SupabaseClient<Database>,
  distributionVersion: string,
  rows: CwbChapterInsert[],
) {
  const { error } = await supabase.from("cwb_chapters").insert(
    rows.map((row) => ({
      ...row,
      distribution_version: distributionVersion,
    })),
  );

  if (error) {
    throw new Error(`Unable to insert CWB chapters: ${error.message}`);
  }
}

async function flushVerses(supabase: SupabaseClient<Database>, rows: CwbVerseInsert[]) {
  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from("cwb_verses").insert(rows);
  if (error) {
    throw new Error(`Unable to insert CWB verse chunk: ${error.message}`);
  }
  rows.length = 0;
}

async function flushSearchIndex(supabase: SupabaseClient<Database>, rows: CwbSearchInsert[]) {
  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from("cwb_search_index").insert(rows);
  if (error) {
    throw new Error(`Unable to insert CWB search-index chunk: ${error.message}`);
  }
  rows.length = 0;
}

async function countDistributionRows(
  supabase: SupabaseClient<Database>,
  table: "cwb_books" | "cwb_chapters" | "cwb_verses" | "cwb_search_index",
  distributionVersion: string,
) {
  const { count, error } = await supabase
    .from(table)
    .select("distribution_version", { count: "exact", head: true })
    .eq("distribution_version", distributionVersion);

  if (error) {
    throw new Error(`Unable to count ${table}: ${error.message}`);
  }

  return count ?? 0;
}

async function markFailed(
  supabase: SupabaseClient<Database>,
  distributionVersion: string,
  reason: string,
  validationReport: Json,
) {
  const { error } = await supabase.rpc("cwb_mark_import_failed", {
    p_distribution_version: distributionVersion,
    p_failure_reason: reason,
    p_validation_report: validationReport,
  });

  if (error) {
    throw new Error(`Unable to mark CWB import failed: ${error.message}`);
  }
}

async function importValidatedPackage(
  supabase: SupabaseClient<Database>,
  source: string,
  activate: boolean,
  profile: string | undefined,
) {
  const validation = await validateCwbPackage(source, { profile });
  if (!validation.ok) {
    await recordFailedAttempt(supabase, validation, validation.errors.join("; "));
    throw new Error("CWB validation failed; active distribution pointer unchanged.");
  }

  if (!validation.distribution_version || !validation.hashes) {
    throw new Error("CWB validation did not produce distribution metadata.");
  }

  const distributionVersion = validation.distribution_version;
  const distributionRow: CwbDistributionInsert = {
    distribution_version: distributionVersion,
    source_schema_profile: validation.source_schema_profile,
    consumer_schema_version: validation.consumer_schema_version,
    package_name: validation.package_name ?? "unknown",
    generated_at: assertString(validation.manifest?.generated_at, "manifest.generated_at"),
    distribution_type: "internal_preview",
    translation: CWB_CODE,
    source_status: "first_draft",
    display_status: CWB_DISPLAY_STATUS,
    warning: CWB_FULL_WARNING,
    state: "importing",
    expected_books: CWB_EXPECTED_COUNTS.books,
    expected_chapters: CWB_EXPECTED_COUNTS.chapters,
    expected_verses: CWB_EXPECTED_COUNTS.verses,
    imported_books: 0,
    imported_chapters: 0,
    imported_verses: 0,
    imported_search_index: 0,
    manifest_sha256: validation.hashes.manifest,
    books_sha256: validation.hashes.books,
    chapters_sha256: validation.hashes.chapters,
    verses_sha256: validation.hashes.verses,
    search_index_sha256: validation.hashes.searchIndex,
    cwb_status_sha256: validation.hashes.cwbStatus,
    verse_id_set_sha256: validation.verseIdSetSha256,
    validation_report: validation.validationReport as unknown as Json,
    import_method: "cli_service_role",
  };

  const inserted = await supabase.from("cwb_distribution_versions").insert(distributionRow);
  if (inserted.error) {
    throw new Error(`Unable to create CWB importing distribution: ${inserted.error.message}`);
  }

  try {
    await insertImportLog(supabase, distributionVersion, "import_started", "info", "CWB import started.", {
      source_schema_profile: validation.source_schema_profile,
    });

    await insertBooks(
      supabase,
      distributionVersion,
      validation.books.map((book) => ({
        distribution_version: distributionVersion,
        order: book.order,
        testament: book.testament,
        book: book.book,
        book_slug: book.book_slug,
        chapters: book.chapters,
        verses: book.verses,
      })),
    );

    await insertChapters(
      supabase,
      distributionVersion,
      validation.chapters.map((chapter) => ({
        distribution_version: distributionVersion,
        book_slug: chapter.book_slug,
        chapter: chapter.chapter,
        reference: chapter.reference,
        verse_count: chapter.verse_count,
      })),
    );

    const files = sourceFilePaths(validation.sourceDir);
    const verseChunk: CwbVerseInsert[] = [];
    await streamJsonArrayFile<CwbVerse>(files.verses, async (verse) => {
      verseChunk.push({
        distribution_version: distributionVersion,
        verse_id: assertString(verse.id, "verse.id"),
        translation: assertString(verse.translation, "verse.translation"),
        testament: assertString(verse.testament, "verse.testament"),
        book: assertString(verse.book, "verse.book"),
        book_slug: assertString(verse.book_slug, "verse.book_slug"),
        chapter: assertNumber(verse.chapter, "verse.chapter"),
        verse: assertNumber(verse.verse, "verse.verse"),
        reference: assertString(verse.reference, "verse.reference"),
        text: assertString(verse.text, "verse.text"),
        source_status: assertString(verse.status, "verse.status"),
        source_file: assertString(verse.source_file, "verse.source_file"),
        source_version: assertString(verse.version, "verse.version"),
      });

      if (verseChunk.length >= CHUNK_SIZE) {
        await flushVerses(supabase, verseChunk);
      }
    });
    await flushVerses(supabase, verseChunk);

    const searchChunk: CwbSearchInsert[] = [];
    await streamJsonArrayFile<CwbSearchRecord>(files.searchIndex, async (record) => {
      searchChunk.push({
        distribution_version: distributionVersion,
        verse_id: assertString(record.id, "search.id"),
        reference: assertString(record.reference, "search.reference"),
        book_slug: assertString(record.book_slug, "search.book_slug"),
        chapter: assertNumber(record.chapter, "search.chapter"),
        verse: assertNumber(record.verse, "search.verse"),
        plain_text: assertString(record.plain_text, "search.plain_text"),
        searchable_text: assertString(record.searchable_text, "search.searchable_text"),
      });

      if (searchChunk.length >= CHUNK_SIZE) {
        await flushSearchIndex(supabase, searchChunk);
      }
    });
    await flushSearchIndex(supabase, searchChunk);

    const afterImportHashes = await hashSourceFiles(validation.sourceDir);
    if (JSON.stringify(validation.hashes) !== JSON.stringify(afterImportHashes)) {
      await markFailed(
        supabase,
        distributionVersion,
        "CWB source file hashes changed during import.",
        validation.validationReport as unknown as Json,
      );
      throw new Error("CWB source file hashes changed during import; active distribution pointer unchanged.");
    }

    const [booksCount, chaptersCount, versesCount, searchCount] = await Promise.all([
      countDistributionRows(supabase, "cwb_books", distributionVersion),
      countDistributionRows(supabase, "cwb_chapters", distributionVersion),
      countDistributionRows(supabase, "cwb_verses", distributionVersion),
      countDistributionRows(supabase, "cwb_search_index", distributionVersion),
    ]);

    const dbCountsMatch =
      booksCount === validation.counts.books &&
      chaptersCount === validation.counts.chapters &&
      versesCount === validation.counts.verses &&
      searchCount === validation.counts.search_index;

    const updatedReport = {
      ...validation.validationReport,
      database_counts: {
        books: booksCount,
        chapters: chaptersCount,
        verses: versesCount,
        search_index: searchCount,
      },
    };

    await supabase
      .from("cwb_distribution_versions")
      .update({
        imported_books: booksCount,
        imported_chapters: chaptersCount,
        imported_verses: versesCount,
        imported_search_index: searchCount,
        validation_report: updatedReport as unknown as Json,
      })
      .eq("distribution_version", distributionVersion);

    if (!dbCountsMatch) {
      await markFailed(
        supabase,
        distributionVersion,
        "Database counts after import did not match validated source counts.",
        updatedReport as unknown as Json,
      );
      throw new Error("CWB database counts did not match validated source counts; active pointer unchanged.");
    }

    const validated = await supabase.rpc("cwb_validate_distribution", {
      p_distribution_version: distributionVersion,
      p_validation_report: updatedReport as unknown as Json,
    });
    if (validated.error) {
      throw new Error(`Unable to validate CWB distribution in database: ${validated.error.message}`);
    }

    if (activate) {
      const activated = await supabase.rpc("cwb_activate_distribution", {
        p_distribution_version: distributionVersion,
      });
      if (activated.error) {
        throw new Error(`Unable to activate CWB distribution: ${activated.error.message}`);
      }
    }

    return {
      distribution_version: distributionVersion,
      activated: activate,
      counts: {
        books: booksCount,
        chapters: chaptersCount,
        verses: versesCount,
        search_index: searchCount,
      },
      hashes: validation.hashes,
      verse_id_set_sha256: validation.verseIdSetSha256,
    };
  } catch (error) {
    await markFailed(
      supabase,
      distributionVersion,
      error instanceof Error ? error.message : String(error),
      validation.validationReport as unknown as Json,
    );
    throw error;
  }
}

async function main() {
  const source = readArg("--source");
  const profile = readArg("--profile");
  const version = readArg("--version");
  const activate = hasFlag("--activate");
  const rollback = hasFlag("--rollback");
  const supabase = createServiceClient();

  if (rollback) {
    const { error } = await supabase.rpc("cwb_rollback_distribution", {});
    if (error) {
      throw new Error(`Unable to roll back CWB distribution: ${error.message}`);
    }
    console.log(JSON.stringify({ ok: true, rolled_back: true }, null, 2));
    return;
  }

  if (activate && version && !source) {
    const { error } = await supabase.rpc("cwb_activate_distribution", {
      p_distribution_version: version,
    });
    if (error) {
      throw new Error(`Unable to activate CWB distribution: ${error.message}`);
    }
    console.log(JSON.stringify({ ok: true, activated: version }, null, 2));
    return;
  }

  if (!source) {
    throw new Error('Missing required --source "/path/to/cwb/dist/cwb-alpha" argument for import.');
  }

  const result = await importValidatedPackage(supabase, source, activate, profile);
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
