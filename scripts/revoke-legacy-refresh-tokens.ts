import "dotenv/config";
import postgres from "postgres";

const EXECUTE_FLAG = "--execute";
const shouldExecute = process.argv.includes(EXECUTE_FLAG);

function isPoolerUrl(databaseUrl: string): boolean {
  return databaseUrl.includes("pooler.supabase") || /:6543\b/.test(databaseUrl);
}

async function countLegacyRefreshTokens(sql: postgres.Sql): Promise<number> {
  const [legacyCountRow] = await sql`
    select count(*)::int as count
    from public.refresh_tokens
    where revoked = false
      and length(token_hash) <> 64
  `;

  return Number(legacyCountRow?.count ?? 0);
}

async function revokeLegacyRefreshTokens(sql: postgres.Sql): Promise<number> {
  const [revokedCountRow] = await sql`
    with revoked_tokens as (
      update public.refresh_tokens
      set revoked = true
      where revoked = false
        and length(token_hash) <> 64
      returning 1
    )
    select count(*)::int as count
    from revoked_tokens
  `;

  return Number(revokedCountRow?.count ?? 0);
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(databaseUrl, {
    ssl: process.env.NODE_ENV === "production" ? "require" : "prefer",
    max: 1,
    ...(isPoolerUrl(databaseUrl) ? { prepare: false as const } : {}),
  });

  try {
    if (!shouldExecute) {
      const legacyCount = await client.begin("read only", countLegacyRefreshTokens);
      console.log(`[legacy-refresh-tokens] Active plaintext legacy tokens detected: ${legacyCount}`);
      console.log(`[legacy-refresh-tokens] Dry run only. Use ${EXECUTE_FLAG} to revoke legacy plaintext refresh tokens.`);
      return;
    }

    const revokedCount = await client.begin("read write", revokeLegacyRefreshTokens);
    console.log(`[legacy-refresh-tokens] Revoked tokens: ${revokedCount}`);
  } finally {
    await client.end({ timeout: 5 });
  }
}

run().catch((error) => {
  console.error("[legacy-refresh-tokens] Failed.");
  console.error({
    name: error?.name,
    code: error?.code,
    message: error?.message,
  });
  process.exit(1);
});
