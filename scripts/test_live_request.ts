/**
 * Test Live API Request: Simulates the frontend call to the backend
 * to capture the exact error from the API layer.
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function testLiveRequest() {
    const client = await pool.connect();
    try {
        console.log('🔍 PHASE 2: TRIANGULATION - Testing Live API Request\n');

        // 1. Get valid IDs
        const teamResult = await client.query('SELECT id FROM team LIMIT 1');
        const projectResult = await client.query('SELECT id FROM projects LIMIT 1');

        if (teamResult.rows.length === 0 || projectResult.rows.length === 0) {
            console.log('❌ No data found');
            return;
        }

        const payload = {
            teamId: teamResult.rows[0].id,
            projectId: projectResult.rows[0].id,
            hoursAllocated: 5
        };

        console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

        // 2. Make direct HTTP request to local server
        const response = await fetch('http://localhost:5000/api/team/assignments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        console.log('\n📥 Response status:', response.status);
        console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📥 Response body:', responseText);

        if (!response.ok) {
            console.log('\n❌ REQUEST FAILED');
            try {
                const errorJson = JSON.parse(responseText);
                console.log('Error details:', JSON.stringify(errorJson, null, 2));
            } catch {
                console.log('Raw error:', responseText);
            }
        } else {
            console.log('\n✅ REQUEST SUCCESSFUL');
        }

    } catch (error: any) {
        console.error('❌ Request error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

testLiveRequest();
