-- Monitors table
CREATE TABLE IF NOT EXISTS monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  headers JSONB,
  body TEXT,
  interval_minutes INTEGER NOT NULL DEFAULT 5,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  expected_status_codes INTEGER[] DEFAULT '{200,201,202,204}',
  keyword_validation TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Enable RLS
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;

-- Users can only access their own monitors
CREATE POLICY "Users can manage own monitors" ON monitors
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitors_user_id ON monitors(user_id);
CREATE INDEX IF NOT EXISTS idx_monitors_active ON monitors(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_monitors_updated_at BEFORE UPDATE ON monitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
