-- Migration to add 'level' column to projects table
-- This fixes the Kanban drag-and-drop error where the backend expects this column.

ALTER TABLE "projects" ADD COLUMN "level" text DEFAULT 'Plata' NOT NULL;
