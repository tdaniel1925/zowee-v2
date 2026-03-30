-- Update plan check constraint to include all valid plans
-- Old constraint only had: solo, family, solo_voice, family_voice, business
-- Need to add: test

-- Drop old constraint
ALTER TABLE jordyn_users
DROP CONSTRAINT IF EXISTS pokkit_users_plan_check;

-- Add new constraint with all valid plans
ALTER TABLE jordyn_users
ADD CONSTRAINT jordyn_users_plan_check
CHECK (plan IN ('solo', 'family', 'solo_voice', 'family_voice', 'business', 'test'));
