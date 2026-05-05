import 'dotenv/config';
import postgres from 'postgres';

console.log("URL:", process.env.DATABASE_URL);

const sql = postgres(process.env.DATABASE_URL as string);

sql`SELECT 1 as result`
  .then(res => console.log("DB Success:", res))
  .catch(err => console.error("DB Error:", err))
  .finally(() => process.exit());
