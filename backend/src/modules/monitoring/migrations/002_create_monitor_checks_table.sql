-- Monitor checks table
CREATE TABLE IF NOT EXISTS monitor_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  status_code INTEGER,
  response_time_ms INTEGER,
  is_up BOOLEAN NOT NULL,
  error_message TEXT,
  response_snippet TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE monitor_checks ENABLE ROW LEVEL SECURITY;

-- Users can only access checks for their monitors
CREATE POLICY "Users can view own monitor checks" ON monitor_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM monitors 
      WHERE monitors.id = monitor_checks.monitor_id 
      AND monitors.user_id = auth.uid()
    )
  );

-- Allow service role to insert monitor checks
CREATE POLICY "Service can insert monitor checks" ON monitor_checks
  FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitor_checks_monitor_id ON monitor_checks(monitor_id);
CREATE INDEX IF NOT EXISTS idx_monitor_checks_checked_at ON monitor_checks(checked_at DESC);
