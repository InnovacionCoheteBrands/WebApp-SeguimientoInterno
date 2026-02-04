-- Migration: Sync team table and create agency_role_catalog
-- Date: 2026-02-03
-- Description: Adds missing columns to team table and creates agency_role_catalog

-- ===========================================
-- PART 1: Create agency_role_catalog table
-- ===========================================
CREATE TABLE IF NOT EXISTS agency_role_catalog (
  id SERIAL PRIMARY KEY,
  role_name TEXT NOT NULL,
  department TEXT NOT NULL,
  default_billable_rate NUMERIC NOT NULL DEFAULT '0',
  allowed_activities TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- PART 2: Add missing columns to team table
-- ===========================================
-- New employee-focused fields
ALTER TABLE team ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE team ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE team ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE team ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE team ADD COLUMN IF NOT EXISTS payroll_type TEXT DEFAULT 'Fija';
ALTER TABLE team ADD COLUMN IF NOT EXISTS start_date TIMESTAMP;
ALTER TABLE team ADD COLUMN IF NOT EXISTS employee_status TEXT DEFAULT 'Activo';
ALTER TABLE team ADD COLUMN IF NOT EXISTS notes TEXT;

-- Legacy/Agency fields that may be missing
ALTER TABLE team ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE team ADD COLUMN IF NOT EXISTS internal_cost_hour NUMERIC DEFAULT '0';
ALTER TABLE team ADD COLUMN IF NOT EXISTS billable_rate NUMERIC DEFAULT '0';
ALTER TABLE team ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC DEFAULT '0';
ALTER TABLE team ADD COLUMN IF NOT EXISTS weekly_capacity INTEGER DEFAULT 40;
ALTER TABLE team ADD COLUMN IF NOT EXISTS role_catalog_id INTEGER REFERENCES agency_role_catalog(id) ON DELETE SET NULL;
ALTER TABLE team ADD COLUMN IF NOT EXISTS skills TEXT;

-- Make legacy 'name' column nullable for backward compatibility
ALTER TABLE team ALTER COLUMN name DROP NOT NULL;
ALTER TABLE team ALTER COLUMN role DROP NOT NULL;
ALTER TABLE team ALTER COLUMN department DROP NOT NULL;
ALTER TABLE team ALTER COLUMN work_hours_start DROP NOT NULL;
ALTER TABLE team ALTER COLUMN work_hours_end DROP NOT NULL;

-- Set defaults for columns that should have them
ALTER TABLE team ALTER COLUMN role SET DEFAULT '';
ALTER TABLE team ALTER COLUMN department SET DEFAULT 'Junior';
ALTER TABLE team ALTER COLUMN work_hours_start SET DEFAULT '09:00';
ALTER TABLE team ALTER COLUMN work_hours_end SET DEFAULT '18:00';

-- ===========================================
-- PART 3: Create useful indexes
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_team_role_catalog ON team(role_catalog_id);
CREATE INDEX IF NOT EXISTS idx_team_employee_status ON team(employee_status);
CREATE INDEX IF NOT EXISTS idx_agency_role_department ON agency_role_catalog(department);

-- Migration complete
