import "dotenv/config";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}
const requiredDatabaseUrl = databaseUrl;

async function main() {
  const client = postgres(requiredDatabaseUrl, {
    max: 1,
    ...(requiredDatabaseUrl.includes("pooler.supabase") || requiredDatabaseUrl.includes(":6543/")
      ? { prepare: false }
      : {}),
  });

  try {
    const report = await client.begin("read only", async (sql) => {
      const [admin] = await sql`
      select
          id,
          username,
          role,
          password like '$2%' as password_hashed
        from public.users
        where lower(username) = lower('Admin2')
        limit 1
      `;

      const [activeRefreshTokens] = admin
        ? await sql`
            select count(*)::int as count
            from public.refresh_tokens
            where user_id = ${admin.id}
              and revoked = false
              and expires_at > now()
          `
        : [{ count: 0 }];

      const recentLoginEvents = await sql`
        select action, timestamp
        from public.audit_logs
        where lower(username) = lower('Admin2')
          and action = 'LOGIN'
        order by timestamp desc
        limit 3
      `;

      const businessCounts = await sql`
        select 'client_accounts' as entity, count(*)::int as count from public.client_accounts
        union all select 'projects', count(*)::int from public.projects
        union all select 'transactions', count(*)::int from public.transactions
        union all select 'installments', count(*)::int from public.installments
        union all select 'recurring_transactions', count(*)::int from public.recurring_transactions
        union all select 'leads', count(*)::int from public.leads
        union all select 'team_assignments', count(*)::int from public.team_assignments
        order by entity
      `;

      return {
        generatedAt: new Date().toISOString(),
        transactionReadOnly: true,
        admin: admin
          ? {
              username: admin.username,
              role: admin.role,
              password_hashed: admin.password_hashed,
              activeRefreshTokenCount: activeRefreshTokens.count,
              recentLoginEvents,
            }
          : null,
        businessCounts,
      };
    });

    console.log("AUTH_REMEDIATION_AUDIT_START");
    console.log(JSON.stringify(report, null, 2));
    console.log("AUTH_REMEDIATION_AUDIT_END");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("AUTH_REMEDIATION_AUDIT_FAILED", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Unknown error",
  });
  process.exit(1);
});
