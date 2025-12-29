/**
 * 🛠️ Script de Sincronización de Esquema - Tabla Team
 * 
 * Este script inspecciona la estructura actual de la tabla "team" en PostgreSQL
 * y agrega las columnas faltantes definidas en shared/schema.ts
 * 
 * Columnas esperadas:
 * - internal_cost_hour (numeric)
 * - billable_rate (numeric)
 * - monthly_salary (numeric)
 * - weekly_capacity (integer)
 * - role_catalog_id (integer)
 * - skills (text)
 */

import 'dotenv/config';
import postgres from 'postgres';

async function syncTeamSchema() {
  console.log('🔧 Iniciando sincronización de esquema para tabla "team"...\n');

  if (!process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL no está configurada');
  }

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
  });

  try {
    // 1. Inspeccionar columnas actuales
    console.log('📋 Columnas actuales en tabla "team":');
    const currentColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'team'
      ORDER BY ordinal_position
    `;

    const existingColumns = new Set(currentColumns.map(c => c.column_name));
    console.log('   ' + Array.from(existingColumns).join(', ') + '\n');

    // 2. Definir columnas que deben existir
    const requiredColumns = [
      { name: 'internal_cost_hour', type: 'NUMERIC', default: "'0'" },
      { name: 'billable_rate', type: 'NUMERIC', default: "'0'" },
      { name: 'monthly_salary', type: 'NUMERIC', default: "'0'" },
      { name: 'weekly_capacity', type: 'INTEGER', default: '40' },
      { name: 'role_catalog_id', type: 'INTEGER', default: null },
      { name: 'skills', type: 'TEXT', default: null },
    ];

    // 3. Identificar columnas faltantes
    const missingColumns = requiredColumns.filter(col => !existingColumns.has(col.name));

    if (missingColumns.length === 0) {
      console.log('✅ Todas las columnas requeridas ya existen. No se requieren cambios.\n');
    } else {
      console.log('⚠️ Columnas faltantes encontradas:');
      missingColumns.forEach(col => console.log(`   - ${col.name} (${col.type})`));
      console.log('');

      // 4. Agregar columnas faltantes
      for (const col of missingColumns) {
        const defaultClause = col.default ? `DEFAULT ${col.default}` : '';
        const alterSQL = `ALTER TABLE team ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} ${defaultClause}`;
        
        console.log(`📝 Ejecutando: ${alterSQL}`);
        await sql.unsafe(alterSQL);
        console.log(`   ✅ Columna "${col.name}" agregada exitosamente`);
      }
      console.log('');
    }

    // 5. Verificar estructura final
    console.log('📋 Estructura final de tabla "team":');
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'team'
      ORDER BY ordinal_position
    `;

    finalColumns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    console.log('\n✅ Sincronización completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Ejecutar
syncTeamSchema().catch(err => {
  console.error(err);
  process.exit(1);
});

