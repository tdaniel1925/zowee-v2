-- Add Twilio phone number columns for individual user provisioning
-- Each user gets their own dedicated Twilio phone number linked to A2P campaign

ALTER TABLE pokkit_users
ADD COLUMN IF NOT EXISTS twilio_phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS twilio_phone_number_sid VARCHAR(255),
ADD COLUMN IF NOT EXISTS twilio_messaging_service_sid VARCHAR(255);

-- Add index for faster lookups by Twilio phone number
CREATE INDEX IF NOT EXISTS idx_pokkit_users_twilio_phone
ON pokkit_users(twilio_phone_number);

-- Add comment explaining the A2P compliance strategy
COMMENT ON COLUMN pokkit_users.twilio_messaging_service_sid IS 'Links phone number to A2P 10DLC campaign via Messaging Service';
