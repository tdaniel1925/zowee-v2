-- =============================================
-- Migration 012: Add Signup Sessions Table
-- =============================================
-- Stores temporary signup data securely instead of in Stripe metadata
-- Prevents passwords from being stored in Stripe dashboard

CREATE TABLE IF NOT EXISTS jordyn_signup_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),

  -- User data
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- Hashed, never plain text
  plan TEXT NOT NULL,

  -- Stripe reference
  stripe_customer_id TEXT,
  stripe_checkout_session_id TEXT,

  -- Status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

-- Index for quick lookup by checkout session
CREATE INDEX IF NOT EXISTS idx_signup_sessions_checkout
ON jordyn_signup_sessions(stripe_checkout_session_id);

-- Index for cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_signup_sessions_expires
ON jordyn_signup_sessions(expires_at) WHERE completed = FALSE;

-- Auto-delete expired incomplete sessions (cleanup cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_signup_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM jordyn_signup_sessions
  WHERE expires_at < NOW()
  AND completed = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE jordyn_signup_sessions IS 'Temporary storage for signup data during Stripe checkout - auto-expires after 1 hour';
