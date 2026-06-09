import "dotenv/config";
import postgres from "postgres";

const EXECUTE_FLAG = "--execute";
const EXPECTED_SYSTEM_METRICS_FLAG = "--expected-system-metrics";
const EXPECTED_TELEMETRY_DATA_FLAG = "--expected-telemetry-data";

type ArtifactCounts = {
  systemMetrics: number;
  telemetryData: number;
  total: number;
};

type CleanupResult = {
  generatedAt: string;
  mode: "dry-run" | "execute";
  targetTables: readonly ["public.system_metrics", "public.telemetry_data"];
  beforeCounts: ArtifactCounts;
  expectedCounts: Omit<ArtifactCounts, "total"> | null;
  deletedCounts: ArtifactCounts | null;
  afterCounts: ArtifactCounts;
  noSecretsPrinted: true;
};

function isPoolerUrl(databaseUrl: string): boolean {
  return databaseUrl.includes("pooler.supabase") || /:6543\b/.test(databaseUrl);
}

function parseExpectedCount(flagName: string): number | null {
  const inlinePrefix = `${flagName}=`;
  const inlineArg = process.argv.find((arg) => arg.startsWith(inlinePrefix));
  const separatedFlagIndex = process.argv.indexOf(flagName);
  const rawValue = inlineArg
    ? inlineArg.slice(inlinePrefix.length)
    : separatedFlagIndex >= 0
      ? process.argv[separatedFlagIndex + 1]
      : null;

  if (!rawValue || rawValue.startsWith("--")) {
    return null;
  }

  const parsedValue = Number(rawValue);
  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`${flagName} must be a non-negative integer`);
  }

  return parsedValue;
}

function assertExpectedCounts(beforeCounts: ArtifactCounts, expectedCounts: Omit<ArtifactCounts, "total"> | null) {
  if (!expectedCounts) {
    throw new Error(
      `Execute mode requires ${EXPECTED_SYSTEM_METRICS_FLAG}=<count> and ${EXPECTED_TELEMETRY_DATA_FLAG}=<count>`,
    );
  }

  if (
    beforeCounts.systemMetrics !== expectedCounts.systemMetrics ||
    beforeCounts.telemetryData !== expectedCounts.telemetryData
  ) {
    throw new Error(
      [
        "Current artifact counts do not match the approved cleanup counts.",
        `Expected system_metrics=${expectedCounts.systemMetrics}, telemetry_data=${expectedCounts.telemetryData}.`,
        `Found system_metrics=${beforeCounts.systemMetrics}, telemetry_data=${beforeCounts.telemetryData}.`,
        "No rows were deleted.",
      ].join(" "),
    );
  }
}

async function readCounts(sql: postgres.Sql): Promise<ArtifactCounts> {
  const [systemMetricsRow] = await sql`
    select count(*)::int as count
    from public.system_metrics
  `;
  const [telemetryDataRow] = await sql`
    select count(*)::int as count
    from public.telemetry_data
  `;

  const systemMetrics = Number(systemMetricsRow?.count ?? 0);
  const telemetryData = Number(telemetryDataRow?.count ?? 0);

  return {
    systemMetrics,
    telemetryData,
    total: systemMetrics + telemetryData,
  };
}

async function deleteArtifacts(sql: postgres.Sql): Promise<ArtifactCounts> {
  const [systemMetricsRow] = await sql`
    with deleted as (
      delete from public.system_metrics
      returning 1
    )
    select count(*)::int as count
    from deleted
  `;
  const [telemetryDataRow] = await sql`
    with deleted as (
      delete from public.telemetry_data
      returning 1
    )
    select count(*)::int as count
    from deleted
  `;

  const systemMetrics = Number(systemMetricsRow?.count ?? 0);
  const telemetryData = Number(telemetryDataRow?.count ?? 0);

  return {
    systemMetrics,
    telemetryData,
    total: systemMetrics + telemetryData,
  };
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const shouldExecute = process.argv.includes(EXECUTE_FLAG);
  const expectedSystemMetrics = parseExpectedCount(EXPECTED_SYSTEM_METRICS_FLAG);
  const expectedTelemetryData = parseExpectedCount(EXPECTED_TELEMETRY_DATA_FLAG);
  const expectedCounts =
    expectedSystemMetrics === null || expectedTelemetryData === null
      ? null
      : {
          systemMetrics: expectedSystemMetrics,
          telemetryData: expectedTelemetryData,
        };

  const client = postgres(databaseUrl, {
    ssl: process.env.NODE_ENV === "production" ? "require" : "prefer",
    max: 1,
    ...(isPoolerUrl(databaseUrl) ? { prepare: false as const } : {}),
  });

  try {
    const result = shouldExecute
      ? await client.begin("read write", async (sql) => {
          const beforeCounts = await readCounts(sql);
          assertExpectedCounts(beforeCounts, expectedCounts);
          const deletedCounts = await deleteArtifacts(sql);
          const afterCounts = await readCounts(sql);

          return {
            generatedAt: new Date().toISOString(),
            mode: "execute" as const,
            targetTables: ["public.system_metrics", "public.telemetry_data"] as const,
            beforeCounts,
            expectedCounts,
            deletedCounts,
            afterCounts,
            noSecretsPrinted: true as const,
          };
        })
      : await client.begin("read only", async (sql) => {
          const beforeCounts = await readCounts(sql);

          return {
            generatedAt: new Date().toISOString(),
            mode: "dry-run" as const,
            targetTables: ["public.system_metrics", "public.telemetry_data"] as const,
            beforeCounts,
            expectedCounts,
            deletedCounts: null,
            afterCounts: beforeCounts,
            noSecretsPrinted: true as const,
          };
        });

    console.log("HEALTHCHECK_ARTIFACT_CLEANUP_START");
    console.log(JSON.stringify(result satisfies CleanupResult, null, 2));
    console.log("HEALTHCHECK_ARTIFACT_CLEANUP_END");

    if (!shouldExecute) {
      console.log(
        `Dry run only. Use ${EXECUTE_FLAG} with ${EXPECTED_SYSTEM_METRICS_FLAG}=<count> and ${EXPECTED_TELEMETRY_DATA_FLAG}=<count> after approval.`,
      );
    }
  } finally {
    await client.end({ timeout: 5 });
  }
}

run().catch((error) => {
  console.error("HEALTHCHECK_ARTIFACT_CLEANUP_FAILED", {
    name: error?.name,
    code: error?.code,
    message: error?.message,
  });
  process.exit(1);
});
