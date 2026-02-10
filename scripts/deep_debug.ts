/**
 * Deep Debug Script: Verify database schema and test raw insert
 * This will help us identify if the issue is schema, data, or code related.
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function deepDebug() {
    const client = await pool.connect();
    try {
        console.log('🔍 PHASE 1: RECURSIVE ANALYSIS - Database Schema Verification\n');

        // 1. Check projects table structure
        console.log('📊 1. Checking projects table structure...');
        const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `);
        console.log('Columns in projects:');
        schemaResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

        // 2. Check if level exists
        const hasLevel = schemaResult.rows.some(r => r.column_name === 'level');
        console.log(`\n✅ level column exists: ${hasLevel}`);

        // 4. Check foreign key constraints
        console.log('\n📊 2. Checking foreign key constraints...');
        const fkResult = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'team_assignments' AND tc.constraint_type = 'FOREIGN KEY';
    `);
        fkResult.rows.forEach(row => {
            console.log(`  - ${row.column_name} -> ${row.foreign_table_name}(${row.foreign_column_name})`);
        });

        // 5. Get sample data to use for test insert
        console.log('\n📊 3. Fetching sample IDs for test insert...');
        const teamResult = await client.query('SELECT id, first_name, last_name FROM team LIMIT 1');
        const projectResult = await client.query('SELECT id, name FROM projects LIMIT 1');

        if (teamResult.rows.length === 0) {
            console.log('❌ No team members found in database!');
            return;
        }
        if (projectResult.rows.length === 0) {
            console.log('❌ No projects found in database!');
            return;
        }

        const teamId = teamResult.rows[0].id;
        const projectId = projectResult.rows[0].id;
        console.log(`  Team member: ID=${teamId} (${teamResult.rows[0].first_name} ${teamResult.rows[0].last_name})`);
        console.log(`  Project: ID=${projectId} (${projectResult.rows[0].name})`);

        // 6. Attempt a raw insert
        console.log('\n📊 4. Attempting raw INSERT into team_assignments...');
        try {
            const insertResult = await client.query(`
        INSERT INTO team_assignments (team_id, project_id, hours_allocated)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [teamId, projectId, 5]);
            console.log('✅ INSERT SUCCESSFUL!');
            console.log('Result:', insertResult.rows[0]);

            // Clean up - delete the test record
            await client.query('DELETE FROM team_assignments WHERE id = $1', [insertResult.rows[0].id]);
            console.log('✅ Test record cleaned up.');
        } catch (insertError: any) {
            console.log('❌ INSERT FAILED!');
            console.log('Error:', insertError.message);
            console.log('Detail:', insertError.detail);
            console.log('Code:', insertError.code);
        }

        console.log('\n✅ PHASE 1 COMPLETE - Database analysis finished.');

    } catch (error) {
        console.error('❌ Debug script error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

deepDebug();
