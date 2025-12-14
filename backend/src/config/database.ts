import { createClient } from "@supabase/supabase-js";
import { config } from "./environment";

// Create Supabase client with service role key for backend operations
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create a client with anon key for user-level operations
export const supabaseAnon = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Database table names
export const tables = {
  users: "users",
  monitors: "monitors",
  monitor_checks: "monitor_checks",
  alerts: "alerts",
  alert_logs: "alert_logs",
} as const;

// Manual setup SQL (run this once in Supabase SQL editor to bootstrap migrations)
export const bootstrapSQL = `
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

-- Note: JWT secret is automatically configured by Supabase for RLS
-- No manual setup required for auth.uid() functions
`;

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);
    if (error) {
      console.error("Database connection failed:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
