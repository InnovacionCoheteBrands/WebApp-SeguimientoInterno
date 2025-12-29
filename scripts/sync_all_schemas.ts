/**
 * 🛠️ Script de Sincronización Completa de Esquema
 * 
 * Este script inspecciona todas las tablas críticas y agrega
 * las columnas faltantes para asegurar compatibilidad con Drizzle schema
 */

import 'dotenv/config';
import postgres from 'postgres';

interface ColumnDef {
  name: string;
  type: string;
  default: string | null;
}

interface TableSyncConfig {
  table: string;
  columns: ColumnDef[];
}

const tableSyncConfigs: TableSyncConfig[] = [
  {
    table: 'team',
    columns: [
      { name: 'internal_cost_hour', type: 'NUMERIC', default: "'0'" },
      { name: 'billable_rate', type: 'NUMERIC', default: "'0'" },
      { name: 'monthly_salary', type: 'NUMERIC', default: "'0'" },
      { name: 'weekly_capacity', type: 'INTEGER', default: '40' },
      { name: 'role_catalog_id', type: 'INTEGER', default: null },
      { name: 'skills', type: 'TEXT', default: null },
    ]
  },
  {
    table: 'transactions',
    columns: [
      { name: 'rfc', type: 'TEXT', default: null },
      { name: 'invoice_number', type: 'TEXT', default: null },
      { name: 'provider', type: 'TEXT', default: null },
      { name: 'subtotal', type: 'NUMERIC(12,2)', default: null },
      { name: 'iva', type: 'NUMERIC(12,2)', default: null },
      { name: 'notes', type: 'TEXT', default: null },
      { name: 'is_paid', type: 'BOOLEAN', default: 'false' },
      { name: 'paid_date', type: 'TIMESTAMP', default: null },
      { name: 'client_id', type: 'INTEGER', default: null },
      { name: 'is_recurring_instance', type: 'BOOLEAN', default: 'false' },
      { name: 'recurring_template_id', type: 'INTEGER', default: null },
      { name: 'source', type: 'TEXT', default: null },
      { name: 'source_id', type: 'INTEGER', default: null },
      { name: 'updated_at', type: 'TIMESTAMP', default: 'NOW()' },
    ]
  },
  {
    table: 'recurring_transactions',
    columns: [
      { name: 'rfc', type: 'TEXT', default: null },
      { name: 'provider', type: 'TEXT', default: null },
      { name: 'subtotal', type: 'NUMERIC(12,2)', default: null },
      { name: 'iva', type: 'NUMERIC(12,2)', default: null },
      { name: 'notes', type: 'TEXT', default: null },
      { name: 'client_id', type: 'INTEGER', default: null },
      { name: 'updated_at', type: 'TIMESTAMP', default: 'NOW()' },
    ]
  },
  {
    table: 'projects',
    columns: [
      { name: 'budget', type: 'NUMERIC', default: "'0'" },
      { name: 'service_specific_fields', type: 'TEXT', default: null },
      { name: 'custom_fields', type: 'TEXT', default: null },
    ]
  },
  {
    table: 'project_deliverables',
    columns: [
      { name: 'due_date', type: 'TIMESTAMP', default: null },
      { name: 'requires_file', type: 'BOOLEAN', default: 'false' },
      { name: 'linked_attachment_id', type: 'INTEGER', default: null },
      { name: 'updated_at', type: 'TIMESTAMP', default: 'NOW()' },
    ]
  },
  {
    table: 'team_assignments',
    columns: [
      { name: 'project_id', type: 'INTEGER', default: null },
      { name: 'hours_allocated', type: 'INTEGER', default: '0' },
    ]
  },
  {
    table: 'client_accounts',
    columns: [
      { name: 'updated_at', type: 'TIMESTAMP', default: 'NOW()' },
    ]
  },
];

async function syncAllSchemas() {
  console.log('🔧 Iniciando sincronización completa de esquema...\n');
  console.log('═'.repeat(60) + '\n');

  if (!process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL no está configurada');
  }

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
  });

  let totalChanges = 0;

  try {
    for (const config of tableSyncConfigs) {
      console.log(`📋 Procesando tabla: ${config.table}`);
      
      // Verificar si la tabla existe
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = ${config.table}
        ) as exists
      `;

      if (!tableExists[0].exists) {
        console.log(`   ⚠️ Tabla "${config.table}" no existe. Saltando...\n`);
        continue;
      }

      // Obtener columnas actuales
      const currentColumns = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = ${config.table}
      `;

      const existingColumns = new Set(currentColumns.map(c => c.column_name));

      // Identificar columnas faltantes
      const missingColumns = config.columns.filter(col => !existingColumns.has(col.name));

      if (missingColumns.length === 0) {
        console.log(`   ✅ Todas las columnas requeridas ya existen\n`);
        continue;
      }

      console.log(`   ⚠️ Columnas faltantes: ${missingColumns.map(c => c.name).join(', ')}`);

      // Agregar columnas faltantes
      for (const col of missingColumns) {
        const defaultClause = col.default ? `DEFAULT ${col.default}` : '';
        const alterSQL = `ALTER TABLE ${config.table} ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} ${defaultClause}`;
        
        try {
          await sql.unsafe(alterSQL);
          console.log(`   ✅ Agregada: ${col.name}`);
          totalChanges++;
        } catch (err) {
          console.log(`   ❌ Error agregando ${col.name}: ${err instanceof Error ? err.message : err}`);
        }
      }
      console.log('');
    }

    console.log('═'.repeat(60));
    console.log(`\n✅ Sincronización completada. Total de cambios: ${totalChanges}\n`);

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Ejecutar
syncAllSchemas().catch(err => {
  console.error(err);
  process.exit(1);
});

