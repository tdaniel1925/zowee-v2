-- Force delete orphaned Auth users and ALL related records
-- Run this in Supabase SQL Editor

-- Get subscriber IDs first
DO $$
DECLARE
  subscriber_ids uuid[];
BEGIN
  -- Find all subscriber IDs linked to orphaned auth users
  SELECT ARRAY_AGG(s.id) INTO subscriber_ids
  FROM public.subscribers s
  WHERE s.auth_user_id IN (
    SELECT id FROM auth.users
    WHERE email IN (
      'trenttdaniel@gmail.com',
      'info@tonnerow.com',
      'tdaniel@bundlefly.com',
      'deannarstepp@gmail.com',
      'sellag.sb@gmail.com',
      'tdaniel@botmakers.ai'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.jordyn_users
      WHERE auth_user_id = auth.users.id
    )
  );

  -- Delete from commands_log (references subscribers)
  DELETE FROM public.commands_log WHERE subscriber_id = ANY(subscriber_ids);
  RAISE NOTICE 'Deleted from commands_log';

  -- Delete from unknown_requests (references subscribers)
  DELETE FROM public.unknown_requests WHERE subscriber_id = ANY(subscriber_ids);
  RAISE NOTICE 'Deleted from unknown_requests';

  -- Delete from subscribers
  DELETE FROM public.subscribers WHERE id = ANY(subscriber_ids);
  RAISE NOTICE 'Deleted from subscribers';

  -- Delete from auth.users
  DELETE FROM auth.users
  WHERE email IN (
    'trenttdaniel@gmail.com',
    'info@tonnerow.com',
    'tdaniel@bundlefly.com',
    'deannarstepp@gmail.com',
    'sellag.sb@gmail.com',
    'tdaniel@botmakers.ai'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.jordyn_users
    WHERE auth_user_id = auth.users.id
  );
  RAISE NOTICE 'Deleted from auth.users';

END $$;
