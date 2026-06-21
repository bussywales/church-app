import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  CWB_DISPLAY_STATUS,
  CWB_FULL_WARNING,
  CWB_KNOWN_LEGACY_DISTRIBUTION_VERSION,
  validateCwbPackage,
  type CwbExpectedCounts,
} from "../../scripts/cwb/validation";

const EXPECTED_COUNTS: CwbExpectedCounts = {
  books: 1,
  chapters: 2,
  verses: 3,
};

type Fixture = ReturnType<typeof createFixture>;

function createFixture() {
  return {
    manifest: {
      package_name: "CWB First Draft Internal Preview",
      distribution_version: CWB_KNOWN_LEGACY_DISTRIBUTION_VERSION,
      generated_at: "2026-06-17T00:00:00.000Z",
      distribution_type: "internal_preview",
      translation: "CWB",
      status: `CWB ${CWB_DISPLAY_STATUS}`,
      warning: CWB_FULL_WARNING,
      source_metadata: {},
      counts: {
        books: 1,
        chapters_or_psalms: 2,
        verses: 3,
      },
      files: {
        cwb: {
          manifest: "dist/cwb-alpha/manifest.json",
          books: "dist/cwb-alpha/books.json",
          chapters: "dist/cwb-alpha/chapters.json",
          verses: "dist/cwb-alpha/verses.json",
          status: "dist/cwb-alpha/cwb-status.json",
          search_index: "dist/cwb-alpha/search-index.json",
        },
      },
      validation: {},
    },
    status: {
      package_name: "CWB First Draft Internal Preview",
      distribution_version: CWB_KNOWN_LEGACY_DISTRIBUTION_VERSION,
      status: `CWB ${CWB_DISPLAY_STATUS}`,
      warning: CWB_FULL_WARNING,
      public_release: false,
      reviewed: false,
      approved: false,
      final: false,
      published: false,
      released: false,
    },
    books: [
      {
        order: 1,
        testament: "Synthetic Testament",
        book: "Genesis",
        book_slug: "genesis",
        chapters: 2,
        verses: 3,
        first_reference: "Genesis 1:1",
        last_reference: "Genesis 2:1",
        status: `CWB ${CWB_DISPLAY_STATUS}`,
        warning: CWB_FULL_WARNING,
      },
    ],
    chapters: [
      {
        book_order: 1,
        testament: "Synthetic Testament",
        book: "Genesis",
        book_slug: "genesis",
        chapter: 1,
        reference: "Genesis 1",
        verse_count: 2,
        first_reference: "Genesis 1:1",
        last_reference: "Genesis 1:2",
        status: `CWB ${CWB_DISPLAY_STATUS}`,
        warning: CWB_FULL_WARNING,
        source_files: ["synthetic/genesis-01.md"],
      },
      {
        book_order: 1,
        testament: "Synthetic Testament",
        book: "Genesis",
        book_slug: "genesis",
        chapter: 2,
        reference: "Genesis 2",
        verse_count: 1,
        first_reference: "Genesis 2:1",
        last_reference: "Genesis 2:1",
        status: `CWB ${CWB_DISPLAY_STATUS}`,
        warning: CWB_FULL_WARNING,
        source_files: ["synthetic/genesis-02.md"],
      },
    ],
    verses: [
      {
        id: "CWB-GEN-001-001",
        translation: "CWB",
        testament: "Synthetic Testament",
        book: "Genesis",
        book_slug: "genesis",
        chapter: 1,
        verse: 1,
        reference: "Genesis 1:1",
        text: "alpha one",
        status: "first_draft",
        preview_status: `CWB ${CWB_DISPLAY_STATUS}`,
        warning: CWB_FULL_WARNING,
        source_file: "synthetic/genesis-01.md",
        version: "synthetic-v1",
        distribution_version: CWB_KNOWN_LEGACY_DISTRIBUTION_VERSION,
      },
      {
        id: "CWB-GEN-001-002",
        translation: "CWB",
        testament: "Synthetic Testament",
        book: "Genesis",
        book_slug: "genesis",
        chapter: 1,
        verse: 2,
        reference: "Genesis 1:2",
        text: "alpha two",
        status: "first_draft",
        preview_status: `CWB ${CWB_DISPLAY_STATUS}`,
        warning: CWB_FULL_WARNING,
        source_file: "synthetic/genesis-01.md",
        version: "synthetic-v1",
        distribution_version: CWB_KNOWN_LEGACY_DISTRIBUTION_VERSION,
      },
      {
        id: "CWB-GEN-002-001",
        translation: "CWB",
        testament: "Synthetic Testament",
        book: "Genesis",
        book_slug: "genesis",
        chapter: 2,
        verse: 1,
        reference: "Genesis 2:1",
        text: "beta one",
        status: "first_draft",
        preview_status: `CWB ${CWB_DISPLAY_STATUS}`,
        warning: CWB_FULL_WARNING,
        source_file: "synthetic/genesis-02.md",
        version: "synthetic-v1",
        distribution_version: CWB_KNOWN_LEGACY_DISTRIBUTION_VERSION,
      },
    ],
    search: [
      {
        id: "CWB-GEN-001-001",
        reference: "Genesis 1:1",
        book: "Genesis",
        book_slug: "genesis",
        chapter: 1,
        verse: 1,
        plain_text: "alpha one",
        searchable_text: "alpha one",
      },
      {
        id: "CWB-GEN-001-002",
        reference: "Genesis 1:2",
        book: "Genesis",
        book_slug: "genesis",
        chapter: 1,
        verse: 2,
        plain_text: "alpha two",
        searchable_text: "alpha two",
      },
      {
        id: "CWB-GEN-002-001",
        reference: "Genesis 2:1",
        book: "Genesis",
        book_slug: "genesis",
        chapter: 2,
        verse: 1,
        plain_text: "beta one",
        searchable_text: "beta one",
      },
    ],
  };
}

async function writeFixture(fixture: Fixture) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "cwb-fixture-"));

  await Promise.all([
    writeFile(path.join(dir, "manifest.json"), JSON.stringify(fixture.manifest), "utf8"),
    writeFile(path.join(dir, "cwb-status.json"), JSON.stringify(fixture.status), "utf8"),
    writeFile(path.join(dir, "books.json"), JSON.stringify(fixture.books), "utf8"),
    writeFile(path.join(dir, "chapters.json"), JSON.stringify(fixture.chapters), "utf8"),
    writeFile(path.join(dir, "verses.json"), JSON.stringify(fixture.verses), "utf8"),
    writeFile(path.join(dir, "search-index.json"), JSON.stringify(fixture.search), "utf8"),
  ]);

  return dir;
}

async function validateFixture(mutator?: (fixture: Fixture) => void) {
  const fixture = createFixture();
  mutator?.(fixture);
  const dir = await writeFixture(fixture);

  try {
    return await validateCwbPackage(dir, { expectedCounts: EXPECTED_COUNTS });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("valid synthetic package preserves governed CWB metadata", async () => {
  const result = await validateFixture();

  assert.equal(result.ok, true);
  assert.equal(result.distribution_version, CWB_KNOWN_LEGACY_DISTRIBUTION_VERSION);
  assert.equal(result.validationReport.package_name_contract_drift, true);
  assert.deepEqual(result.counts, { books: 1, chapters: 2, verses: 3, search_index: 3 });
  assert.equal(result.errors.length, 0);
  assert.match(result.verseIdSetSha256 ?? "", /^[a-f0-9]{64}$/);
});

const invalidCases: Array<{
  name: string;
  mutate: (fixture: Fixture) => void;
  expectedError: RegExp;
}> = [
  {
    name: "missing warning fails closed",
    mutate: (fixture) => {
      delete fixture.manifest.warning;
    },
    expectedError: /warning/i,
  },
  {
    name: "wrong status fails closed",
    mutate: (fixture) => {
      fixture.manifest.status = "CWB Reviewed";
    },
    expectedError: /status/i,
  },
  {
    name: "public release flag fails closed",
    mutate: (fixture) => {
      fixture.status.public_release = true;
    },
    expectedError: /public_release must be false/i,
  },
  {
    name: "wrong counts fail validation",
    mutate: (fixture) => {
      fixture.manifest.counts.verses = 4;
    },
    expectedError: /Manifest verse count/i,
  },
  {
    name: "duplicate verse id fails validation",
    mutate: (fixture) => {
      fixture.verses[1].id = fixture.verses[0].id;
    },
    expectedError: /Duplicate verse id/i,
  },
  {
    name: "missing verse id fails validation",
    mutate: (fixture) => {
      delete fixture.verses[0].id;
    },
    expectedError: /missing a non-empty id/i,
  },
  {
    name: "invalid id syntax fails validation",
    mutate: (fixture) => {
      fixture.verses[0].id = "BAD";
    },
    expectedError: /Invalid CWB verse id syntax/i,
  },
  {
    name: "duplicate canonical key fails validation",
    mutate: (fixture) => {
      fixture.verses[1].id = "CWB-GEN-001-001";
      fixture.verses[1].verse = 1;
      fixture.search[1].id = "CWB-GEN-001-001";
      fixture.search[1].verse = 1;
    },
    expectedError: /Duplicate canonical verse key/i,
  },
  {
    name: "missing chapter fails validation",
    mutate: (fixture) => {
      fixture.chapters.pop();
    },
    expectedError: /Missing chapter genesis 2/i,
  },
  {
    name: "missing verse number fails validation",
    mutate: (fixture) => {
      fixture.verses[1].id = "CWB-GEN-001-003";
      fixture.verses[1].verse = 3;
      fixture.search[1].id = "CWB-GEN-001-003";
      fixture.search[1].verse = 3;
    },
    expectedError: /Missing verse number genesis:1:2/i,
  },
  {
    name: "mismatched verse distribution version fails validation",
    mutate: (fixture) => {
      fixture.verses[0].distribution_version = "v0";
    },
    expectedError: /distribution_version does not match/i,
  },
  {
    name: "mismatched verse and search id sets fail validation",
    mutate: (fixture) => {
      fixture.search[0].id = "CWB-GEN-001-099";
    },
    expectedError: /does not match a verse id/i,
  },
  {
    name: "uppercase searchable text fails validation",
    mutate: (fixture) => {
      fixture.search[0].searchable_text = "ALPHA ONE";
    },
    expectedError: /searchable_text must be lowercase/i,
  },
];

for (const invalidCase of invalidCases) {
  test(invalidCase.name, async () => {
    const result = await validateFixture(invalidCase.mutate);
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), invalidCase.expectedError);
  });
}

test("unsupported source schema profile fails validation", async () => {
  const dir = await writeFixture(createFixture());
  try {
    const result = await validateCwbPackage(dir, {
      profile: "future-cwb-profile",
      expectedCounts: EXPECTED_COUNTS,
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /Unsupported CWB source schema profile/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("source file checksum changes fail validation", async () => {
  const dir = await writeFixture(createFixture());
  try {
    const result = await validateCwbPackage(dir, {
      expectedCounts: EXPECTED_COUNTS,
      afterInitialHashes: async (sourceDir) => {
        const booksPath = path.join(sourceDir, "books.json");
        const books = JSON.parse(await readFile(booksPath, "utf8"));
        books[0].verses = 4;
        await writeFile(booksPath, JSON.stringify(books), "utf8");
      },
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /Source file hashes changed during validation/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
