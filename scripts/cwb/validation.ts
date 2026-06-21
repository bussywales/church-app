import { createHash } from "crypto";
import { createReadStream, promises as fs } from "fs";
import path from "path";
import { chain } from "stream-chain";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";

export const CWB_CODE = "CWB";
export const CWB_LABEL = "CWB Internal Preview";
export const CWB_DISPLAY_STATUS = "First Draft - Review Required";
export const CWB_FULL_WARNING =
  "Internal preview only. Not reviewed, approved, final, published, or released.";
export const CWB_SOURCE_SCHEMA_PROFILE = "legacy-cwb-alpha-v1";
export const CWB_CONSUMER_SCHEMA_VERSION = "church-app-cwb-preview-v1";
export const CWB_KNOWN_LEGACY_DISTRIBUTION_VERSION = "v7.7.0-alpha";

export const CWB_EXPECTED_COUNTS = {
  books: 66,
  chapters: 1189,
  verses: 31102,
};

export const CWB_SOURCE_FILES = {
  manifest: "manifest.json",
  books: "books.json",
  chapters: "chapters.json",
  verses: "verses.json",
  searchIndex: "search-index.json",
  cwbStatus: "cwb-status.json",
} as const;

export const BOOK_CODE_BY_SLUG: Record<string, string> = {
  genesis: "GEN",
  exodus: "EXO",
  leviticus: "LEV",
  numbers: "NUM",
  deuteronomy: "DEU",
  joshua: "JOS",
  judges: "JDG",
  ruth: "RUT",
  "1-samuel": "1SA",
  "2-samuel": "2SA",
  "1-kings": "1KI",
  "2-kings": "2KI",
  "1-chronicles": "1CH",
  "2-chronicles": "2CH",
  ezra: "EZR",
  nehemiah: "NEH",
  esther: "EST",
  job: "JOB",
  psalms: "PSA",
  proverbs: "PRO",
  ecclesiastes: "ECC",
  "song-of-solomon": "SNG",
  isaiah: "ISA",
  jeremiah: "JER",
  lamentations: "LAM",
  ezekiel: "EZK",
  daniel: "DAN",
  hosea: "HOS",
  joel: "JOL",
  amos: "AMO",
  obadiah: "OBA",
  jonah: "JON",
  micah: "MIC",
  nahum: "NAM",
  habakkuk: "HAB",
  zephaniah: "ZEP",
  haggai: "HAG",
  zechariah: "ZEC",
  malachi: "MAL",
  matthew: "MAT",
  mark: "MRK",
  luke: "LUK",
  john: "JHN",
  acts: "ACT",
  romans: "ROM",
  "1-corinthians": "1CO",
  "2-corinthians": "2CO",
  galatians: "GAL",
  ephesians: "EPH",
  philippians: "PHP",
  colossians: "COL",
  "1-thessalonians": "1TH",
  "2-thessalonians": "2TH",
  "1-timothy": "1TI",
  "2-timothy": "2TI",
  titus: "TIT",
  philemon: "PHM",
  hebrews: "HEB",
  james: "JAS",
  "1-peter": "1PE",
  "2-peter": "2PE",
  "1-john": "1JN",
  "2-john": "2JN",
  "3-john": "3JN",
  jude: "JUD",
  revelation: "REV",
};

export type CwbExpectedCounts = typeof CWB_EXPECTED_COUNTS;

export type SourceHashes = {
  manifest: string;
  books: string;
  chapters: string;
  verses: string;
  searchIndex: string;
  cwbStatus: string;
};

type Manifest = {
  package_name?: unknown;
  distribution_version?: unknown;
  generated_at?: unknown;
  distribution_type?: unknown;
  translation?: unknown;
  status?: unknown;
  warning?: unknown;
  counts?: {
    books?: unknown;
    chapters_or_psalms?: unknown;
    chapters?: unknown;
    verses?: unknown;
  };
  files?: unknown;
  schema_version?: unknown;
};

export type CwbBook = {
  order: number;
  testament: string;
  book: string;
  book_slug: string;
  chapters: number;
  verses: number;
  status: string;
  warning: string;
};

export type CwbChapter = {
  book_order: number;
  testament: string;
  book: string;
  book_slug: string;
  chapter: number;
  reference: string;
  verse_count: number;
  status: string;
  warning: string;
  source_files: unknown[];
};

export type CwbVerse = {
  id?: unknown;
  translation?: unknown;
  testament?: unknown;
  book?: unknown;
  book_slug?: unknown;
  chapter?: unknown;
  verse?: unknown;
  reference?: unknown;
  text?: unknown;
  status?: unknown;
  preview_status?: unknown;
  warning?: unknown;
  source_file?: unknown;
  version?: unknown;
  distribution_version?: unknown;
};

export type CwbSearchRecord = {
  id?: unknown;
  reference?: unknown;
  book_slug?: unknown;
  chapter?: unknown;
  verse?: unknown;
  plain_text?: unknown;
  searchable_text?: unknown;
};

type CwbStatus = {
  package_name?: unknown;
  distribution_version?: unknown;
  status?: unknown;
  warning?: unknown;
  public_release?: unknown;
  reviewed?: unknown;
  approved?: unknown;
  final?: unknown;
  published?: unknown;
  released?: unknown;
};

export type ValidationReport = {
  source_schema_profile: string;
  consumer_schema_version: string;
  distribution_version: string | null;
  package_name: string | null;
  package_name_contract_drift: boolean;
  counts: {
    books: number;
    chapters: number;
    verses: number;
    search_index: number;
  };
  expected_counts: CwbExpectedCounts;
  hashes: SourceHashes | null;
  source_file_hashes_stable: boolean;
  verse_id_set_sha256: string | null;
  errors: string[];
};

export type ValidationResult = {
  ok: boolean;
  sourceDir: string;
  source_schema_profile: string;
  consumer_schema_version: string;
  distribution_version: string | null;
  package_name: string | null;
  manifest: Manifest | null;
  cwbStatus: CwbStatus | null;
  books: CwbBook[];
  chapters: CwbChapter[];
  expectedCounts: CwbExpectedCounts;
  counts: ValidationReport["counts"];
  hashes: SourceHashes | null;
  verseIdSetSha256: string | null;
  errors: string[];
  validationReport: ValidationReport;
};

type ValidateOptions = {
  profile?: string;
  expectedCounts?: CwbExpectedCounts;
  afterInitialHashes?: (sourceDir: string) => void | Promise<void>;
};

type VerseDigest = {
  book_slug: string;
  chapter: number;
  verse: number;
  reference: string;
  plain_text: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function pad3(value: number) {
  return value.toString().padStart(3, "0");
}

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sha256Text(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function hashFileSha256(filePath: string) {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });
  return hash.digest("hex");
}

export function sourceFilePaths(sourceDir: string) {
  return {
    manifest: path.join(sourceDir, CWB_SOURCE_FILES.manifest),
    books: path.join(sourceDir, CWB_SOURCE_FILES.books),
    chapters: path.join(sourceDir, CWB_SOURCE_FILES.chapters),
    verses: path.join(sourceDir, CWB_SOURCE_FILES.verses),
    searchIndex: path.join(sourceDir, CWB_SOURCE_FILES.searchIndex),
    cwbStatus: path.join(sourceDir, CWB_SOURCE_FILES.cwbStatus),
  };
}

export async function hashSourceFiles(sourceDir: string): Promise<SourceHashes> {
  const files = sourceFilePaths(sourceDir);

  return {
    manifest: await hashFileSha256(files.manifest),
    books: await hashFileSha256(files.books),
    chapters: await hashFileSha256(files.chapters),
    verses: await hashFileSha256(files.verses),
    searchIndex: await hashFileSha256(files.searchIndex),
    cwbStatus: await hashFileSha256(files.cwbStatus),
  };
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

export async function streamJsonArrayFile<T>(
  filePath: string,
  onValue: (value: T, index: number) => void | Promise<void>,
) {
  let index = 0;

  await new Promise<void>((resolve, reject) => {
    const stream = chain([createReadStream(filePath), parser(), streamArray()]);
    let rejected = false;

    function fail(error: unknown) {
      if (!rejected) {
        rejected = true;
        reject(error);
      }
    }

    stream.on("data", (data: { value: T }) => {
      stream.pause();
      Promise.resolve(onValue(data.value, index))
        .then(() => {
          index += 1;
          stream.resume();
        })
        .catch(fail);
    });
    stream.on("error", fail);
    stream.on("end", () => {
      if (!rejected) {
        resolve();
      }
    });
  });

  return index;
}

function errorReport(
  sourceDir: string,
  profile: string,
  expectedCounts: CwbExpectedCounts,
  errors: string[],
): ValidationResult {
  const validationReport: ValidationReport = {
    source_schema_profile: profile,
    consumer_schema_version: CWB_CONSUMER_SCHEMA_VERSION,
    distribution_version: null,
    package_name: null,
    package_name_contract_drift: false,
    counts: { books: 0, chapters: 0, verses: 0, search_index: 0 },
    expected_counts: expectedCounts,
    hashes: null,
    source_file_hashes_stable: false,
    verse_id_set_sha256: null,
    errors,
  };

  return {
    ok: false,
    sourceDir,
    source_schema_profile: profile,
    consumer_schema_version: CWB_CONSUMER_SCHEMA_VERSION,
    distribution_version: null,
    package_name: null,
    manifest: null,
    cwbStatus: null,
    books: [],
    chapters: [],
    expectedCounts,
    counts: validationReport.counts,
    hashes: null,
    verseIdSetSha256: null,
    errors,
    validationReport,
  };
}

function validateManifest(manifest: Manifest, expectedCounts: CwbExpectedCounts, errors: string[]) {
  if (manifest.schema_version !== undefined) {
    errors.push("Unsupported CWB schema: legacy-cwb-alpha-v1 expects no schema_version field.");
  }

  if (manifest.distribution_version !== CWB_KNOWN_LEGACY_DISTRIBUTION_VERSION) {
    errors.push(
      `Unsupported CWB distribution_version: expected ${CWB_KNOWN_LEGACY_DISTRIBUTION_VERSION}.`,
    );
  }

  if (manifest.translation !== CWB_CODE) {
    errors.push("Manifest translation must be CWB.");
  }

  if (manifest.distribution_type !== "internal_preview") {
    errors.push("Manifest distribution_type must be internal_preview.");
  }

  if (manifest.status !== `CWB ${CWB_DISPLAY_STATUS}` && manifest.status !== CWB_DISPLAY_STATUS) {
    errors.push("Manifest status must preserve First Draft - Review Required wording.");
  }

  if (manifest.warning !== CWB_FULL_WARNING) {
    errors.push("Manifest warning is missing or does not match the required CWB warning.");
  }

  if (!isNonEmptyString(manifest.package_name)) {
    errors.push("Manifest package_name is required.");
  }

  if (!isNonEmptyString(manifest.generated_at)) {
    errors.push("Manifest generated_at is required.");
  }

  if (!isRecord(manifest.files)) {
    errors.push("Manifest files object is required for the legacy profile.");
  }

  const counts = manifest.counts;
  if (!isRecord(counts)) {
    errors.push("Manifest counts object is required.");
    return;
  }

  const manifestChapters = counts.chapters_or_psalms ?? counts.chapters;
  if (counts.books !== expectedCounts.books) {
    errors.push(`Manifest book count must be ${expectedCounts.books}.`);
  }
  if (manifestChapters !== expectedCounts.chapters) {
    errors.push(`Manifest chapter/psalm count must be ${expectedCounts.chapters}.`);
  }
  if (counts.verses !== expectedCounts.verses) {
    errors.push(`Manifest verse count must be ${expectedCounts.verses}.`);
  }
}

function validateStatusFile(status: CwbStatus, errors: string[]) {
  if (status.distribution_version !== CWB_KNOWN_LEGACY_DISTRIBUTION_VERSION) {
    errors.push("CWB status distribution_version is unsupported for legacy-cwb-alpha-v1.");
  }
  if (status.status !== `CWB ${CWB_DISPLAY_STATUS}` && status.status !== CWB_DISPLAY_STATUS) {
    errors.push("CWB status file must preserve First Draft - Review Required wording.");
  }
  if (status.warning !== CWB_FULL_WARNING) {
    errors.push("CWB status warning is missing or does not match the required CWB warning.");
  }

  for (const key of ["public_release", "reviewed", "approved", "final", "published", "released"] as const) {
    if (status[key] !== false) {
      errors.push(`CWB status ${key} must be false.`);
    }
  }
}

function validateBooks(rawBooks: unknown, expectedCounts: CwbExpectedCounts, errors: string[]) {
  if (!Array.isArray(rawBooks)) {
    errors.push("books.json must contain a JSON array.");
    return [];
  }

  if (rawBooks.length !== expectedCounts.books) {
    errors.push(`books.json must contain exactly ${expectedCounts.books} records.`);
  }

  const books: CwbBook[] = [];
  const orders = new Set<number>();
  const slugs = new Set<string>();

  rawBooks.forEach((raw, index) => {
    if (!isRecord(raw)) {
      errors.push(`Book record ${index + 1} must be an object.`);
      return;
    }

    const required = ["order", "testament", "book", "book_slug", "chapters", "verses", "status", "warning"];
    for (const key of required) {
      if (!(key in raw)) {
        errors.push(`Book record ${index + 1} is missing required field ${key}.`);
      }
    }

    if (!isPositiveInteger(raw.order)) {
      errors.push(`Book record ${index + 1} has invalid order.`);
      return;
    }
    if (!isPositiveInteger(raw.chapters) || !isPositiveInteger(raw.verses)) {
      errors.push(`Book record ${index + 1} has invalid chapter or verse counts.`);
      return;
    }
    if (!isNonEmptyString(raw.book_slug) || !isNonEmptyString(raw.book) || !isNonEmptyString(raw.testament)) {
      errors.push(`Book record ${index + 1} has invalid book identity fields.`);
      return;
    }
    if (raw.status !== `CWB ${CWB_DISPLAY_STATUS}` && raw.status !== CWB_DISPLAY_STATUS) {
      errors.push(`Book ${raw.book_slug} status must preserve First Draft - Review Required wording.`);
    }
    if (raw.warning !== CWB_FULL_WARNING) {
      errors.push(`Book ${raw.book_slug} warning is missing or incorrect.`);
    }
    if (!BOOK_CODE_BY_SLUG[raw.book_slug]) {
      errors.push(`Book ${raw.book_slug} is not in the explicit CWB book-code mapping.`);
    }
    if (orders.has(raw.order)) {
      errors.push(`Duplicate book order ${raw.order}.`);
    }
    if (slugs.has(raw.book_slug)) {
      errors.push(`Duplicate book_slug ${raw.book_slug}.`);
    }

    orders.add(raw.order);
    slugs.add(raw.book_slug);
    books.push(raw as CwbBook);
  });

  for (let order = 1; order <= rawBooks.length; order += 1) {
    if (!orders.has(order)) {
      errors.push(`Missing book order ${order}.`);
    }
  }

  return books;
}

function validateChapters(
  rawChapters: unknown,
  books: CwbBook[],
  expectedCounts: CwbExpectedCounts,
  errors: string[],
) {
  if (!Array.isArray(rawChapters)) {
    errors.push("chapters.json must contain a JSON array.");
    return [];
  }

  if (rawChapters.length !== expectedCounts.chapters) {
    errors.push(`chapters.json must contain exactly ${expectedCounts.chapters} records.`);
  }

  const chapters: CwbChapter[] = [];
  const chapterKeys = new Set<string>();
  const bookBySlug = new Map(books.map((book) => [book.book_slug, book]));

  rawChapters.forEach((raw, index) => {
    if (!isRecord(raw)) {
      errors.push(`Chapter record ${index + 1} must be an object.`);
      return;
    }

    const required = [
      "book_order",
      "testament",
      "book",
      "book_slug",
      "chapter",
      "reference",
      "verse_count",
      "status",
      "warning",
      "source_files",
    ];
    for (const key of required) {
      if (!(key in raw)) {
        errors.push(`Chapter record ${index + 1} is missing required field ${key}.`);
      }
    }

    if (!isNonEmptyString(raw.book_slug) || !isPositiveInteger(raw.chapter) || !isPositiveInteger(raw.verse_count)) {
      errors.push(`Chapter record ${index + 1} has invalid canonical fields.`);
      return;
    }
    if (!isNonEmptyString(raw.reference)) {
      errors.push(`Chapter ${raw.book_slug} ${raw.chapter} has empty reference.`);
    }
    if (!bookBySlug.has(raw.book_slug)) {
      errors.push(`Chapter ${raw.book_slug} ${raw.chapter} references an unknown book_slug.`);
    }
    if (raw.status !== `CWB ${CWB_DISPLAY_STATUS}` && raw.status !== CWB_DISPLAY_STATUS) {
      errors.push(`Chapter ${raw.book_slug} ${raw.chapter} status must preserve First Draft - Review Required wording.`);
    }
    if (raw.warning !== CWB_FULL_WARNING) {
      errors.push(`Chapter ${raw.book_slug} ${raw.chapter} warning is missing or incorrect.`);
    }
    if (!Array.isArray(raw.source_files)) {
      errors.push(`Chapter ${raw.book_slug} ${raw.chapter} source_files must be an array.`);
    }

    const key = `${raw.book_slug}:${raw.chapter}`;
    if (chapterKeys.has(key)) {
      errors.push(`Duplicate chapter key ${key}.`);
    }
    chapterKeys.add(key);
    chapters.push(raw as CwbChapter);
  });

  for (const book of books) {
    for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
      if (!chapterKeys.has(`${book.book_slug}:${chapter}`)) {
        errors.push(`Missing chapter ${book.book_slug} ${chapter}.`);
      }
    }
  }

  return chapters;
}

function permittedVerseStatus(value: unknown) {
  return value === "first_draft" || value === CWB_DISPLAY_STATUS || value === `CWB ${CWB_DISPLAY_STATUS}`;
}

function validateVerseRecord(
  raw: CwbVerse,
  distributionVersion: string | null,
  chapterByKey: Map<string, CwbChapter>,
  verseIds: Set<string>,
  verseCanonicalKeys: Set<string>,
  verseNumbersByChapter: Map<string, Set<number>>,
  verseDigestById: Map<string, VerseDigest>,
  errors: string[],
) {
  if (!isNonEmptyString(raw.id)) {
    errors.push("Verse record is missing a non-empty id.");
    return;
  }

  const id = raw.id;
  if (verseIds.has(id)) {
    errors.push(`Duplicate verse id ${id}.`);
  }
  verseIds.add(id);

  if (!/^CWB-[A-Z0-9]{3}-\d{3}-\d{3}$/.test(id)) {
    errors.push(`Invalid CWB verse id syntax ${id}.`);
  }

  if (raw.translation !== CWB_CODE) {
    errors.push(`Verse ${id} translation must be CWB.`);
  }
  if (raw.distribution_version !== distributionVersion) {
    errors.push(`Verse ${id} distribution_version does not match manifest distribution_version.`);
  }
  if (!permittedVerseStatus(raw.status)) {
    errors.push(`Verse ${id} source status must remain First Draft / Review Required.`);
  }
  if (raw.preview_status !== `CWB ${CWB_DISPLAY_STATUS}` && raw.preview_status !== CWB_DISPLAY_STATUS) {
    errors.push(`Verse ${id} preview_status must preserve First Draft - Review Required wording.`);
  }
  if (raw.warning !== CWB_FULL_WARNING) {
    errors.push(`Verse ${id} warning is missing or incorrect.`);
  }

  if (
    !isNonEmptyString(raw.testament) ||
    !isNonEmptyString(raw.book) ||
    !isNonEmptyString(raw.book_slug) ||
    !isPositiveInteger(raw.chapter) ||
    !isPositiveInteger(raw.verse) ||
    !isNonEmptyString(raw.reference) ||
    !isNonEmptyString(raw.text) ||
    !isNonEmptyString(raw.source_file) ||
    !isNonEmptyString(raw.version)
  ) {
    errors.push(`Verse ${id} is missing required non-empty canonical/source fields.`);
    return;
  }

  const expectedCode = BOOK_CODE_BY_SLUG[raw.book_slug];
  if (!expectedCode) {
    errors.push(`Verse ${id} uses unknown book_slug ${raw.book_slug}.`);
  } else {
    const expectedId = `CWB-${expectedCode}-${pad3(raw.chapter)}-${pad3(raw.verse)}`;
    if (id !== expectedId) {
      errors.push(`Verse ${id} does not match expected stable id ${expectedId}.`);
    }
  }

  const chapterKey = `${raw.book_slug}:${raw.chapter}`;
  if (!chapterByKey.has(chapterKey)) {
    errors.push(`Verse ${id} references missing chapter ${chapterKey}.`);
  }

  const canonicalKey = `${raw.book_slug}:${raw.chapter}:${raw.verse}`;
  if (verseCanonicalKeys.has(canonicalKey)) {
    errors.push(`Duplicate canonical verse key ${canonicalKey}.`);
  }
  verseCanonicalKeys.add(canonicalKey);

  const verseNumbers = verseNumbersByChapter.get(chapterKey) ?? new Set<number>();
  verseNumbers.add(raw.verse);
  verseNumbersByChapter.set(chapterKey, verseNumbers);

  verseDigestById.set(id, {
    book_slug: raw.book_slug,
    chapter: raw.chapter,
    verse: raw.verse,
    reference: raw.reference,
    plain_text: normalizeWhitespace(raw.text),
  });
}

function validateSearchRecord(
  raw: CwbSearchRecord,
  verseDigestById: Map<string, VerseDigest>,
  searchIds: Set<string>,
  errors: string[],
) {
  if (!isNonEmptyString(raw.id)) {
    errors.push("Search index record is missing a non-empty id.");
    return;
  }

  const id = raw.id;
  if (searchIds.has(id)) {
    errors.push(`Duplicate search index id ${id}.`);
  }
  searchIds.add(id);

  const verse = verseDigestById.get(id);
  if (!verse) {
    errors.push(`Search index id ${id} does not match a verse id.`);
    return;
  }

  if (
    raw.reference !== verse.reference ||
    raw.book_slug !== verse.book_slug ||
    raw.chapter !== verse.chapter ||
    raw.verse !== verse.verse
  ) {
    errors.push(`Search index ${id} canonical fields do not match verses.json.`);
  }

  if (raw.plain_text !== verse.plain_text) {
    errors.push(`Search index ${id} plain_text is not the whitespace-normalised verse text.`);
  }

  if (!isNonEmptyString(raw.searchable_text)) {
    errors.push(`Search index ${id} searchable_text is missing.`);
  } else if (raw.searchable_text !== raw.searchable_text.toLowerCase()) {
    errors.push(`Search index ${id} searchable_text must be lowercase.`);
  }
}

export async function validateCwbPackage(sourceDir: string, options: ValidateOptions = {}): Promise<ValidationResult> {
  const profile = options.profile ?? CWB_SOURCE_SCHEMA_PROFILE;
  const expectedCounts = options.expectedCounts ?? CWB_EXPECTED_COUNTS;
  const resolvedSourceDir = path.resolve(sourceDir);
  const errors: string[] = [];

  if (profile !== CWB_SOURCE_SCHEMA_PROFILE) {
    return errorReport(resolvedSourceDir, profile, expectedCounts, [`Unsupported CWB source schema profile ${profile}.`]);
  }

  let initialHashes: SourceHashes;
  try {
    initialHashes = await hashSourceFiles(resolvedSourceDir);
  } catch (error) {
    return errorReport(resolvedSourceDir, profile, expectedCounts, [
      `Unable to read required CWB source files: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }

  await options.afterInitialHashes?.(resolvedSourceDir);

  const files = sourceFilePaths(resolvedSourceDir);
  let manifest: Manifest;
  let status: CwbStatus;
  let rawBooks: unknown;
  let rawChapters: unknown;

  try {
    [manifest, status, rawBooks, rawChapters] = await Promise.all([
      readJsonFile<Manifest>(files.manifest),
      readJsonFile<CwbStatus>(files.cwbStatus),
      readJsonFile<unknown>(files.books),
      readJsonFile<unknown>(files.chapters),
    ]);
  } catch (error) {
    return errorReport(resolvedSourceDir, profile, expectedCounts, [
      `Unable to parse required CWB metadata files: ${error instanceof Error ? error.message : String(error)}`,
    ]);
  }

  validateManifest(manifest, expectedCounts, errors);
  validateStatusFile(status, errors);
  const books = validateBooks(rawBooks, expectedCounts, errors);
  const chapters = validateChapters(rawChapters, books, expectedCounts, errors);
  const chapterByKey = new Map(chapters.map((chapter) => [`${chapter.book_slug}:${chapter.chapter}`, chapter]));
  const verseIds = new Set<string>();
  const verseCanonicalKeys = new Set<string>();
  const verseNumbersByChapter = new Map<string, Set<number>>();
  const verseDigestById = new Map<string, VerseDigest>();
  const distributionVersion = typeof manifest.distribution_version === "string" ? manifest.distribution_version : null;

  let verseCount = 0;
  try {
    verseCount = await streamJsonArrayFile<CwbVerse>(files.verses, (raw) => {
      validateVerseRecord(
        raw,
        distributionVersion,
        chapterByKey,
        verseIds,
        verseCanonicalKeys,
        verseNumbersByChapter,
        verseDigestById,
        errors,
      );
    });
  } catch (error) {
    errors.push(`Unable to stream verses.json: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (verseCount !== expectedCounts.verses) {
    errors.push(`verses.json must contain exactly ${expectedCounts.verses} records.`);
  }

  for (const chapter of chapters) {
    const key = `${chapter.book_slug}:${chapter.chapter}`;
    const verseNumbers = verseNumbersByChapter.get(key) ?? new Set<number>();
    for (let verse = 1; verse <= chapter.verse_count; verse += 1) {
      if (!verseNumbers.has(verse)) {
        errors.push(`Missing verse number ${key}:${verse}.`);
      }
    }
    if (verseNumbers.size !== chapter.verse_count) {
      errors.push(`Chapter ${key} must contain exactly ${chapter.verse_count} verses.`);
    }
  }

  const searchIds = new Set<string>();
  let searchCount = 0;
  try {
    searchCount = await streamJsonArrayFile<CwbSearchRecord>(files.searchIndex, (raw) => {
      validateSearchRecord(raw, verseDigestById, searchIds, errors);
    });
  } catch (error) {
    errors.push(`Unable to stream search-index.json: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (searchCount !== expectedCounts.verses) {
    errors.push(`search-index.json must contain exactly ${expectedCounts.verses} records.`);
  }

  for (const id of verseIds) {
    if (!searchIds.has(id)) {
      errors.push(`Search index is missing verse id ${id}.`);
    }
  }
  for (const id of searchIds) {
    if (!verseIds.has(id)) {
      errors.push(`Search index has id ${id} that is absent from verses.json.`);
    }
  }

  let finalHashes: SourceHashes | null = null;
  let hashesStable = false;
  try {
    finalHashes = await hashSourceFiles(resolvedSourceDir);
    hashesStable = JSON.stringify(initialHashes) === JSON.stringify(finalHashes);
    if (!hashesStable) {
      errors.push("Source file hashes changed during validation.");
    }
  } catch (error) {
    errors.push(`Unable to recompute CWB source hashes: ${error instanceof Error ? error.message : String(error)}`);
  }

  const verseIdSetSha256 = sha256Text([...verseIds].sort().join("\n"));
  const packageName = typeof manifest.package_name === "string" ? manifest.package_name : null;
  const packageNameContractDrift = packageName !== "cwb-alpha";
  const counts = {
    books: books.length,
    chapters: chapters.length,
    verses: verseCount,
    search_index: searchCount,
  };
  const validationReport: ValidationReport = {
    source_schema_profile: profile,
    consumer_schema_version: CWB_CONSUMER_SCHEMA_VERSION,
    distribution_version: distributionVersion,
    package_name: packageName,
    package_name_contract_drift: packageNameContractDrift,
    counts,
    expected_counts: expectedCounts,
    hashes: finalHashes ?? initialHashes,
    source_file_hashes_stable: hashesStable,
    verse_id_set_sha256: verseIdSetSha256,
    errors,
  };

  return {
    ok: errors.length === 0,
    sourceDir: resolvedSourceDir,
    source_schema_profile: profile,
    consumer_schema_version: CWB_CONSUMER_SCHEMA_VERSION,
    distribution_version: distributionVersion,
    package_name: packageName,
    manifest,
    cwbStatus: status,
    books,
    chapters,
    expectedCounts,
    counts,
    hashes: finalHashes ?? initialHashes,
    verseIdSetSha256,
    errors,
    validationReport,
  };
}
