# 📦 Data Migration Guide - Finanzas Module

## Overview

This guide explains how to migrate legacy financial data to the new schema structure.

## What Gets Migrated?

### 1. Status Synchronization
- **Old:** `status` field (text: "Pagado" or "Pendiente")
- **New:** `isPaid` (boolean) + `paidDate` (timestamp)

The script ensures:
- `status = "Pagado"` → `isPaid = true` + `paidDate = date`
- `status = "Pendiente"` → `isPaid = false` + `paidDate = null`

### 2. Client Linking
- **Old:** `relatedClient` field (free text)
- **New:** `clientId` (foreign key to `client_accounts.id`)

The script attempts:
- Case-insensitive matching by company name
- Automatic linking where matches are found
- Reporting of unmatched records for manual review

## Prerequisites

1. **Backup your database** before running migration
2. Ensure `.env` is configured with correct `DATABASE_URL`
3. Verify `client_accounts` table has data

## Running the Migration

### Option 1: Using npm script (Recommended)
```bash
npm run db:migrate:legacy
```

### Option 2: Direct execution
```bash
tsx server/migrate-legacy-data.ts
```

## Migration Process

The script performs these steps in order:

### Step 1: Data Analysis
- Counts total transactions
- Reports current state

### Step 2: Status Sync
- Updates `isPaid` and `paidDate` based on `status`
- Ensures consistency

### Step 3: Client Linking
- Matches `relatedClient` text to `client_accounts.company_name`
- Links via `clientId` foreign key

### Step 4: Unmatch Report
- Lists clients that couldn't be linked
- Provides suggestions for manual action

### Step 5: Verification
- Checks for inconsistencies
- Auto-fixes minor issues

## Expected Output

```
🔄 Starting legacy financial data migration...

📊 Step 1: Analyzing existing data...
   Total transactions: 150

📝 Step 2: Syncing status → isPaid/paidDate...
   ✅ Synced 120 paid transactions
   ✅ Synced 30 pending transactions
   Total synced: 150

🔗 Step 3: Linking relatedClient → clientId...
   ✅ Linked 100 transactions to client accounts

📋 Step 4: Identifying unmatched clients...
   ⚠️  Found 3 unmatched client names:
      1. "Cliente Ejemplo SA"
      2. "Empresa XYZ"
      3. "Agencia ABC"

   💡 These need manual review:
      - Check if client exists with different name
      - Create new client account if needed
      - Or update transactions manually

🔍 Step 5: Verifying data integrity...
   ✅ All data is consistent

============================================================
📊 MIGRATION SUMMARY
============================================================
Total Transactions:       150
Status Synced:            150
Clients Linked:           100
Clients Unmatched:        3
============================================================

⚠️  Migration completed with 3 unmatched clients
   Please review the list above and take action.

📄 Full report saved to: ./migration-report.json
```

## Post-Migration Steps

### 1. Review Migration Report
Check `migration-report.json` for details:
```json
{
  "totalTransactions": 150,
  "statusSynced": 150,
  "clientsLinked": 100,
  "clientsUnmatched": 3,
  "unmatchedClients": [
    "Cliente Ejemplo SA",
    "Empresa XYZ",
    "Agencia ABC"
  ]
}
```

### 2. Handle Unmatched Clients

For each unmatched client, choose one option:

#### Option A: Client exists with different name
```sql
-- Find similar names
SELECT id, company_name 
FROM client_accounts 
WHERE LOWER(company_name) LIKE '%ejemplo%';

-- Manual link
UPDATE transactions 
SET client_id = <found_id>
WHERE related_client = 'Cliente Ejemplo SA';
```

#### Option B: Create new client
```sql
-- Create client account first
INSERT INTO client_accounts (campaign_id, company_name, ...)
VALUES (...);

-- Then link transactions
UPDATE transactions 
SET client_id = <new_id>
WHERE related_client = 'Cliente Ejemplo SA';
```

#### Option C: Leave as text
- Keep `relatedClient` as text
- Don't link to `clientId`
- Note: Won't benefit from profitability reporting

### 3. Verify Results

```sql
-- Check sync status
SELECT 
  status,
  is_paid,
  COUNT(*) as count
FROM transactions
GROUP BY status, is_paid;

-- Should show consistent pairing:
-- "Pagado" + true
-- "Pendiente" + false

-- Check client linking
SELECT 
  COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as linked,
  COUNT(CASE WHEN client_id IS NULL AND related_client IS NOT NULL THEN 1 END) as unlinked,
  COUNT(*) as total
FROM transactions;
```

## Rollback (if needed)

If migration fails or produces unexpected results:

```sql
-- Rollback status sync (restore to original)
UPDATE transactions 
SET 
  is_paid = CASE WHEN status = 'Pagado' THEN true ELSE false END,
  paid_date = NULL
WHERE 1=1;

-- Rollback client links
UPDATE transactions 
SET client_id = NULL
WHERE source != 'recurring_template';  -- Keep recurr templates linked
```

## Safety Features

- **Non-Destructive:** Original `status` and `relatedClient` fields are preserved
- **Idempotent:** Can be run multiple times safely
- **Verification:** Automatic consistency checks
- **Reporting:** Detailed logs and JSON report

## Troubleshooting

### Issue: "Cannot read property 'count' of undefined"
**Solution:** Database connection error. Check `.env` file.

### Issue: Migration shows 0 transactions
**Solution:** Verify database has data:
```sql
SELECT COUNT(*) FROM transactions;
```

### Issue: All clients show as "unmatched"
**Solution:** Check if `client_accounts` table has data:
```sql
SELECT COUNT(*) FROM client_accounts;
```

## Next Steps

After successful migration:

1. ✅ Validate all data in the UI
2. ✅ Test creating new transactions
3. ✅ Test editing existing transactions
4. ✅ Verify financial reports are accurate
5. ✅ Monitor for any inconsistencies

Once confident (after 1-2 weeks):
- Consider **Fase 5: Cleanup** to remove deprecated fields
- This is optional and can be deferred

## Questions?

Check the main migration documentation:
- `.agent/analisis_modulo_finanzas.md`
- `.agent/plan_correccion_finanzas.md`
- `.agent/correcciones_aplicadas.md`
