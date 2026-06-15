import fs from "node:fs/promises";
import path from "node:path";

/**
 * Hallazgo 3.1 (drift de migraciones) - guardia declarativa de repositorio.
 *
 * Important:
 * - This check only reconciles journal metadata against versioned SQL files in git.
 * - It does NOT validate applied migrations in the real database.
 * - Real DB validation with read-only credentials remains a release prerequisite.
 */

type JournalEntry = {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
};

type Journal = {
  version: string;
  dialect: string;
  entries: JournalEntry[];
};

function isVersionedMigrationFile(fileName: string): boolean {
  return /^\d{4}_.+\.sql$/i.test(fileName);
}

function toTag(fileName: string): string {
  return fileName.replace(/\.sql$/i, "");
}

async function main() {
  const projectRoot = process.cwd();
  const migrationsDir = path.join(projectRoot, "migrations");
  const journalPath = path.join(migrationsDir, "meta", "_journal.json");

  const [filesRaw, journalRaw] = await Promise.all([
    fs.readdir(migrationsDir, { withFileTypes: true }),
    fs.readFile(journalPath, "utf8"),
  ]);

  const versionedSqlCandidates = filesRaw.filter((entry) =>
    isVersionedMigrationFile(entry.name)
  );
  const resolvedVersionedSqlFiles = await Promise.all(
    versionedSqlCandidates.map(async (entry) => {
      const filePath = path.join(migrationsDir, entry.name);
      const stats = await fs.stat(filePath);
      return stats.isFile() ? entry.name : null;
    }),
  );
  const versionedSqlFiles = resolvedVersionedSqlFiles
    .filter((fileName): fileName is string => fileName !== null)
    .sort((a, b) => a.localeCompare(b));
  const nonVersionedSqlFiles = filesRaw
    .map((entry) => entry.name)
    .filter((name) => name.toLowerCase().endsWith(".sql") && !isVersionedMigrationFile(name))
    .sort((a, b) => a.localeCompare(b));

  const journal = JSON.parse(journalRaw) as Journal;
  if (!Array.isArray(journal.entries)) {
    throw new Error("Invalid migrations journal: entries must be an array.");
  }

  const journalTags = journal.entries.map((entry) => entry.tag);
  const journalTagSet = new Set(journalTags);
  const versionedFileTags = versionedSqlFiles.map(toTag);
  const versionedFileTagSet = new Set(versionedFileTags);

  const missingInJournal = versionedFileTags.filter((tag) => !journalTagSet.has(tag));
  const staleInJournal = journalTags.filter(
    (tag) => /^\d{4}_.+/i.test(tag) && !versionedFileTagSet.has(tag),
  );
  const duplicateJournalTags = journalTags.filter(
    (tag, index) => journalTags.indexOf(tag) !== index,
  );

  // Non-versioned SQL files (e.g. manual/ad-hoc reference scripts) are intentionally excluded.
  // We only enforce journal parity for canonical versioned migrations: `000X_name.sql`.
  if (nonVersionedSqlFiles.length > 0) {
    console.log(
      `[migration-journal-check] Non-versioned SQL files (ignored by this check): ${nonVersionedSqlFiles.join(", ")}`,
    );
  }

  if (
    missingInJournal.length > 0
    || staleInJournal.length > 0
    || duplicateJournalTags.length > 0
  ) {
    console.error("[migration-journal-check] Migration journal mismatch detected.");

    if (missingInJournal.length > 0) {
      console.error(`[migration-journal-check] Missing in journal: ${missingInJournal.join(", ")}`);
    }

    if (staleInJournal.length > 0) {
      console.error(`[migration-journal-check] Stale journal entries: ${staleInJournal.join(", ")}`);
    }

    if (duplicateJournalTags.length > 0) {
      console.error(
        `[migration-journal-check] Duplicate journal tags: ${Array.from(new Set(duplicateJournalTags)).join(", ")}`,
      );
    }

    process.exit(1);
  }

  console.log(
    `[migration-journal-check] OK. Versioned SQL files=${versionedSqlFiles.length}, journal entries=${journal.entries.length}.`,
  );
}

main().catch((error) => {
  console.error("[migration-journal-check] Failed.");
  console.error(error);
  process.exit(1);
});
