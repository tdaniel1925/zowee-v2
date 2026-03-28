-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users
create table zowee_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text,
  phone_number text unique not null,
  zowee_number text unique,
  plan text default 'solo',
  plan_status text default 'trialing',
  trial_ends_at timestamptz,
  trial_sequence_day integer default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  rep_code text,
  mlm_connector text default 'apex_affinity',
  preferences jsonb default '{}',
  contacts jsonb default '[]',
  timezone text default 'America/Chicago',
  morning_briefing_time text,
  morning_briefing_enabled boolean default false,
  location text,
  last_interaction_at timestamptz,
  onboarding_complete boolean default false
);

-- Memory
create table zowee_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references zowee_users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  category text not null,
  key text,
  value text not null,
  source text default 'conversation',
  active boolean default true
);

-- Conversations
create table zowee_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references zowee_users(id) on delete cascade,
  created_at timestamptz default now(),
  channel text default 'sms',
  direction text not null,
  message_in text,
  message_out text,
  intent text,
  skill_used text,
  summary text,
  twilio_sid text,
  processing_ms integer
);

-- Task queue (Twin reads and writes this)
create table zowee_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid references zowee_users(id) on delete cascade,
  type text not null,
  status text default 'pending',
  priority integer default 5,
  input jsonb default '{}',
  result jsonb,
  error text,
  attempts integer default 0,
  claimed_at timestamptz,
  completed_at timestamptz
);

create index idx_tasks_status_type
  on zowee_tasks(status, type, created_at);

-- Reminders
create table zowee_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references zowee_users(id) on delete cascade,
  created_at timestamptz default now(),
  title text not null,
  notes text,
  remind_at timestamptz not null,
  channel text default 'sms',
  recurring text,
  recurring_end_at timestamptz,
  status text default 'pending',
  sent_at timestamptz
);

create index idx_reminders_status_time
  on zowee_reminders(status, remind_at);

-- Monitors
create table zowee_monitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references zowee_users(id) on delete cascade,
  created_at timestamptz default now(),
  type text not null,
  label text,
  origin text,
  destination text,
  trip_type text,
  date_flexibility text,
  target_url text,
  target_product text,
  monitor_url text,
  monitor_element text,
  threshold numeric,
  threshold_direction text default 'below',
  threshold_unit text,
  alert_channel text default 'sms',
  alert_frequency text default 'once',
  status text default 'active',
  check_frequency text default 'daily',
  last_checked_at timestamptz,
  last_value text,
  last_value_at timestamptz,
  alert_count integer default 0,
  last_alert_at timestamptz
);

-- Monitor log
create table zowee_monitor_log (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid references zowee_monitors(id) on delete cascade,
  checked_at timestamptz default now(),
  value_found text,
  threshold_met boolean default false,
  alert_sent boolean default false,
  error text,
  browserbase_session_id text
);

-- Skills
create table zowee_skills (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text unique not null,
  description text,
  trigger_phrases jsonb default '[]',
  tools_required jsonb default '[]',
  browserbase_script text,
  system_prompt_addition text,
  active boolean default true,
  plan_required text default 'solo',
  created_by text default 'system',
  use_count integer default 0,
  success_rate numeric default 100,
  version integer default 1
);

-- Skill suggestions
create table zowee_skill_suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid references zowee_users(id),
  suggestion text not null,
  status text default 'pending',
  votes integer default 1
);

-- Events (internal calendar)
create table zowee_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references zowee_users(id) on delete cascade,
  created_at timestamptz default now(),
  title text not null,
  event_at timestamptz not null,
  notes text,
  location text,
  reminder_minutes_before integer default 60,
  reminder_sent boolean default false
);

-- Actions log
create table zowee_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references zowee_users(id) on delete cascade,
  created_at timestamptz default now(),
  type text not null,
  status text default 'completed',
  task_description text,
  result text,
  target_name text,
  target_url text,
  confirmation_number text
);

-- Email sends log
create table zowee_email_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references zowee_users(id) on delete cascade,
  created_at timestamptz default now(),
  to_address text not null,
  subject text not null,
  body_html text,
  body_text text,
  type text default 'user_requested',
  resend_id text,
  status text default 'sent'
);

-- MLM connectors config
create table zowee_mlm_connectors (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  display_name text,
  webhook_url text not null,
  webhook_secret text not null,
  rep_direct_solo numeric default 7.50,
  rep_direct_family numeric default 10.00,
  botmakers_amount numeric default 2.00,
  override_pool_solo numeric default 5.50,
  override_pool_family numeric default 12.00,
  override_levels jsonb default '[30,25,20,15,10]',
  active boolean default true
);

-- Seed Apex connector
insert into zowee_mlm_connectors (name, display_name,
  webhook_url, webhook_secret)
values ('apex_affinity', 'Apex Affinity Group',
  'https://agentpulse.apexaffinity.com/api/zowee/events',
  'REPLACE_WITH_SECRET');

-- RLS Policies
alter table zowee_users enable row level security;
alter table zowee_memory enable row level security;
alter table zowee_conversations enable row level security;
alter table zowee_tasks enable row level security;
alter table zowee_reminders enable row level security;
alter table zowee_monitors enable row level security;
alter table zowee_events enable row level security;

-- Service role bypasses RLS (Twin uses service role)
-- Anon/auth users can only see their own data
create policy "Users see own data" on zowee_users
  for select using (auth.uid()::text = id::text);
