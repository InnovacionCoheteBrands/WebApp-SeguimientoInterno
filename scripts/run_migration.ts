/**
 * Migration Script: Add project_id and hours_allocated to team_assignments
 * Run with: npx tsx scripts/run_migration.ts
 */

import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🚀 Running migration: Add project_id and hours_allocated to team_assignments...');

        // Add project_id column
        await client.query(`
      ALTER TABLE team_assignments ADD COLUMN IF NOT EXISTS project_id integer;
    `);
        console.log('✅ Added project_id column');

        // Add hours_allocated column
        await client.query(`
      ALTER TABLE team_assignments ADD COLUMN IF NOT EXISTS hours_allocated integer DEFAULT 0;
    `);
        console.log('✅ Added hours_allocated column');

        // Make campaign_id nullable
        await client.query(`
      ALTER TABLE team_assignments ALTER COLUMN campaign_id DROP NOT NULL;
    `);
        console.log('✅ Made campaign_id nullable');

        // Add foreign key for project_id (may fail if already exists)
        try {
            await client.query(`
        ALTER TABLE team_assignments 
        ADD CONSTRAINT team_assignments_project_id_projects_id_fk 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE cascade;
      `);
            console.log('✅ Added foreign key constraint');
        } catch (err: any) {
            if (err.code === '42710') {
                console.log('ℹ️ Foreign key constraint already exists, skipping');
            } else {
                throw err;
            }
        }

        // 5. Add 'level' to projects
        console.log('🚀 Running migration: Add level column to projects...');
        await client.query(fs.readFileSync('migrations/0005_add_projects_level.sql', 'utf-8'));
        console.log('✅ Added level column to projects table');

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
