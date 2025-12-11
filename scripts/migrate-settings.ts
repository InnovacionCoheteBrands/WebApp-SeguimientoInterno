
import 'dotenv/config';
import { db } from "../db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Running manual migration for settings...");

    try {
        // Add settings column
        await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'settings') THEN
              ALTER TABLE "users" ADD COLUMN "settings" text DEFAULT '{}';
              RAISE NOTICE 'Added settings column';
          END IF;
      END $$;
    `);

        // Add api_key column
        await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'api_key') THEN
              ALTER TABLE "users" ADD COLUMN "api_key" text;
              RAISE NOTICE 'Added api_key column';
          END IF;
      END $$;
    `);

        // Add webhook_url column
        await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'webhook_url') THEN
              ALTER TABLE "users" ADD COLUMN "webhook_url" text;
              RAISE NOTICE 'Added webhook_url column';
          END IF;
      END $$;
    `);

        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

main();
