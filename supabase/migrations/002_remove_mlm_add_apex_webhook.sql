-- Remove MLM-related columns from users table
alter table zowee_users drop column if exists rep_code;
alter table zowee_users drop column if exists mlm_connector;

-- Drop MLM connector table
drop table if exists zowee_mlm_connectors;

-- Create Apex webhook log table
create table apex_webhook_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  event_type text not null,
  user_id uuid references zowee_users(id) on delete set null,
  payload jsonb not null,
  response_status integer,
  response_body text,
  error text,
  attempts integer default 1,
  sent_at timestamptz default now(),
  succeeded boolean default false
);

create index idx_apex_webhook_log_event_type
  on apex_webhook_log(event_type, created_at desc);

create index idx_apex_webhook_log_user
  on apex_webhook_log(user_id, created_at desc);

-- Enable RLS on webhook log (only admins can see this)
alter table apex_webhook_log enable row level security;

-- No user-level access to webhook logs (service role only)
create policy "Service role only" on apex_webhook_log
  for all using (false);

-- Comments for documentation
comment on table apex_webhook_log is 'Tracks all webhook events sent to Apex Affinity system for customer tracking and commission calculation';
comment on column apex_webhook_log.event_type is 'Type of event: signup, trial_start, trial_convert, subscription_active, subscription_cancelled, plan_change';
comment on column apex_webhook_log.payload is 'Full JSON payload sent to Apex';
comment on column apex_webhook_log.succeeded is 'True if Apex responded with 200-299 status code';
