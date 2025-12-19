/**
 * Migration script to add file requirement columns to project_deliverables table
 * 
 * Run with: npx tsx scripts/add-deliverable-file-columns.ts
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('🔄 Starting migration: Adding file requirement columns to project_deliverables...');

  try {
    // Check if columns already exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_deliverables' 
      AND column_name IN ('requires_file', 'linked_attachment_id')
    `);

    const existingColumns = checkResult.rows.map(row => row.column_name);
    
    // Add requires_file column if it doesn't exist
    if (!existingColumns.includes('requires_file')) {
      console.log('  📝 Adding requires_file column...');
      await pool.query(`
        ALTER TABLE project_deliverables 
        ADD COLUMN requires_file BOOLEAN NOT NULL DEFAULT false
      `);
      console.log('  ✅ requires_file column added');
    } else {
      console.log('  ⏭️ requires_file column already exists, skipping');
    }

    // Add linked_attachment_id column if it doesn't exist
    if (!existingColumns.includes('linked_attachment_id')) {
      console.log('  📝 Adding linked_attachment_id column...');
      await pool.query(`
        ALTER TABLE project_deliverables 
        ADD COLUMN linked_attachment_id INTEGER 
        REFERENCES project_attachments(id) ON DELETE SET NULL
      `);
      console.log('  ✅ linked_attachment_id column added');
    } else {
      console.log('  ⏭️ linked_attachment_id column already exists, skipping');
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});
