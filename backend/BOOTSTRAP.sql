-- ============================================
-- BOOTSTRAP SQL FOR SUPABASE
-- ============================================
-- Run this SQL in your Supabase SQL Editor BEFORE running migrations
-- 
-- Steps:
-- 1. Go to your Supabase dashboard
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New query"
-- 4. Paste this entire file
-- 5. Click "Run" (or press Cmd/Ctrl + Enter)
-- 6. Then run: cd backend && npm run migrate up
-- ============================================

-- Create exec_sql function for running migrations
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  module VARCHAR(100) NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Success message (you can ignore any errors about this)
DO $$
BEGIN
  RAISE NOTICE '✅ Bootstrap SQL executed successfully!';
  RAISE NOTICE 'You can now run: cd backend && npm run migrate up';
END $$;

