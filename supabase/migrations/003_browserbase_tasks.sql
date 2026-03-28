-- Migration: Browserbase Browser Tasks
-- Description: Add table for tracking browser automation tasks (research, form filling, payments)

CREATE TABLE IF NOT EXISTS zowee_browser_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES zowee_users(id) ON DELETE CASCADE NOT NULL,

  -- Task info
  task_type TEXT NOT NULL, -- 'research', 'form_fill', 'payment', 'flight_search', 'hotel_search', 'restaurant_search'
  status TEXT DEFAULT 'pending', -- 'pending', 'pending_confirmation', 'running', 'completed', 'failed'

  -- Input
  intent JSONB NOT NULL, -- parsed intent from SMS
  instructions TEXT NOT NULL, -- natural language task description for Claude Computer Use

  -- Browser session
  browserbase_session_id TEXT,
  browserbase_url TEXT,

  -- Results
  result JSONB, -- task results (structured data)
  error TEXT, -- error message if failed
  screenshot_url TEXT, -- screenshot of final state

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_ms INTEGER,

  -- Notification
  notified_at TIMESTAMPTZ, -- when user was notified via SMS

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_browser_tasks_user ON zowee_browser_tasks(user_id);
CREATE INDEX idx_browser_tasks_status ON zowee_browser_tasks(status);
CREATE INDEX idx_browser_tasks_type ON zowee_browser_tasks(task_type);
CREATE INDEX idx_browser_tasks_created ON zowee_browser_tasks(created_at DESC);
CREATE INDEX idx_browser_tasks_pending ON zowee_browser_tasks(status, created_at) WHERE status IN ('pending', 'running');

-- RLS Policies
ALTER TABLE zowee_browser_tasks ENABLE ROW LEVEL SECURITY;

-- Users can view their own tasks
CREATE POLICY "Users can view own browser tasks"
  ON zowee_browser_tasks
  FOR SELECT
  USING (auth.uid() IN (
    SELECT auth_user_id FROM zowee_users WHERE id = zowee_browser_tasks.user_id
  ));

-- Service role can do anything (for API routes)
CREATE POLICY "Service role full access to browser tasks"
  ON zowee_browser_tasks
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add profile column to zowee_users for storing payment methods and preferences
ALTER TABLE zowee_users ADD COLUMN IF NOT EXISTS profile JSONB DEFAULT '{}';

-- Comments
COMMENT ON TABLE zowee_browser_tasks IS 'Tracks browser automation tasks for research, form filling, and payment processing';
COMMENT ON COLUMN zowee_browser_tasks.intent IS 'Parsed SMS intent that triggered this task';
COMMENT ON COLUMN zowee_browser_tasks.instructions IS 'Natural language instructions for Claude Computer Use API';
COMMENT ON COLUMN zowee_browser_tasks.result IS 'Structured task results (product prices, booking confirmations, etc.)';
COMMENT ON COLUMN zowee_users.profile IS 'User profile data for form filling (name, email, payment methods, preferences)';
