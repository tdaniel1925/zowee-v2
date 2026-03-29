-- ========================================
-- Telnyx Migration Script
-- Run this in your Supabase SQL editor
-- ========================================

-- Add Telnyx phone number columns to pokkit_users table
ALTER TABLE pokkit_users
ADD COLUMN IF NOT EXISTS telnyx_phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS telnyx_phone_number_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS telnyx_messaging_profile_id VARCHAR(255);

-- Create index for fast phone number lookups
CREATE INDEX IF NOT EXISTS idx_pokkit_users_telnyx_phone
ON pokkit_users(telnyx_phone_number);

-- Add comments
COMMENT ON COLUMN pokkit_users.telnyx_phone_number IS 'User individual Telnyx phone number (e.g., +15551234567)';
COMMENT ON COLUMN pokkit_users.telnyx_phone_number_id IS 'Telnyx phone number resource ID';
COMMENT ON COLUMN pokkit_users.telnyx_messaging_profile_id IS 'Telnyx messaging profile ID for SMS';

-- Verify the migration
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pokkit_users'
AND column_name LIKE 'telnyx%';
