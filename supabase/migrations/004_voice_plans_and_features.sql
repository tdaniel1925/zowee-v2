-- Migration 004: Voice Plans and Features
-- Adds support for voice-enabled plans and VAPI integration

-- 1. Update plan type enum to include new plans
ALTER TABLE pokkit_users DROP CONSTRAINT IF EXISTS pokkit_users_plan_check;
ALTER TABLE pokkit_users ADD CONSTRAINT pokkit_users_plan_check
  CHECK (plan IN ('solo', 'family', 'solo_voice', 'family_voice', 'business'));

COMMENT ON COLUMN pokkit_users.plan IS 'User plan type: solo ($19), family ($34), solo_voice ($39), family_voice ($59), business ($97)';

-- 2. Add voice-related columns to pokkit_users
ALTER TABLE pokkit_users ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE pokkit_users ADD COLUMN IF NOT EXISTS voice_minutes_used INTEGER DEFAULT 0;
ALTER TABLE pokkit_users ADD COLUMN IF NOT EXISTS voice_minutes_quota INTEGER DEFAULT 0;
ALTER TABLE pokkit_users ADD COLUMN IF NOT EXISTS voice_minutes_reset_at TIMESTAMP;
ALTER TABLE pokkit_users ADD COLUMN IF NOT EXISTS vapi_assistant_id TEXT;
ALTER TABLE pokkit_users ADD COLUMN IF NOT EXISTS vapi_phone_number_id TEXT;

COMMENT ON COLUMN pokkit_users.voice_enabled IS 'Whether user has voice calling enabled';
COMMENT ON COLUMN pokkit_users.voice_minutes_used IS 'Voice minutes used this billing period';
COMMENT ON COLUMN pokkit_users.voice_minutes_quota IS 'Total voice minutes allowed per month';
COMMENT ON COLUMN pokkit_users.voice_minutes_reset_at IS 'When voice minutes will reset';
COMMENT ON COLUMN pokkit_users.vapi_assistant_id IS 'VAPI assistant ID for this user';
COMMENT ON COLUMN pokkit_users.vapi_phone_number_id IS 'VAPI phone number ID for voice calls';

-- 3. Create pokkit_voice_calls table
CREATE TABLE IF NOT EXISTS pokkit_voice_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES pokkit_users(id) ON DELETE CASCADE,
  call_sid TEXT NOT NULL,
  vapi_call_id TEXT,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  duration_seconds INTEGER,
  minutes_used DECIMAL(10,2),
  cost DECIMAL(10,2) DEFAULT 0,
  transcript TEXT,
  summary TEXT,
  actions_taken JSONB,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pokkit_voice_calls IS 'Log of all voice calls made to Pokkit via VAPI';
COMMENT ON COLUMN pokkit_voice_calls.call_sid IS 'Twilio call SID';
COMMENT ON COLUMN pokkit_voice_calls.vapi_call_id IS 'VAPI call ID';
COMMENT ON COLUMN pokkit_voice_calls.duration_seconds IS 'Total call duration in seconds';
COMMENT ON COLUMN pokkit_voice_calls.minutes_used IS 'Billable minutes (rounded up)';
COMMENT ON COLUMN pokkit_voice_calls.cost IS 'Overage cost if exceeded quota';
COMMENT ON COLUMN pokkit_voice_calls.transcript IS 'Full call transcript';
COMMENT ON COLUMN pokkit_voice_calls.summary IS 'AI-generated call summary';
COMMENT ON COLUMN pokkit_voice_calls.actions_taken IS 'Actions executed during call';
COMMENT ON COLUMN pokkit_voice_calls.status IS 'Call status: in_progress, completed, failed, no_answer';

-- 4. Create indexes for pokkit_voice_calls
CREATE INDEX IF NOT EXISTS idx_voice_calls_user ON pokkit_voice_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_started ON pokkit_voice_calls(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_calls_status ON pokkit_voice_calls(status);
CREATE INDEX IF NOT EXISTS idx_voice_calls_call_sid ON pokkit_voice_calls(call_sid);

-- 5. Enable RLS on pokkit_voice_calls
ALTER TABLE pokkit_voice_calls ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for pokkit_voice_calls
CREATE POLICY "Users can view own voice calls"
  ON pokkit_voice_calls FOR SELECT
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM pokkit_users WHERE id = pokkit_voice_calls.user_id
    )
  );

CREATE POLICY "Users cannot insert voice calls"
  ON pokkit_voice_calls FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Users cannot update voice calls"
  ON pokkit_voice_calls FOR UPDATE
  USING (false);

CREATE POLICY "Users cannot delete voice calls"
  ON pokkit_voice_calls FOR DELETE
  USING (false);

-- 7. Function to set voice quota based on plan
CREATE OR REPLACE FUNCTION set_voice_quota_for_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- Set voice_enabled and voice_minutes_quota based on plan
  CASE NEW.plan
    WHEN 'solo_voice' THEN
      NEW.voice_enabled := TRUE;
      NEW.voice_minutes_quota := 100;
    WHEN 'family_voice' THEN
      NEW.voice_enabled := TRUE;
      NEW.voice_minutes_quota := 200;
    WHEN 'business' THEN
      NEW.voice_enabled := TRUE;
      NEW.voice_minutes_quota := 200;
    ELSE
      NEW.voice_enabled := FALSE;
      NEW.voice_minutes_quota := 0;
  END CASE;

  -- Set reset date if not already set
  IF NEW.voice_minutes_reset_at IS NULL AND NEW.voice_enabled THEN
    NEW.voice_minutes_reset_at := (CURRENT_DATE + INTERVAL '1 month')::TIMESTAMP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to auto-set voice quota on plan change
DROP TRIGGER IF EXISTS trigger_set_voice_quota ON pokkit_users;
CREATE TRIGGER trigger_set_voice_quota
  BEFORE INSERT OR UPDATE OF plan ON pokkit_users
  FOR EACH ROW
  EXECUTE FUNCTION set_voice_quota_for_plan();

-- 9. Update existing users to set correct quotas
UPDATE pokkit_users
SET
  voice_enabled = CASE
    WHEN plan IN ('solo_voice', 'family_voice', 'business') THEN TRUE
    ELSE FALSE
  END,
  voice_minutes_quota = CASE
    WHEN plan = 'solo_voice' THEN 100
    WHEN plan = 'family_voice' THEN 200
    WHEN plan = 'business' THEN 200
    ELSE 0
  END,
  voice_minutes_reset_at = CASE
    WHEN plan IN ('solo_voice', 'family_voice', 'business')
    THEN (CURRENT_DATE + INTERVAL '1 month')::TIMESTAMP
    ELSE NULL
  END
WHERE voice_enabled IS NULL;
