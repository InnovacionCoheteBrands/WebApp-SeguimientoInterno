import 'dotenv/config';
import postgres from 'postgres';

async function testTeamInsert() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL not set');
    }

    const client = postgres(connectionString, { max: 1 });

    console.log('🧪 Testing team insert with new schema...\n');

    try {
        // Test insert with new personnel-focused fields
        const result = await client`
      INSERT INTO team (first_name, last_name, email, phone, payroll_type, employee_status, name, role, department)
      VALUES ('Test', 'Usuario', 'test@example.com', '555-1234', 'Fija', 'Activo', 'Test Usuario', '', 'Junior')
      RETURNING id, first_name, last_name, email
    `;

        console.log('✅ Insert successful!');
        console.log('   Inserted record:', result[0]);

        // Clean up test record
        await client`DELETE FROM team WHERE id = ${result[0].id}`;
        console.log('🧹 Test record cleaned up');

    } catch (err: any) {
        console.error('❌ Insert failed:', err.message);
        throw err;
    } finally {
        await client.end();
    }
}

testTeamInsert().catch(console.error);
