import 'dotenv/config';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const parsedUrl = new URL(process.env.DATABASE_URL);
console.log("DB target:", {
  protocol: parsedUrl.protocol,
  host: parsedUrl.hostname,
  port: parsedUrl.port || "default",
  database: parsedUrl.pathname.replace("/", "") || "default",
});

const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === "production" ? "require" : "prefer",
  max: 1,
  ...(process.env.DATABASE_URL.includes("pooler.supabase") || /:6543\b/.test(process.env.DATABASE_URL)
    ? { prepare: false as const }
    : {}),
});

sql.begin("read only", (tx) => tx`SELECT 1 as result`)
  .then(res => console.log("DB Success:", res))
  .catch(err => console.error("DB Error:", err))
  .finally(async () => {
    await sql.end({ timeout: 5 });
    process.exit();
  });
