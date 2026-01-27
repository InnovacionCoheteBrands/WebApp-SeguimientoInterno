-- Cohete Brands Replica - Schema Migration
-- Created: 2026-01-23
-- Adds: leads, poes, project_team_assignments tables

-- ===========================================
-- 🎯 LEADS TABLE (CRM Kanban)
-- ===========================================
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  
  -- Contact Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  
  -- CRM Classification
  origin TEXT NOT NULL DEFAULT 'Otro',
  status TEXT NOT NULL DEFAULT 'Nuevo',
  
  -- Financial Estimation
  estimated_value NUMERIC(12, 2),
  probability INTEGER DEFAULT 50,
  
  -- Follow-up
  last_contact_date TIMESTAMP,
  next_follow_up_date TIMESTAMP,
  assigned_to_id INTEGER REFERENCES team(id) ON DELETE SET NULL,
  
  -- Conversion
  converted_to_client_id INTEGER REFERENCES client_accounts(id) ON DELETE SET NULL,
  converted_at TIMESTAMP,
  lost_reason TEXT,
  
  notes TEXT,
  tags TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- 📋 POES TABLE (Standard Operating Procedures)
-- ===========================================
CREATE TABLE IF NOT EXISTS poes (
  id SERIAL PRIMARY KEY,
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  
  -- Document
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  
  -- Versioning
  version TEXT NOT NULL DEFAULT '1.0',
  last_reviewed_at TIMESTAMP,
  reviewed_by_id INTEGER REFERENCES team(id) ON DELETE SET NULL,
  
  -- Access Control
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  allowed_roles TEXT,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  created_by_id INTEGER REFERENCES team(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- 👥 PROJECT TEAM ASSIGNMENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS project_team_assignments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id INTEGER NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  
  -- Role in this project
  role_in_project TEXT,
  
  -- Time tracking
  allocated_hours INTEGER DEFAULT 0,
  logged_hours NUMERIC(10, 2) DEFAULT 0,
  
  -- Service assignment
  service_id INTEGER REFERENCES service_catalog(id) ON DELETE SET NULL,
  
  -- Performance tracking
  revenue_attributed NUMERIC(12, 2) DEFAULT 0,
  
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_origin ON leads(origin);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_poes_category ON poes(category);
CREATE INDEX IF NOT EXISTS idx_poes_active ON poes(is_active);
CREATE INDEX IF NOT EXISTS idx_project_team_project ON project_team_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_member ON project_team_assignments(team_member_id);
