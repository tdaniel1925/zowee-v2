-- =============================================
-- Migration 011: Fix All Schema Inconsistencies
-- =============================================
-- This migration fixes:
-- 1. Missing auth_user_id column (used by 9+ API routes)
-- 2. Missing create_jordyn_user_direct() function (used by signup)
-- 3. Removes redundant columns from incomplete renames

-- STEP 1: Add missing auth_user_id column
ALTER TABLE jordyn_users
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Create index for auth lookups
CREATE INDEX IF NOT EXISTS idx_jordyn_users_auth_user_id
ON jordyn_users(auth_user_id);

-- Add foreign key to auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_jordyn_users_auth_user_id'
  ) THEN
    ALTER TABLE jordyn_users
    ADD CONSTRAINT fk_jordyn_users_auth_user_id
    FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Populate auth_user_id for existing users (match by email)
UPDATE jordyn_users ju
SET auth_user_id = au.id
FROM auth.users au
WHERE ju.email = au.email
AND ju.auth_user_id IS NULL;

-- STEP 2: Remove redundant/obsolete columns
ALTER TABLE jordyn_users
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS zowee_phone,
DROP COLUMN IF EXISTS zowee_number;

-- STEP 3: Update RLS policy for jordyn_users
DROP POLICY IF EXISTS "Users see own data" ON jordyn_users;

CREATE POLICY "Users see own data" ON jordyn_users
FOR SELECT
USING (auth.uid() = auth_user_id);

-- STEP 4: Create missing SQL function for signup
CREATE OR REPLACE FUNCTION create_jordyn_user_direct(
  p_auth_user_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_phone_number TEXT,
  p_plan TEXT,
  p_stripe_customer_id TEXT,
  p_stripe_subscription_id TEXT,
  p_trial_ends_at TIMESTAMPTZ
) RETURNS TABLE (
  id UUID,
  auth_user_id UUID,
  name TEXT,
  email TEXT,
  phone_number TEXT,
  plan TEXT,
  plan_status TEXT,
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO jordyn_users (
    auth_user_id,
    name,
    email,
    phone_number,
    plan,
    plan_status,
    trial_ends_at,
    stripe_customer_id,
    stripe_subscription_id
  ) VALUES (
    p_auth_user_id,
    p_name,
    p_email,
    p_phone_number,
    p_plan,
    'trialing',
    p_trial_ends_at,
    p_stripe_customer_id,
    p_stripe_subscription_id
  )
  RETURNING
    jordyn_users.id,
    jordyn_users.auth_user_id,
    jordyn_users.name,
    jordyn_users.email,
    jordyn_users.phone_number,
    jordyn_users.plan,
    jordyn_users.plan_status,
    jordyn_users.trial_ends_at,
    jordyn_users.stripe_customer_id,
    jordyn_users.stripe_subscription_id,
    jordyn_users.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Add comments
COMMENT ON COLUMN jordyn_users.auth_user_id IS 'Foreign key to auth.users - links Jordyn user to Supabase Auth user';
COMMENT ON COLUMN jordyn_users.phone_number IS 'User personal phone number (e.g., +12345678901)';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
