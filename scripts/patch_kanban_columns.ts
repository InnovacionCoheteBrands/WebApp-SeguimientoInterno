
import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function run() {
    console.log("🛠️ Patching 'projects' table columns...");
    try {
        // deal_type
        await db.execute(sql`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='deal_type') THEN 
                    ALTER TABLE projects ADD COLUMN deal_type text NOT NULL DEFAULT 'Proyecto'; 
                    RAISE NOTICE 'Added deal_type';
                END IF;
            END $$;
        `);

        // total_amount
        await db.execute(sql`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='total_amount') THEN 
                    ALTER TABLE projects ADD COLUMN total_amount numeric(12, 2); 
                    RAISE NOTICE 'Added total_amount';
                END IF;
            END $$;
        `);

        // number_of_payments
        await db.execute(sql`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='number_of_payments') THEN 
                    ALTER TABLE projects ADD COLUMN number_of_payments integer DEFAULT 1; 
                    RAISE NOTICE 'Added number_of_payments';
                END IF;
            END $$;
        `);

        // payment_frequency
        await db.execute(sql`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='payment_frequency') THEN 
                    ALTER TABLE projects ADD COLUMN payment_frequency text; 
                    RAISE NOTICE 'Added payment_frequency';
                END IF;
            END $$;
        `);

        // billing_day
        await db.execute(sql`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='billing_day') THEN 
                    ALTER TABLE projects ADD COLUMN billing_day integer; 
                    RAISE NOTICE 'Added billing_day';
                END IF;
            END $$;
        `);

        // expected_payment_day
        await db.execute(sql`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='expected_payment_day') THEN 
                    ALTER TABLE projects ADD COLUMN expected_payment_day integer; 
                    RAISE NOTICE 'Added expected_payment_day';
                END IF;
            END $$;
        `);

        // assigned_seller_id
        await db.execute(sql`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='assigned_seller_id') THEN 
                    ALTER TABLE projects ADD COLUMN assigned_seller_id integer; 
                    RAISE NOTICE 'Added assigned_seller_id';
                END IF;
            END $$;
        `);

        // contract_url
        await db.execute(sql`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='contract_url') THEN 
                    ALTER TABLE projects ADD COLUMN contract_url text; 
                    RAISE NOTICE 'Added contract_url';
                END IF;
            END $$;
        `);

        console.log("✅ Successfully patched 'projects' table.");

    } catch (error) {
        console.error("❌ Error patching database:", error);
    }
    process.exit(0);
}

run();
