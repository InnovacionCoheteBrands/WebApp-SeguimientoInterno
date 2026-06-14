import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

type PublicObject = {
  tableName: string;
  relkind: string;
  estimatedRows: number;
  rlsEnabled: boolean;
  rlsForced: boolean;
};

function isPoolerUrl(databaseUrl: string): boolean {
  return databaseUrl.includes("pooler.supabase") || /:6543\b/.test(databaseUrl);
}

async function getExpectedTables(): Promise<string[]> {
  const schemaPath = path.join(process.cwd(), "shared", "schema.ts");
  const schemaSource = await fs.readFile(schemaPath, "utf8");
  return Array.from(schemaSource.matchAll(/pgTable\("([^"]+)"/g))
    .map((match) => match[1])
    .sort((a, b) => a.localeCompare(b));
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const expectedTables = await getExpectedTables();
  const client = postgres(databaseUrl, {
    ssl: process.env.NODE_ENV === "production" ? "require" : "prefer",
    max: 1,
    ...(isPoolerUrl(databaseUrl) ? { prepare: false as const } : {}),
  });

  try {
    const report = await client.begin("read only", async (sql) => {
      const [server] = await sql`
        select
          current_database() as database_name,
          version() as version,
          current_setting('server_version_num') as server_version_num,
          current_setting('transaction_read_only') as transaction_read_only,
          to_regprocedure('gen_random_uuid()') is not null as has_gen_random_uuid
      `;

      const extensions = await sql`
        select extname, extversion
        from pg_extension
        order by extname
      `;

      const publicObjects = (await sql`
        select
          c.relname as "tableName",
          c.relkind::text as relkind,
          greatest(c.reltuples, 0)::bigint as "estimatedRows",
          c.relrowsecurity as "rlsEnabled",
          c.relforcerowsecurity as "rlsForced"
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relkind in ('r', 'p', 'v', 'm')
        order by c.relkind, c.relname
      `) as PublicObject[];

      const publicTables = publicObjects
        .filter((object) => object.relkind === "r" || object.relkind === "p")
        .map((object) => object.tableName)
        .sort((a, b) => a.localeCompare(b));

      const columns = await sql`
        select table_name, count(*)::int as column_count
        from information_schema.columns
        where table_schema = 'public'
        group by table_name
        order by table_name
      `;

      const constraints = await sql`
        select table_name, constraint_type, count(*)::int as count
        from information_schema.table_constraints
        where table_schema = 'public'
        group by table_name, constraint_type
        order by table_name, constraint_type
      `;

      const indexes = await sql`
        select tablename as table_name, count(*)::int as index_count
        from pg_indexes
        where schemaname = 'public'
        group by tablename
        order by tablename
      `;

      const policies = await sql`
        select schemaname, tablename, policyname, permissive, roles, cmd
        from pg_policies
        where schemaname = 'public'
        order by tablename, policyname
      `;

      const exposedGrants = await sql`
        select table_name, grantee, privilege_type
        from information_schema.role_table_grants
        where table_schema = 'public'
          and grantee in ('anon', 'authenticated', 'service_role')
        order by table_name, grantee, privilege_type
      `;

      const [refreshTokensTable] = await sql`
        select to_regclass('public.refresh_tokens') is not null as exists
      `;

      let legacyPlaintextRefreshTokenCount: number | null = null;
      if (refreshTokensTable?.exists) {
        const [legacyRefreshTokens] = await sql`
          select count(*)::int as count
          from refresh_tokens
          where revoked = false
            and length(token_hash) <> 64
        `;
        legacyPlaintextRefreshTokenCount = legacyRefreshTokens?.count ?? 0;
      }

      const missingTables = expectedTables.filter((table) => !publicTables.includes(table));
      const extraTables = publicTables.filter((table) => !expectedTables.includes(table));
      const rlsDisabledTables = publicObjects
        .filter((object) => (object.relkind === "r" || object.relkind === "p") && !object.rlsEnabled)
        .map((object) => object.tableName)
        .sort((a, b) => a.localeCompare(b));

      return {
        generatedAt: new Date().toISOString(),
        server,
        expectedTables,
        publicTables,
        summary: {
          expectedTableCount: expectedTables.length,
          actualPublicTableCount: publicTables.length,
          missingTableCount: missingTables.length,
          extraTableCount: extraTables.length,
          rlsDisabledTableCount: rlsDisabledTables.length,
          policyCount: policies.length,
          exposedGrantCount: exposedGrants.length,
          legacyPlaintextRefreshTokenCount,
        },
        differences: {
          missingTables,
          extraTables,
          rlsDisabledTables,
        },
        metadata: {
          extensions,
          publicObjects,
          columns,
          constraints,
          indexes,
          policies,
          exposedGrants,
        },
      };
    });

    console.log("DB_READONLY_AUDIT_START");
    console.log(JSON.stringify(report, null, 2));
    console.log("DB_READONLY_AUDIT_END");
  } finally {
    await client.end({ timeout: 5 });
  }
}

run().catch((error) => {
  console.error("DB_READONLY_AUDIT_FAILED", {
    name: error?.name,
    code: error?.code,
    message: error?.message,
    hostname: error?.hostname,
  });
  process.exit(1);
});
