# Manual Database Setup Guide

## Issue
The `pokkit_users` table doesn't exist in your database. This means the migrations haven't been run yet.

## Solution: Run All Migrations in Order

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/xxxtbzypheuiniuqynas/sql/new

### Step 2: Run Migrations in Order

#### Migration 001: Initial Schema
1. Open file: `supabase/migrations/001_zowee_schema.sql`
2. Copy **ALL** contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Wait for success message

#### Migration 002: Remove MLM, Add Apex
1. Open file: `supabase/migrations/002_remove_mlm_add_apex_webhook.sql`
2. Copy **ALL** contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Wait for success message

#### Migration 003: Browserbase Tasks
1. Open file: `supabase/migrations/003_browserbase_tasks.sql`
2. Copy **ALL** contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Wait for success message

#### Migration 004: Voice Plans and Features
1. Open file: `supabase/migrations/004_voice_plans_and_features.sql`
2. Copy **ALL** contents
3. Paste into Supabase SQL Editor
4. Click "Run"
5. Wait for success message

### Step 3: Verify Tables Exist

Run this query in the SQL Editor:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'pokkit_%'
ORDER BY table_name;
```

**Expected result:** You should see these tables:
- pokkit_browser_tasks
- pokkit_conversations
- pokkit_daily_alerts
- pokkit_memory
- pokkit_monitors
- pokkit_phone_numbers (if using phone pool)
- pokkit_reminders
- pokkit_users
- pokkit_voice_calls
- pokkit_webhooks

### Step 4: Verify Voice Columns

```sql
-- Check voice columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pokkit_users'
  AND column_name LIKE 'voice%'
ORDER BY column_name;
```

**Expected result:**
- voice_enabled (boolean)
- voice_minutes_quota (integer)
- voice_minutes_reset_at (timestamp)
- voice_minutes_used (integer)
- vapi_assistant_id (text)
- vapi_phone_number_id (text)

### Step 5: Test Trigger

```sql
-- Insert a test user with voice plan
INSERT INTO pokkit_users (name, phone_number, plan, auth_user_id)
VALUES ('Test User', '+15551234567', 'solo_voice', gen_random_uuid())
RETURNING id, plan, voice_enabled, voice_minutes_quota;
```

**Expected result:**
- voice_enabled = true
- voice_minutes_quota = 100

### Step 6: Clean Up Test Data

```sql
-- Delete test user
DELETE FROM pokkit_users
WHERE phone_number = '+15551234567';
```

---

## Troubleshooting

### Error: "relation already exists"
- This means the migration was partially run
- You can skip that specific CREATE TABLE statement
- Or drop the table and re-run: `DROP TABLE table_name CASCADE;`

### Error: "column already exists"
- The column was added in a previous run
- You can skip that ALTER TABLE statement
- Or use IF NOT EXISTS clause (already in migrations)

### Error: "permission denied"
- Make sure you're using the Service Role key, not the Anon key
- Check you're logged into Supabase with correct account

### Error: "constraint already exists"
- The constraint was added before
- You can drop it first: `ALTER TABLE table_name DROP CONSTRAINT constraint_name;`
- Then re-add it

---

## After Migrations Complete

1. ✅ Verify all tables exist
2. ✅ Test signup flow at http://localhost:3000/signup
3. ✅ Check user created in database
4. ✅ Commit and push code
5. ✅ Deploy to Vercel

---

## Quick Verification Script

Run this after all migrations:

```sql
-- Comprehensive verification
DO $$
DECLARE
  table_count INTEGER;
  voice_col_count INTEGER;
  trigger_exists BOOLEAN;
BEGIN
  -- Count pokkit tables
  SELECT COUNT(*)
  INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE 'pokkit_%';

  RAISE NOTICE 'Found % pokkit tables', table_count;

  -- Count voice columns
  SELECT COUNT(*)
  INTO voice_col_count
  FROM information_schema.columns
  WHERE table_name = 'pokkit_users'
    AND column_name LIKE 'voice%';

  RAISE NOTICE 'Found % voice columns in pokkit_users', voice_col_count;

  -- Check trigger exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.triggers
    WHERE trigger_name = 'trigger_set_voice_quota'
  ) INTO trigger_exists;

  IF trigger_exists THEN
    RAISE NOTICE 'Voice quota trigger exists: YES';
  ELSE
    RAISE NOTICE 'Voice quota trigger exists: NO';
  END IF;

  -- Summary
  IF table_count >= 9 AND voice_col_count = 6 AND trigger_exists THEN
    RAISE NOTICE '✅ DATABASE SETUP COMPLETE!';
  ELSE
    RAISE NOTICE '⚠️  Database setup incomplete. Check migration steps.';
  END IF;
END $$;
```

---

## Need Help?

If you encounter errors you can't resolve:
1. Take a screenshot of the error
2. Note which migration file caused it
3. Check the migration file for the exact SQL statement
4. You can run statements one at a time to isolate the issue
