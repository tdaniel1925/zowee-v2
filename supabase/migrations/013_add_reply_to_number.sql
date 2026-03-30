-- Add reply_to_number to browser tasks for conversation threading
-- This stores which Jordyn number the user texted TO, so we can reply FROM the same number

ALTER TABLE jordyn_browser_tasks
ADD COLUMN IF NOT EXISTS reply_to_number TEXT;

COMMENT ON COLUMN jordyn_browser_tasks.reply_to_number IS 'The Jordyn phone number user texted to (for conversation threading)';
