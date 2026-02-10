-- Migration: Add project_id and hours_allocated to team_assignments
-- This migration adds missing columns that are defined in the schema but not in the database.

ALTER TABLE "team_assignments" ADD COLUMN IF NOT EXISTS "project_id" integer;
ALTER TABLE "team_assignments" ADD COLUMN IF NOT EXISTS "hours_allocated" integer DEFAULT 0;

-- Make campaign_id nullable (schema allows project-only assignments)
ALTER TABLE "team_assignments" ALTER COLUMN "campaign_id" DROP NOT NULL;

-- Add foreign key for project_id
ALTER TABLE "team_assignments" ADD CONSTRAINT "team_assignments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "team_assignments_project_id_idx" ON "team_assignments" ("project_id");
