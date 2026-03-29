-- =============================================
-- Migration: Rename Pokkit to Jordyn
-- =============================================
-- This migration renames all pokkit_* tables to jordyn_*
-- RLS policies will be automatically updated by PostgreSQL when tables are renamed

-- 1. Rename all tables (if they exist)
DO $$
BEGIN
  -- Only rename if pokkit_users exists and jordyn_users doesn't
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_users')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_users') THEN
    ALTER TABLE pokkit_users RENAME TO jordyn_users;
    RAISE NOTICE 'Renamed pokkit_users to jordyn_users';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_memory')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_memory') THEN
    ALTER TABLE pokkit_memory RENAME TO jordyn_memory;
    RAISE NOTICE 'Renamed pokkit_memory to jordyn_memory';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_conversations')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_conversations') THEN
    ALTER TABLE pokkit_conversations RENAME TO jordyn_conversations;
    RAISE NOTICE 'Renamed pokkit_conversations to jordyn_conversations';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_tasks')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_tasks') THEN
    ALTER TABLE pokkit_tasks RENAME TO jordyn_tasks;
    RAISE NOTICE 'Renamed pokkit_tasks to jordyn_tasks';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_reminders')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_reminders') THEN
    ALTER TABLE pokkit_reminders RENAME TO jordyn_reminders;
    RAISE NOTICE 'Renamed pokkit_reminders to jordyn_reminders';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_monitors')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_monitors') THEN
    ALTER TABLE pokkit_monitors RENAME TO jordyn_monitors;
    RAISE NOTICE 'Renamed pokkit_monitors to jordyn_monitors';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_monitor_log')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_monitor_log') THEN
    ALTER TABLE pokkit_monitor_log RENAME TO jordyn_monitor_log;
    RAISE NOTICE 'Renamed pokkit_monitor_log to jordyn_monitor_log';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_skills')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_skills') THEN
    ALTER TABLE pokkit_skills RENAME TO jordyn_skills;
    RAISE NOTICE 'Renamed pokkit_skills to jordyn_skills';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_skill_suggestions')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_skill_suggestions') THEN
    ALTER TABLE pokkit_skill_suggestions RENAME TO jordyn_skill_suggestions;
    RAISE NOTICE 'Renamed pokkit_skill_suggestions to jordyn_skill_suggestions';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_events')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_events') THEN
    ALTER TABLE pokkit_events RENAME TO jordyn_events;
    RAISE NOTICE 'Renamed pokkit_events to jordyn_events';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_actions')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_actions') THEN
    ALTER TABLE pokkit_actions RENAME TO jordyn_actions;
    RAISE NOTICE 'Renamed pokkit_actions to jordyn_actions';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_email_sends')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_email_sends') THEN
    ALTER TABLE pokkit_email_sends RENAME TO jordyn_email_sends;
    RAISE NOTICE 'Renamed pokkit_email_sends to jordyn_email_sends';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_browser_tasks')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_browser_tasks') THEN
    ALTER TABLE pokkit_browser_tasks RENAME TO jordyn_browser_tasks;
    RAISE NOTICE 'Renamed pokkit_browser_tasks to jordyn_browser_tasks';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pokkit_voice_calls')
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_voice_calls') THEN
    ALTER TABLE pokkit_voice_calls RENAME TO jordyn_voice_calls;
    RAISE NOTICE 'Renamed pokkit_voice_calls to jordyn_voice_calls';
  END IF;
END $$;

-- 2. Rename pokkit_number column in jordyn_users (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'jordyn_users'
    AND column_name = 'pokkit_number'
  ) THEN
    ALTER TABLE jordyn_users RENAME COLUMN pokkit_number TO jordyn_number;
    RAISE NOTICE 'Renamed column pokkit_number to jordyn_number in jordyn_users';
  END IF;
END $$;

-- 3. Update indexes that reference pokkit in their names
DO $$
DECLARE
  idx_record RECORD;
BEGIN
  FOR idx_record IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE '%pokkit%'
  LOOP
    EXECUTE format('ALTER INDEX %I RENAME TO %I',
      idx_record.indexname,
      replace(idx_record.indexname, 'pokkit', 'jordyn')
    );
    RAISE NOTICE 'Renamed index % to %', idx_record.indexname, replace(idx_record.indexname, 'pokkit', 'jordyn');
  END LOOP;
END $$;

-- 4. Add comments to track this migration
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jordyn_users') THEN
    COMMENT ON TABLE jordyn_users IS 'Renamed from pokkit_users - stores user accounts and subscription data';
    COMMENT ON TABLE jordyn_memory IS 'Renamed from pokkit_memory - stores user context and conversation memory';
    COMMENT ON TABLE jordyn_conversations IS 'Renamed from pokkit_conversations - stores SMS conversation threads';
    COMMENT ON TABLE jordyn_tasks IS 'Renamed from pokkit_tasks - stores pending and completed tasks';
    COMMENT ON TABLE jordyn_reminders IS 'Renamed from pokkit_reminders - stores scheduled reminders';
    COMMENT ON TABLE jordyn_monitors IS 'Renamed from pokkit_monitors - stores price/availability monitors';
    COMMENT ON TABLE jordyn_monitor_log IS 'Renamed from pokkit_monitor_log - stores monitor check results';
    COMMENT ON TABLE jordyn_skills IS 'Renamed from pokkit_skills - stores available AI skills';
    COMMENT ON TABLE jordyn_skill_suggestions IS 'Renamed from pokkit_skill_suggestions - stores suggested new skills';
    COMMENT ON TABLE jordyn_events IS 'Renamed from pokkit_events - stores calendar events';
    COMMENT ON TABLE jordyn_actions IS 'Renamed from pokkit_actions - stores user action history';
    COMMENT ON TABLE jordyn_email_sends IS 'Renamed from pokkit_email_sends - stores email send history';
    COMMENT ON TABLE jordyn_browser_tasks IS 'Renamed from pokkit_browser_tasks - stores Browserbase automation tasks';
    COMMENT ON TABLE jordyn_voice_calls IS 'Renamed from pokkit_voice_calls - stores voice call records';
    RAISE NOTICE 'Added table comments';
  END IF;
END $$;

-- Note: RLS policies are automatically updated by PostgreSQL when tables are renamed.
-- Foreign key constraints are also automatically updated.
-- No manual policy or constraint updates needed.
