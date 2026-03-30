-- Ensure email column exists in jordyn_users table
-- This migration is idempotent and can be run multiple times safely

DO $$
BEGIN
  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'jordyn_users'
    AND column_name = 'email'
  ) THEN
    ALTER TABLE jordyn_users ADD COLUMN email text;
    RAISE NOTICE 'Added email column to jordyn_users';
  ELSE
    RAISE NOTICE 'Email column already exists in jordyn_users';
  END IF;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Add comment
COMMENT ON COLUMN jordyn_users.email IS 'User email address for login and communication';
