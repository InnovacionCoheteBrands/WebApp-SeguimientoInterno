import 'dotenv/config';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

/**
 * Migration Script: Legacy Financial Data to New Schema
 * 
 * This script migrates financial data from the legacy system to the new schema:
 * 1. Syncs `status` field with `isPaid` and `paidDate`
 * 2. Attempts to link `relatedClient` (text) to `client_id` (FK)
 * 3. Reports unmatched records for manual review
 */

interface MigrationStats {
  totalTransactions: number;
  statusSynced: number;
  clientsLinked: number;
  clientsUnmatched: number;
  unmatchedClients: string[];
}

async function migrateLegacyData() {
  console.log('🔄 Starting legacy financial data migration...\n');

  const stats: MigrationStats = {
    totalTransactions: 0,
    statusSynced: 0,
    clientsLinked: 0,
    clientsUnmatched: 0,
    unmatchedClients: [],
  };

  try {
    // ============================================
    // STEP 1: Get total count
    // ============================================
    console.log('📊 Step 1: Analyzing existing data...');

    const countResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM transactions
    `);
    stats.totalTransactions = parseInt(countResult[0]?.count?.toString() || '0');
    console.log(`   Total transactions: ${stats.totalTransactions}`);

    // ============================================
    // STEP 2: Sync status → isPaid/paidDate
    // ============================================
    console.log('\n📝 Step 2: Syncing status → isPaid/paidDate...');

    // Sync "Pagado" → isPaid=true
    const paidResult = await db.execute(sql`
      UPDATE transactions 
      SET 
        is_paid = true,
        paid_date = COALESCE(paid_date, date)
      WHERE status = 'Pagado' AND is_paid = false
      RETURNING id
    `);
    const paidCount = paidResult.length;

    // Sync "Pendiente" → isPaid=false
    const pendingResult = await db.execute(sql`
      UPDATE transactions 
      SET 
        is_paid = false,
        paid_date = NULL
      WHERE status = 'Pendiente' AND is_paid = true
      RETURNING id
    `);
    const pendingCount = pendingResult.length;

    stats.statusSynced = paidCount + pendingCount;
    console.log(`   ✅ Synced ${paidCount} paid transactions`);
    console.log(`   ✅ Synced ${pendingCount} pending transactions`);
    console.log(`   Total synced: ${stats.statusSynced}`);

    // ============================================
    // STEP 3: Link related_client → client_id
    // ============================================
    console.log('\n🔗 Step 3: Linking related_client → client_id...');

    // Attempt case-insensitive matching by company name
    const linkedResult = await db.execute(sql`
      UPDATE transactions t
      SET client_id = c.id
      FROM client_accounts c
      WHERE 
        t.related_client IS NOT NULL 
        AND TRIM(t.related_client) != ''
        AND t.client_id IS NULL
        AND LOWER(TRIM(t.related_client)) = LOWER(TRIM(c.company_name))
      RETURNING t.id
    `);

    stats.clientsLinked = linkedResult.length;
    console.log(`   ✅ Linked ${stats.clientsLinked} transactions to client accounts`);

    // ============================================
    // STEP 4: Report unmatched clients
    // ============================================
    console.log('\n📋 Step 4: Identifying unmatched clients...');

    const unmatchedResult = await db.execute(sql`
      SELECT DISTINCT TRIM(related_client) as client_name
      FROM transactions 
      WHERE 
        related_client IS NOT NULL 
        AND TRIM(related_client) != ''
        AND client_id IS NULL
      ORDER BY TRIM(related_client)
    `);

    stats.clientsUnmatched = unmatchedResult.length;
    stats.unmatchedClients = unmatchedResult.map((row) => row.client_name as string);

    if (stats.clientsUnmatched > 0) {
      console.log(`   ⚠️  Found ${stats.clientsUnmatched} unmatched client names:`);
      stats.unmatchedClients.forEach((name, idx) => {
        console.log(`      ${idx + 1}. "${name}"`);
      });
      console.log('\n   💡 These need manual review:');
      console.log('      - Check if client exists with different name');
      console.log('      - Create new client account if needed');
      console.log('      - Or update transactions manually\n');
    } else {
      console.log(`   ✅ All clients successfully linked!`);
    }

    // ============================================
    // STEP 5: Verify data integrity
    // ============================================
    console.log('\n🔍 Step 5: Verifying data integrity...');

    // Check for inconsistencies
    const inconsistentResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM transactions
      WHERE 
        (status = 'Pagado' AND is_paid = false)
        OR (status = 'Pendiente' AND is_paid = true)
    `);
    const inconsistentCount = parseInt(inconsistentResult[0]?.count?.toString() || '0');

    if (inconsistentCount > 0) {
      console.log(`   ⚠️  Warning: ${inconsistentCount} transactions with inconsistent status/isPaid`);
      console.log(`   Running auto-fix...`);

      // Auto-fix: isPaid takes precedence
      await db.execute(sql`
        UPDATE transactions
        SET status = CASE WHEN is_paid THEN 'Pagado' ELSE 'Pendiente' END
        WHERE 
          (status = 'Pagado' AND is_paid = false)
          OR (status = 'Pendiente' AND is_paid = true)
      `);

      console.log(`   ✅ Fixed ${inconsistentCount} inconsistencies`);
    } else {
      console.log(`   ✅ All data is consistent`);
    }

    // ============================================
    // FINAL REPORT
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Transactions:       ${stats.totalTransactions}`);
    console.log(`Status Synced:            ${stats.statusSynced}`);
    console.log(`Clients Linked:           ${stats.clientsLinked}`);
    console.log(`Clients Unmatched:        ${stats.clientsUnmatched}`);
    console.log('='.repeat(60));

    if (stats.clientsUnmatched === 0) {
      console.log('\n✅ Migration completed successfully with no issues!');
    } else {
      console.log(`\n⚠️  Migration completed with ${stats.clientsUnmatched} unmatched clients`);
      console.log('   Please review the list above and take action.\n');
    }

    // Save report to file
    const reportPath = './migration-report.json';
    const fs = await import('fs/promises');
    await fs.writeFile(
      reportPath,
      JSON.stringify(stats, null, 2),
      'utf-8'
    );
    console.log(`📄 Full report saved to: ${reportPath}\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('   Error details:', error.message);
      console.error('   Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run migration
migrateLegacyData();
