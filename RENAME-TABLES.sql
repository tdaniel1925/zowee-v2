-- Rename all zowee tables to pokkit
-- Run this in Supabase SQL Editor

-- Core tables from migration 001
ALTER TABLE IF EXISTS zowee_users RENAME TO pokkit_users;
ALTER TABLE IF EXISTS zowee_memory RENAME TO pokkit_memory;
ALTER TABLE IF EXISTS zowee_conversations RENAME TO pokkit_conversations;
ALTER TABLE IF EXISTS zowee_monitors RENAME TO pokkit_monitors;
ALTER TABLE IF EXISTS zowee_reminders RENAME TO pokkit_reminders;

-- Additional tables
ALTER TABLE IF EXISTS zowee_actions RENAME TO pokkit_actions;
ALTER TABLE IF EXISTS zowee_browser_tasks RENAME TO pokkit_browser_tasks;
ALTER TABLE IF EXISTS zowee_email_sends RENAME TO pokkit_email_sends;
ALTER TABLE IF EXISTS zowee_events RENAME TO pokkit_events;
ALTER TABLE IF EXISTS zowee_monitor_log RENAME TO pokkit_monitor_log;
ALTER TABLE IF EXISTS zowee_skill_suggestions RENAME TO pokkit_skill_suggestions;
ALTER TABLE IF EXISTS zowee_skills RENAME TO pokkit_skills;
ALTER TABLE IF EXISTS zowee_tasks RENAME TO pokkit_tasks;

-- Verify all tables renamed
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE 'pokkit_%' OR table_name LIKE 'zowee_%')
ORDER BY table_name;

-- Should only see pokkit_* tables now, no zowee_* tables
