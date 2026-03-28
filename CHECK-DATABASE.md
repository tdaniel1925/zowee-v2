# Check What's in Your Database

## Step 1: Check Existing Tables

Copy and paste this query into Supabase SQL Editor:

```sql
-- Check what tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**This will show you all tables that currently exist.**

---

## Possible Scenarios:

### Scenario A: No Pokkit Tables Exist
If you see NO tables starting with `pokkit_` or `zowee_`, then:
- **Action:** Run migration 001, 002, 003, 004 in order

### Scenario B: You See `zowee_users` (Not `pokkit_users`)
If you see `zowee_users`, `zowee_memory`, etc., then:
- **Action:** You need to rename the tables from `zowee_*` to `pokkit_*`

### Scenario C: You See Some Pokkit Tables
If you see some `pokkit_` tables but not all, then:
- **Action:** Run the missing migrations

---

## Run the Check Now

1. Go to: https://supabase.com/dashboard/project/xxxtbzypheuiniuqynas/sql/new
2. Paste the query above
3. Click "Run"
4. Tell me what tables you see

---

## Table Renaming (If Needed)

If you have `zowee_*` tables and need to rename them to `pokkit_*`, run this:

```sql
-- Rename all zowee tables to pokkit
ALTER TABLE IF EXISTS zowee_users RENAME TO pokkit_users;
ALTER TABLE IF EXISTS zowee_memory RENAME TO pokkit_memory;
ALTER TABLE IF EXISTS zowee_conversations RENAME TO pokkit_conversations;
ALTER TABLE IF EXISTS zowee_monitors RENAME TO pokkit_monitors;
ALTER TABLE IF EXISTS zowee_reminders RENAME TO pokkit_reminders;
ALTER TABLE IF EXISTS zowee_daily_alerts RENAME TO pokkit_daily_alerts;
ALTER TABLE IF EXISTS zowee_phone_numbers RENAME TO pokkit_phone_numbers;
ALTER TABLE IF EXISTS zowee_webhooks RENAME TO pokkit_webhooks;

-- Verify renamed tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'pokkit_%'
ORDER BY table_name;
```

Then run migrations 002, 003, and 004.

---

## Expected Final State

After all migrations, you should have these tables:

1. `pokkit_users` (from migration 001)
2. `pokkit_memory` (from migration 001)
3. `pokkit_conversations` (from migration 001)
4. `pokkit_monitors` (from migration 001)
5. `pokkit_reminders` (from migration 001)
6. `pokkit_daily_alerts` (from migration 001)
7. `pokkit_webhooks` (from migration 002)
8. `pokkit_browser_tasks` (from migration 003)
9. `pokkit_voice_calls` (from migration 004)

**Total: 9 tables**
