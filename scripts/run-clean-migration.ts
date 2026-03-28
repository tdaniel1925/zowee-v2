/**
 * Run clean migration - adds missing tables only
 * Run with: npx tsx scripts/run-clean-migration.ts
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL not found in .env.local')
  process.exit(1)
}

async function runMigration() {
  console.log('Running clean Pokkit migration...\n')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✓ Connected to Supabase database\n')

    console.log('Adding missing Pokkit tables...\n')

    // Enable UUID extension
    await client.query(`create extension if not exists "uuid-ossp";`)
    console.log('✓ UUID extension enabled')

    // Add missing tables with IF NOT EXISTS

    // Reminders
    await client.query(`
      create table if not exists pokkit_reminders (
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
      create index if not exists idx_reminders_status_time
        on pokkit_reminders(status, remind_at);
    `)
    console.log('✓ pokkit_reminders table created')

    // Monitors
    await client.query(`
      create table if not exists pokkit_monitors (
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
    `)
    console.log('✓ pokkit_monitors table created')

    // Monitor log
    await client.query(`
      create table if not exists pokkit_monitor_log (
        id uuid primary key default gen_random_uuid(),
        monitor_id uuid references pokkit_monitors(id) on delete cascade,
        checked_at timestamptz default now(),
        value_found text,
        threshold_met boolean default false,
        alert_sent boolean default false,
        error text,
        browserbase_session_id text
      );
    `)
    console.log('✓ pokkit_monitor_log table created')

    // Skills
    await client.query(`
      create table if not exists pokkit_skills (
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
    `)
    console.log('✓ pokkit_skills table created')

    // Skill suggestions
    await client.query(`
      create table if not exists pokkit_skill_suggestions (
        id uuid primary key default gen_random_uuid(),
        created_at timestamptz default now(),
        user_id uuid references pokkit_users(id),
        suggestion text not null,
        status text default 'pending',
        votes integer default 1
      );
    `)
    console.log('✓ pokkit_skill_suggestions table created')

    // Events
    await client.query(`
      create table if not exists pokkit_events (
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
    `)
    console.log('✓ pokkit_events table created')

    // Email sends log
    await client.query(`
      create table if not exists pokkit_email_sends (
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
    `)
    console.log('✓ pokkit_email_sends table created')

    // MLM connectors config
    await client.query(`
      create table if not exists pokkit_mlm_connectors (
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
    `)
    console.log('✓ pokkit_mlm_connectors table created')

    // Seed Apex connector if not exists
    await client.query(`
      insert into pokkit_mlm_connectors (name, display_name, webhook_url, webhook_secret)
      values ('apex_affinity', 'Apex Affinity Group',
        'https://agentpulse.apexaffinity.com/api/pokkit/events',
        'REPLACE_WITH_SECRET')
      on conflict (name) do nothing;
    `)
    console.log('✓ Apex Affinity connector seeded')

    // Add missing columns to existing tables if needed
    await client.query(`
      alter table pokkit_users add column if not exists phone_number text unique;
      alter table pokkit_users add column if not exists pokkit_number text unique;
      alter table pokkit_users add column if not exists plan text default 'solo';
      alter table pokkit_users add column if not exists plan_status text default 'trialing';
      alter table pokkit_users add column if not exists trial_ends_at timestamptz;
      alter table pokkit_users add column if not exists trial_sequence_day integer default 0;
      alter table pokkit_users add column if not exists stripe_customer_id text;
      alter table pokkit_users add column if not exists stripe_subscription_id text;
      alter table pokkit_users add column if not exists rep_code text;
      alter table pokkit_users add column if not exists mlm_connector text default 'apex_affinity';
      alter table pokkit_users add column if not exists preferences jsonb default '{}';
      alter table pokkit_users add column if not exists contacts jsonb default '[]';
      alter table pokkit_users add column if not exists timezone text default 'America/Chicago';
      alter table pokkit_users add column if not exists morning_briefing_time text;
      alter table pokkit_users add column if not exists morning_briefing_enabled boolean default false;
      alter table pokkit_users add column if not exists location text;
      alter table pokkit_users add column if not exists last_interaction_at timestamptz;
      alter table pokkit_users add column if not exists onboarding_complete boolean default false;
    `)
    console.log('✓ pokkit_users updated with missing columns')

    // Enable RLS on new tables
    await client.query(`
      alter table pokkit_reminders enable row level security;
      alter table pokkit_monitors enable row level security;
      alter table pokkit_events enable row level security;
    `)
    console.log('✓ RLS policies enabled')

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Migration completed successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\nAll Pokkit tables are now ready.\n')

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error running migration:', error.message)
    }
    throw error
  } finally {
    await client.end()
  }
}

runMigration()
  .then(() => {
    console.log('✓ Database migration complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to run migration')
    process.exit(1)
  })
