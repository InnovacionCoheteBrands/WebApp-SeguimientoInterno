/**
 * Migration Script: Add priority and services to leads table
 * Run with: npx tsx scripts/migrate_leads_crm.ts
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🚀 Running migration: Add priority and services to leads table...');

        // Add priority column with default 'Media'
        await client.query(`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'Media';
    `);
        console.log('✅ Added priority column (default: Media)');

        // Add services column (nullable text for JSON or semicolon-separated list)
        await client.query(`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS services text;
    `);
        console.log('✅ Added services column');

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
