-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'webhook')),
  target TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Enable RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Users can only manage alerts for their monitors
CREATE POLICY "Users can manage own alerts" ON alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM monitors 
      WHERE monitors.id = alerts.monitor_id 
      AND monitors.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alerts_monitor_id ON alerts(monitor_id);
