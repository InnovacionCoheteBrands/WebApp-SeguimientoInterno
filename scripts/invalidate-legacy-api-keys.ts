import "dotenv/config";
import { db } from "../db";
import { users } from "../shared/schema";
import { sql } from "drizzle-orm";

type LegacyUserRow = {
  id: string;
  username: string;
  email: string | null;
};

const EXECUTE_FLAG = "--execute";

async function main() {
  const shouldExecute = process.argv.includes(EXECUTE_FLAG);

  const [legacyCountRow] = await db
    .select({
      count: sql<string>`count(*)`,
    })
    .from(users)
    .where(sql`${users.apiKey} is not null and ${users.apiKey} <> '' and ${users.apiKey} not like 'sha256:%'`);

  const legacyCount = Number(legacyCountRow?.count ?? 0);

  const affectedUsers = (await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
    })
    .from(users)
    .where(sql`${users.apiKey} is not null and ${users.apiKey} <> '' and ${users.apiKey} not like 'sha256:%'`)) as LegacyUserRow[];

  console.log(`[legacy-api-keys] Legacy keys detected: ${legacyCount}`);

  if (affectedUsers.length > 0) {
    console.log("[legacy-api-keys] Affected users (safe fields only):");
    for (const row of affectedUsers) {
      console.log(`- id=${row.id} username=${row.username} email=${row.email ?? "null"}`);
    }
  }

  if (!shouldExecute) {
    console.log(`[legacy-api-keys] Dry run only. Use ${EXECUTE_FLAG} to invalidate legacy plaintext keys.`);
    return;
  }

  const updateResult = await db
    .update(users)
    .set({ apiKey: null })
    .where(sql`${users.apiKey} is not null and ${users.apiKey} <> '' and ${users.apiKey} not like 'sha256:%'`);

  console.log("[legacy-api-keys] Invalidation completed.");
  console.log(`[legacy-api-keys] Update command result: ${JSON.stringify(updateResult)}`);
}

main().catch((error) => {
  console.error("[legacy-api-keys] Failed.");
  console.error(error);
  process.exit(1);
});
