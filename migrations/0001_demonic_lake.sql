ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "rfc" text;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "invoice_number" text;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "provider" text;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "subtotal" numeric(12, 2);
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "iva" numeric(12, 2);
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "notes" text;