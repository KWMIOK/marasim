-- Run ONCE in Supabase SQL Editor if `migration repair` fails.
-- This tells the CLI that migrations were already applied manually.

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('20250606120000', '20250606120000_initial_schema', ARRAY[]::text[]),
  ('20250606130000', '20250606130000_event_creator_catalogs', ARRAY[]::text[])
ON CONFLICT (version) DO NOTHING;

-- Verify (should return 2 rows):
-- SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
