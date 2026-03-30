-- Complete cleanup of orphaned Auth users and ALL 35 dependent tables
-- Deletes in correct order to avoid foreign key violations

DO $$
DECLARE
  subscriber_ids uuid[];
BEGIN
  -- Get all subscriber IDs linked to orphaned auth users
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
      SELECT 1 FROM public.jordyn_users WHERE auth_user_id = auth.users.id
    )
  );

  RAISE NOTICE 'Found % subscriber IDs to clean up', array_length(subscriber_ids, 1);

  -- Delete from all 35 dependent tables (child tables first)
  DELETE FROM public.admin_alerts WHERE subscriber_id = ANY(subscriber_ids) OR resolved_by = ANY(subscriber_ids);
  DELETE FROM public.agents WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.apex_commissions WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.appointments WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.call_logs WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.call_summaries WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.calls WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.campaign_emails WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.campaigns WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.commands_log WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.contacts WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.control_states WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.cost_events WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.email_connection_tokens WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.email_connections WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.email_drafts WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.email_inbound_log WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.email_summaries WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.feature_flags WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.leads WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.messages WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.pending_approvals WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.scheduled_posts WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.sms_commands WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.sms_logs WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.subscriber_apps WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.subscriber_phone_numbers WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.subscriber_usage WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.task_performance WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.trial_conversions WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.unknown_requests WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.upgrade_events WHERE subscriber_id = ANY(subscriber_ids);
  DELETE FROM public.weekly_scorecards WHERE subscriber_id = ANY(subscriber_ids);

  RAISE NOTICE 'Deleted from all 35 dependent tables';

  -- Now safe to delete from subscribers
  DELETE FROM public.subscribers WHERE id = ANY(subscriber_ids);
  RAISE NOTICE 'Deleted from subscribers table';

  -- Finally delete from auth.users
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
    SELECT 1 FROM public.jordyn_users WHERE auth_user_id = auth.users.id
  );

  RAISE NOTICE 'Deleted from auth.users - CLEANUP COMPLETE';
END $$;
