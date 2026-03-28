-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users
create table pokkit_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text,
  phone_number text unique not null,
  pokkit_number text unique,
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
create table pokkit_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references pokkit_users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  category text not null,
  key text,
  value text not null,
  source text default 'conversation',
  active boolean default true
);

-- Conversations
create table pokkit_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references pokkit_users(id) on delete cascade,
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
create table pokkit_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid references pokkit_users(id) on delete cascade,
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
  on pokkit_tasks(status, type, created_at);

-- Reminders
create table pokkit_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references pokkit_users(id) on delete cascade,
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
  on pokkit_reminders(status, remind_at);

-- Monitors
create table pokkit_monitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references pokkit_users(id) on delete cascade,
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
create table pokkit_monitor_log (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid references pokkit_monitors(id) on delete cascade,
  checked_at timestamptz default now(),
  value_found text,
  threshold_met boolean default false,
  alert_sent boolean default false,
  error text,
  browserbase_session_id text
);

-- Skills
create table pokkit_skills (
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
create table pokkit_skill_suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid references pokkit_users(id),
  suggestion text not null,
  status text default 'pending',
  votes integer default 1
);

-- Events (internal calendar)
create table pokkit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references pokkit_users(id) on delete cascade,
  created_at timestamptz default now(),
  title text not null,
  event_at timestamptz not null,
  notes text,
  location text,
  reminder_minutes_before integer default 60,
  reminder_sent boolean default false
);

-- Actions log
create table pokkit_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references pokkit_users(id) on delete cascade,
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
create table pokkit_email_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references pokkit_users(id) on delete cascade,
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
create table pokkit_mlm_connectors (
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
insert into pokkit_mlm_connectors (name, display_name,
  webhook_url, webhook_secret)
values ('apex_affinity', 'Apex Affinity Group',
  'https://agentpulse.apexaffinity.com/api/pokkit/events',
  'REPLACE_WITH_SECRET');

-- RLS Policies
alter table pokkit_users enable row level security;
alter table pokkit_memory enable row level security;
alter table pokkit_conversations enable row level security;
alter table pokkit_tasks enable row level security;
alter table pokkit_reminders enable row level security;
alter table pokkit_monitors enable row level security;
alter table pokkit_events enable row level security;

-- Service role bypasses RLS (Twin uses service role)
-- Anon/auth users can only see their own data
create policy "Users see own data" on pokkit_users
  for select using (auth.uid()::text = id::text);
