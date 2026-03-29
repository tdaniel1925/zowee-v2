-- Run this in Supabase SQL Editor
-- Adds Twilio phone number columns for individual user provisioning

-- Add columns for Twilio phone numbers
ALTER TABLE pokkit_users
ADD COLUMN IF NOT EXISTS twilio_phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS twilio_phone_number_sid VARCHAR(255),
ADD COLUMN IF NOT EXISTS twilio_messaging_service_sid VARCHAR(255);

-- Add index for fast lookups by phone number
CREATE INDEX IF NOT EXISTS idx_pokkit_users_twilio_phone
ON pokkit_users(twilio_phone_number);

-- Add helpful comment
COMMENT ON COLUMN pokkit_users.twilio_messaging_service_sid IS 'Links phone number to A2P 10DLC campaign via Messaging Service';

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pokkit_users'
AND column_name LIKE 'twilio%';
