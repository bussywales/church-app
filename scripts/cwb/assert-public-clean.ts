import { execFileSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { pathToFileURL } from "url";

type PublicCleanResult = {
  ok: boolean;
  checked: string[];
  errors: string[];
};

const CWB_PAYLOAD_NAMES = new Set([
  "manifest.json",
  "books.json",
  "chapters.json",
  "verses.json",
  "search-index.json",
  "cwb-status.json",
]);

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(root: string, skipDirNames = new Set<string>()): Promise<string[]> {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(root, entry.name);
      if (entry.isDirectory()) {
        if (skipDirNames.has(entry.name)) {
          return [];
        }

        return listFiles(fullPath, skipDirNames);
      }
      return [fullPath];
    }),
  );

  return files.flat();
}

function gitTrackedFiles(repoRoot: string) {
  const output = execFileSync("git", ["ls-files", "-z"], { cwd: repoRoot });
  return output
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
}

async function assertNoStaticPayloadImports(repoRoot: string, errors: string[]) {
  const sourceFiles = (await listFiles(repoRoot, new Set([".git", ".next", "node_modules"]))).filter((file) => {
    const relative = path.relative(repoRoot, file);
    return !relative.startsWith("node_modules/") && !relative.startsWith(".next/") && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file);
  });

  const staticPayloadImport =
    /\bimport\s+(?:[^'";]+?\s+from\s+)?["'][^"']*(?:verses|search-index)\.json["']|\brequire\(["'][^"']*(?:verses|search-index)\.json["']\)/;

  await Promise.all(
    sourceFiles.map(async (file) => {
      const source = await fs.readFile(file, "utf8");
      if (staticPayloadImport.test(source)) {
        errors.push(`Static CWB payload import found in ${path.relative(repoRoot, file)}.`);
      }
    }),
  );
}

async function assertImportScriptsDoNotCopyPackages(repoRoot: string, errors: string[]) {
  const scriptRoot = path.join(repoRoot, "scripts", "cwb");
  const scriptFiles = (await listFiles(scriptRoot)).filter((file) => path.basename(file) === "import.ts");
  const copyPattern = /\b(copyFile|copyFileSync|cpSync|cp\s*\(|writeFile(?:Sync)?\([^)]*cwb-alpha|mkdir(?:Sync)?\([^)]*cwb-alpha)/;

  await Promise.all(
    scriptFiles.map(async (file) => {
      const source = await fs.readFile(file, "utf8");
      if (copyPattern.test(source)) {
        errors.push(`CWB import script appears to copy or write a package inside the repo: ${path.relative(repoRoot, file)}.`);
      }
    }),
  );
}

function assertNoTrackedPayload(repoRoot: string, errors: string[]) {
  const tracked = gitTrackedFiles(repoRoot);
  const forbidden = tracked.filter((file) => {
    const normalized = file.split(path.sep).join("/");
    const basename = path.basename(normalized);
    return (
      normalized.startsWith("public/") && /cwb/i.test(normalized)
    ) || (
      /(^|\/)(dist\/)?cwb-alpha\//i.test(normalized)
    ) || (
      /(^|\/)cwb.*\.(json|sqlite|sqlite3|db)$/i.test(normalized)
    ) || (
      (basename === "verses.json" || basename === "search-index.json") && !normalized.startsWith("tests/")
    );
  });

  for (const file of forbidden) {
    errors.push(`Tracked CWB payload file is not allowed in Church App: ${file}.`);
  }
}

async function assertPublicDirectoryClean(repoRoot: string, errors: string[]) {
  const publicFiles = await listFiles(path.join(repoRoot, "public"));
  for (const file of publicFiles) {
    const relative = path.relative(repoRoot, file);
    const basename = path.basename(file);
    if (/cwb/i.test(relative) || CWB_PAYLOAD_NAMES.has(basename) || /\.(sqlite|sqlite3|db)$/i.test(basename)) {
      errors.push(`CWB payload is not allowed under public/: ${relative}.`);
    }
  }
}

async function assertNextBuildClean(repoRoot: string, errors: string[]) {
  const nextRoot = path.join(repoRoot, ".next");
  if (!(await pathExists(nextRoot))) {
    return;
  }

  const nextFiles = await listFiles(nextRoot);
  for (const file of nextFiles) {
    const relative = path.relative(repoRoot, file);
    const basename = path.basename(file);
    if (
      ((CWB_PAYLOAD_NAMES.has(basename) || /\.(sqlite|sqlite3|db)$/i.test(basename)) && /cwb|verse|search/i.test(relative)) ||
      /cwb-alpha/i.test(relative)
    ) {
      errors.push(`CWB payload must not be emitted into .next: ${relative}.`);
    }
  }
}

export async function assertPublicClean(repoRoot = process.cwd()): Promise<PublicCleanResult> {
  const resolvedRoot = path.resolve(repoRoot);
  const errors: string[] = [];

  assertNoTrackedPayload(resolvedRoot, errors);
  await assertPublicDirectoryClean(resolvedRoot, errors);
  await assertNoStaticPayloadImports(resolvedRoot, errors);
  await assertImportScriptsDoNotCopyPackages(resolvedRoot, errors);
  await assertNextBuildClean(resolvedRoot, errors);

  return {
    ok: errors.length === 0,
    checked: ["git-tracked-files", "public-directory", "static-imports", "import-scripts", ".next-build-output"],
    errors,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assertPublicClean()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
