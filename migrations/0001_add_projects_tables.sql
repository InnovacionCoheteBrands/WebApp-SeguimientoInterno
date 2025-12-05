CREATE TABLE IF NOT EXISTS "projects" (
  "id" SERIAL PRIMARY KEY,
  "client_id" INTEGER NOT NULL REFERENCES "client_accounts"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "service_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Planificación',
  "health" TEXT NOT NULL DEFAULT 'green',
  "deadline" TIMESTAMP,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "service_specific_fields" TEXT,
  "custom_fields" TEXT,
  "description" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "project_deliverables" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT FALSE,
  "order" INTEGER NOT NULL DEFAULT 0,
  "due_date" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "project_attachments" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "file_type" TEXT,
  "file_size" INTEGER,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_projects_client_id" ON "projects"("client_id");
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "projects"("status");
CREATE INDEX IF NOT EXISTS "idx_projects_service_type" ON "projects"("service_type");
CREATE INDEX IF NOT EXISTS "idx_project_deliverables_project_id" ON "project_deliverables"("project_id");
CREATE INDEX IF NOT EXISTS "idx_project_attachments_project_id" ON "project_attachments"("project_id");
