ALTER TABLE "share_links" ADD COLUMN IF NOT EXISTS "download_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "share_links" ADD COLUMN IF NOT EXISTS "max_downloads" integer;
-- Plaintext → SHA-256 hex is applied at boot by ensurePgSchema for existing rows.
