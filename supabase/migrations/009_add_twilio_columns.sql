-- Add Twilio phone number columns to jordyn_users
-- These store the individually provisioned Twilio number for each user

ALTER TABLE jordyn_users
ADD COLUMN IF NOT EXISTS twilio_phone_number text,
ADD COLUMN IF NOT EXISTS twilio_phone_number_sid text,
ADD COLUMN IF NOT EXISTS twilio_messaging_service_sid text;

-- Add index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_jordyn_users_twilio_phone_number
ON jordyn_users(twilio_phone_number);

-- Add comment
COMMENT ON COLUMN jordyn_users.twilio_phone_number IS 'Individual Twilio phone number assigned to this user (e.g., +12605551234)';
COMMENT ON COLUMN jordyn_users.twilio_phone_number_sid IS 'Twilio Phone Number SID (e.g., PN...)';
COMMENT ON COLUMN jordyn_users.twilio_messaging_service_sid IS 'Twilio Messaging Service SID this number is linked to for A2P compliance';
