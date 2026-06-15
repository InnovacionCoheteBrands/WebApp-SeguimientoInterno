import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const checkerPath = path.join(projectRoot, "scripts", "check-migration-journal.ts");
const tsxPath = path.join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs");
const temporaryDirectories: string[] = [];
const processTestTimeout = 15_000;

type FixtureOptions = {
  files?: string[];
  journalTags?: string[];
};

async function createFixture({
  files = ["0000_initial.sql"],
  journalTags = ["0000_initial"],
}: FixtureOptions = {}): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "migration-journal-check-"));
  temporaryDirectories.push(root);

  const migrationsDir = path.join(root, "migrations");
  const metaDir = path.join(migrationsDir, "meta");
  await mkdir(metaDir, { recursive: true });

  await Promise.all(
    files.map((fileName) => writeFile(path.join(migrationsDir, fileName), "-- fixture\n")),
  );
  await writeFile(
    path.join(metaDir, "_journal.json"),
    JSON.stringify({
      version: "7",
      dialect: "postgresql",
      entries: journalTags.map((tag, idx) => ({
        idx,
        version: "7",
        when: idx,
        tag,
        breakpoints: true,
      })),
    }),
  );

  return root;
}

function runChecker(cwd: string) {
  return spawnSync(process.execPath, [tsxPath, checkerPath], {
    cwd,
    encoding: "utf8",
  });
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    ),
  );
});

describe("migration journal checker", () => {
  it("accepts matching versioned SQL and ignores non-versioned SQL", async () => {
    const cwd = await createFixture({
      files: ["0000_initial.sql", "manual_reference.sql"],
    });

    const result = runChecker(cwd);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Non-versioned SQL files");
    expect(result.stdout).toContain("Versioned SQL files=1, journal entries=1");
  }, processTestTimeout);

  it("reports versioned SQL missing from the journal", async () => {
    const cwd = await createFixture({ journalTags: [] });

    const result = runChecker(cwd);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Missing in journal: 0000_initial");
  }, processTestTimeout);

  it("reports stale journal entries", async () => {
    const cwd = await createFixture({ files: [] });

    const result = runChecker(cwd);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Stale journal entries: 0000_initial");
  }, processTestTimeout);

  it("reports duplicate journal tags", async () => {
    const cwd = await createFixture({
      journalTags: ["0000_initial", "0000_initial"],
    });

    const result = runChecker(cwd);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Duplicate journal tags: 0000_initial");
  }, processTestTimeout);

  it("does not accept a directory named like a versioned SQL file", async () => {
    const cwd = await createFixture({ files: [] });
    await mkdir(path.join(cwd, "migrations", "0000_initial.sql"));

    const result = runChecker(cwd);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Stale journal entries: 0000_initial");
  }, processTestTimeout);
});
