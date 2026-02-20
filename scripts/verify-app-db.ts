import "dotenv/config";
import postgres from "postgres";

async function verifyAppDb() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set");
    }

    const sql = postgres(process.env.DATABASE_URL, {
        ssl: process.env.NODE_ENV === "production" ? "require" : "prefer",
        max: 1,
    });

    try {
        const rows = await sql<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM users`;
        const usersCount = rows[0]?.count ?? 0;

        console.log(`DB_OK users_count=${usersCount}`);
        if (usersCount < 1) {
            console.log("DB_WARNING users table has no rows");
        }
    } finally {
        await sql.end({ timeout: 5 });
    }
}

verifyAppDb().catch((error) => {
    console.error("DB_VERIFY_FAILED", error);
    process.exit(1);
});
