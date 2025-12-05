import 'dotenv/config';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🔄 Starting financial module schema migration...');

  try {
    // Part 1: Enhance transactions table
    console.log('📊 Enhancing transactions table...');

    await db.execute(sql`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false
    `);

    await db.execute(sql`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS paid_date TIMESTAMP
    `);

    await db.execute(sql`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES client_accounts(id) ON DELETE SET NULL
    `);

    await db.execute(sql`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS is_recurring_instance BOOLEAN NOT NULL DEFAULT false
    `);

    await db.execute(sql`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS recurring_template_id INTEGER REFERENCES recurring_transactions(id) ON DELETE SET NULL
    `);

    await db.execute(sql`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS source TEXT
    `);

    await db.execute(sql`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS source_id INTEGER
    `);

    // Part 2: Enhance recurring_transactions table
    console.log('🔁 Enhancing recurring_transactions table...');

    await db.execute(sql`
      ALTER TABLE recurring_transactions 
      ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES client_accounts(id) ON DELETE SET NULL
    `);

    // Part 3: Create indexes
    console.log('⚡ Creating performance indexes...');

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_transactions_is_paid ON transactions(is_paid)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_transactions_recurring_template_id ON transactions(recurring_template_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_transactions_date_paid ON transactions(date, is_paid)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source)`);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_recurring_transactions_client_id ON recurring_transactions(client_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active ON recurring_transactions(is_active)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_recurring_transactions_type ON recurring_transactions(type)`);

    // Part 4: Data migration
    console.log('📦 Migrating existing data...');

    await db.execute(sql`
      UPDATE transactions 
      SET is_paid = true, paid_date = date 
      WHERE status = 'Pagado' AND is_paid = false
    `);

    await db.execute(sql`
      UPDATE transactions 
      SET is_paid = false 
      WHERE status = 'Pendiente'
    `);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
