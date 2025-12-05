-- Migration: Financial Module Enhancements
-- Date: 2025-11-28
-- Description: Add payment tracking, client profitability, and bidirectional recurring templates

-- ============================================
-- PART 1: Enhance transactions table
-- ============================================

-- Add payment status control
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS paid_date TIMESTAMP;

-- Add client assignment for profitability tracking
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES client_accounts(id) ON DELETE SET NULL;

-- Add recurring template linkage
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_recurring_instance BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS recurring_template_id INTEGER REFERENCES recurring_transactions(id) ON DELETE SET NULL;

-- Add transaction origin tracking (centralization)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS source TEXT;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS source_id INTEGER;

-- ============================================
-- PART 2: Enhance recurring_transactions table
-- ============================================

-- Add client assignment for retainers/igualas
ALTER TABLE recurring_transactions 
ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES client_accounts(id) ON DELETE SET NULL;

-- Remove deprecated fields (if they exist)
-- Note: We keep them for backward compatibility but mark as deprecated in schema
-- ALTER TABLE recurring_transactions DROP COLUMN IF EXISTS status;
-- ALTER TABLE recurring_transactions DROP COLUMN IF EXISTS related_client;

-- ============================================
-- PART 3: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_transactions_is_paid ON transactions(is_paid);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_template_id ON transactions(recurring_template_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date_paid ON transactions(date, is_paid);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_client_id ON recurring_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active ON recurring_transactions(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_type ON recurring_transactions(type);

-- ============================================
-- PART 4: Data migration (backward compatibility)
-- ============================================

-- Migrate existing "Pagado" status to isPaid = true
UPDATE transactions 
SET is_paid = true, paid_date = date 
WHERE status = 'Pagado' AND is_paid = false;

-- Set isPaid = false for "Pendiente" transactions
UPDATE transactions 
SET is_paid = false 
WHERE status = 'Pendiente';

-- ============================================
-- PART 5: Add helpful comments
-- ============================================

COMMENT ON COLUMN transactions.is_paid IS 'Payment status: true = paid/collected, false = pending';
COMMENT ON COLUMN transactions.paid_date IS 'Actual date when payment was made or collected';
COMMENT ON COLUMN transactions.client_id IS 'Links to client_accounts for profitability tracking';
COMMENT ON COLUMN transactions.is_recurring_instance IS 'True if generated from a recurring template';
COMMENT ON COLUMN transactions.recurring_template_id IS 'Links to recurring_transactions template';
COMMENT ON COLUMN transactions.source IS 'Origin: manual, client_project, recurring_template';
COMMENT ON COLUMN transactions.source_id IS 'Reference ID to source entity (e.g., project_id)';

COMMENT ON COLUMN recurring_transactions.client_id IS 'Links to client for retainers/igualas';
COMMENT ON COLUMN recurring_transactions.type IS 'Bidirectional: Ingreso or Gasto';

-- Migration complete
