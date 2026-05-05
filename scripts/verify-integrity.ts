import "dotenv/config";
import postgres from "postgres";

type CheckResult = {
  key: string;
  severity: "critical" | "warning";
  count: number;
  description: string;
  recommendation: string;
};

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: process.env.NODE_ENV === "production" ? "require" : "prefer",
    max: 1,
  });

  try {
    const checks: CheckResult[] = [];

    const convertedLeadsWithoutClient = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM leads l
      LEFT JOIN client_accounts c ON c.id = l.converted_to_client_id
      WHERE l.converted_to_client_id IS NOT NULL
        AND c.id IS NULL
    `;
    checks.push({
      key: "converted_leads_without_client",
      severity: "critical",
      count: convertedLeadsWithoutClient[0]?.count ?? 0,
      description: "Leads convertidos apuntan a clientes inexistentes.",
      recommendation: "Corregir referencias y validar conversiones en transacción.",
    });

    const convertedLeadsWithoutPrimaryContact = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM leads l
      LEFT JOIN contacts ct
        ON ct.client_id = l.converted_to_client_id
       AND ct.is_primary = true
      WHERE l.converted_to_client_id IS NOT NULL
        AND ct.id IS NULL
    `;
    checks.push({
      key: "converted_leads_without_primary_contact",
      severity: "warning",
      count: convertedLeadsWithoutPrimaryContact[0]?.count ?? 0,
      description: "Clientes convertidos desde lead sin contacto principal.",
      recommendation: "Generar contacto primario en el flujo de conversión.",
    });

    const transactionsWithoutRecurringTemplate = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM transactions t
      LEFT JOIN recurring_transactions rt ON rt.id = t.recurring_template_id
      WHERE t.recurring_template_id IS NOT NULL
        AND rt.id IS NULL
    `;
    checks.push({
      key: "transactions_without_recurring_template",
      severity: "critical",
      count: transactionsWithoutRecurringTemplate[0]?.count ?? 0,
      description: "Transacciones recurrentes con plantilla faltante.",
      recommendation: "Limpiar huérfanos y reforzar borrado controlado.",
    });

    const nonPositiveTransactions = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM transactions
      WHERE CAST(amount AS numeric) <= 0
    `;
    checks.push({
      key: "non_positive_transactions",
      severity: "critical",
      count: nonPositiveTransactions[0]?.count ?? 0,
      description: "Transacciones con monto menor o igual a cero.",
      recommendation: "Bloquear valores no positivos en validación de entrada.",
    });

    const nonPositiveRecurring = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM recurring_transactions
      WHERE CAST(amount AS numeric) <= 0
    `;
    checks.push({
      key: "non_positive_recurring_transactions",
      severity: "critical",
      count: nonPositiveRecurring[0]?.count ?? 0,
      description: "Obligaciones recurrentes con monto menor o igual a cero.",
      recommendation: "Corregir plantillas y endurecer validación Zod.",
    });

    const orphanProjectServices = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM project_services ps
      LEFT JOIN projects p ON p.id = ps.project_id
      LEFT JOIN service_catalog s ON s.id = ps.service_id
      WHERE p.id IS NULL OR s.id IS NULL
    `;
    checks.push({
      key: "orphan_project_services",
      severity: "critical",
      count: orphanProjectServices[0]?.count ?? 0,
      description: "Asignaciones de servicios a proyecto con referencias inválidas.",
      recommendation: "Reparar filas huérfanas y revisar borrados en cascada.",
    });

    // Evaluation-only metrics to support soft-delete decisions (phase 10).
    const projectsWithFinancialLinks = await sql<{ count: number }[]>`
      SELECT COUNT(DISTINCT p.id)::int AS count
      FROM projects p
      JOIN transactions t ON t.project_id = p.id
    `;
    const clientsWithProjectLinks = await sql<{ count: number }[]>`
      SELECT COUNT(DISTINCT c.id)::int AS count
      FROM client_accounts c
      JOIN projects p ON p.client_id = c.id
    `;

    const criticalIssues = checks.filter((check) => check.severity === "critical" && check.count > 0);
    const warningIssues = checks.filter((check) => check.severity === "warning" && check.count > 0);

    console.log("VERIFY_INTEGRITY_REPORT_START");
    console.log(JSON.stringify({
      generatedAt: new Date().toISOString(),
      checks,
      softDeleteEvaluation: {
        projectsWithFinancialLinks: projectsWithFinancialLinks[0]?.count ?? 0,
        clientsWithProjectLinks: clientsWithProjectLinks[0]?.count ?? 0,
      },
      summary: {
        criticalIssueCount: criticalIssues.length,
        warningIssueCount: warningIssues.length,
      },
    }, null, 2));
    console.log("VERIFY_INTEGRITY_REPORT_END");

    if (criticalIssues.length > 0) {
      process.exit(1);
    }

    process.exit(0);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

run().catch((error) => {
  console.error("VERIFY_INTEGRITY_FAILED", error);
  process.exit(1);
});
