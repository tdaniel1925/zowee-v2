# POKKIT — PROJECT SPEC v3.0
## "Delete Your Apps. Text Pokkit."
### BotMakers Inc. | Claude Code Build Package | Confidential

---

## THE PRODUCT IN ONE SENTENCE

Pokkit is a personal AI assistant that lives on a phone number. Text it anything — it books your travel, tracks prices, monitors the web, drafts emails, sets reminders, researches anything, and handles the tasks you currently use a dozen different apps for. One text. Everything handled. $15/month.

---

## THE POSITIONING

**Category:** App replacement platform disguised as an AI assistant
**Tagline:** "Delete your apps. Text Pokkit."
**Price:** $15/month
**Interface:** SMS and WhatsApp only — no app, no login, no screen required
**Distribution:** Apex Affinity Group MLM rep network + pluggable MLM connector

**What Pokkit replaces:**
Expedia, Priceline, Kayak, OpenTable, Resy, Hotels.com, Booking.com, Honey, GasBuddy, Google Alerts, Flighty, Yelp, TripAdvisor, reminder apps, note apps, price trackers, flight alert services — all replaced by one text message.

---

## CORE PRINCIPLES

1. SMS first — always. No app. No login. Any phone made in the last 20 years.
2. Proactive — Pokkit initiates. Morning briefings, price alerts, reminders, monitoring.
3. Zero friction onboarding — name, phone, card only at signup. Everything else just-in-time.
4. Async first — long tasks run in background. User gets notified when done.
5. Skills expand continuously — new capabilities added weekly without user doing anything.
6. Dynamic skill learning — Pokkit builds new skills from user requests autonomously.
7. Email as output only — Pokkit sends reports and drafts. No inbox reading at launch.
8. Monitoring is core — set-and-forget watching for conditions the user cares about.

---

## TECH STACK

```
SMS/WhatsApp          Twilio
Simple callbacks      Twilio TTS (Polly)
AI brain              Claude (claude-sonnet-4-5 via Anthropic API)
Browser automation    Browserbase + Stagehand
Scheduled jobs        Vercel Cron (recurring)
Async job queue       QStash by Upstash (triggered jobs)
Database              Supabase (PostgreSQL + Auth + Storage)
Email sending         Resend
Billing               Stripe
Backend               Next.js 14 API routes
Frontend              Next.js 14 App Router
Hosting               Vercel
MLM connector         Webhook → Apex AgentPulse (pluggable)
```

**NOT in stack:**
- VAPI (no interactive voice at launch)
- ElevenLabs (Twilio Polly sufficient for callbacks)
- Inngest (replaced by Vercel Cron + QStash)
- Railway (no separate worker needed)
- Nylas (no inbox reading at launch)
- Twin (not needed)

---

## ENVIRONMENT VARIABLES

```env
# Reused from Jordyn
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=

# Pokkit specific
ANTHROPIC_API_KEY=
BROWSERBASE_API_KEY=
QSTASH_URL=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
POKKIT_FROM_EMAIL=hello@mail.pokkit.ai
NEXT_PUBLIC_APP_URL=https://pokkit.ai
APEX_WEBHOOK_URL=
APEX_WEBHOOK_SECRET=
CRON_SECRET=
```

---

## PRICING & COMPENSATION

### Plans
| Plan | Price | What's included |
|------|-------|-----------------|
| Solo | $15/month | 1 number, full skill set, monitoring, research |
| Family | $29/month | Up to 6 numbers, shared monitoring pool |

### Free trial
- 14-day free trial with card on file
- No charge until day 15
- Cancel anytime by texting CANCEL
- One trial per phone number enforced

### Compensation structure (Option C)
```
$15.00 gross revenue
- $7.50 rep direct commission (flat, always paid)
- $2.00 BotMakers infrastructure guarantee
= $5.50 override pool distributed across 5 levels
```

### Override pool distribution
| Level | Rate | Per subscriber/month |
|-------|------|---------------------|
| L1 | 30% | $1.65 |
| L2 | 25% | $1.38 |
| L3 | 20% | $1.10 |
| L4 | 15% | $0.83 |
| L5 | 10% | $0.55 |

### Breakage
- Unfilled matrix positions generate breakage
- Breakage split: BotMakers 60% / Apex 40%
- Average breakage: ~$1.38/subscriber/month
- Enroller override rule: personally enrolled subscribers always pay L1 rate ($1.65) regardless of matrix position

### Unit economics
| Item | Amount |
|------|--------|
| Gross revenue | $15.00 |
| COGS | ~$1.50 |
| Gross margin | $13.50 (90%) |

---

## DATABASE SCHEMA

### pokkit_users
```sql
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
  stripe_customer_id text,
  stripe_subscription_id text,
  rep_code text,
  mlm_connector text default 'apex_affinity',
  preferences jsonb default '{}',
  contacts jsonb default '[]',
  timezone text default 'America/Chicago',
  morning_briefing_time text,
  morning_briefing_enabled boolean default false,
  last_interaction_at timestamptz,
  onboarding_complete boolean default false
);
```

### pokkit_memory
```sql
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
```

### pokkit_conversations
```sql
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
```

### pokkit_tasks
```sql
create table pokkit_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references pokkit_users(id) on delete cascade,
  created_at timestamptz default now(),
  type text not null,
  status text default 'pending',
  priority integer default 5,
  input jsonb,
  result jsonb,
  error text,
  attempts integer default 0,
  qstash_message_id text,
  completed_at timestamptz,
  notify_on_complete boolean default true
);
```

### pokkit_reminders
```sql
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
```

### pokkit_monitors
```sql
create table pokkit_monitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references pokkit_users(id) on delete cascade,
  created_at timestamptz default now(),
  type text not null,
  label text,
  -- Flight monitoring
  origin text,
  destination text,
  trip_type text,
  date_flexibility text,
  -- Price monitoring
  target_url text,
  target_product text,
  -- Generic web monitoring
  monitor_url text,
  monitor_element text,
  -- Thresholds
  threshold numeric,
  threshold_direction text default 'below',
  threshold_unit text,
  -- Delivery
  alert_channel text default 'sms',
  alert_frequency text default 'once',
  -- State
  status text default 'active',
  check_frequency text default 'daily',
  last_checked_at timestamptz,
  last_value text,
  last_value_at timestamptz,
  alert_count integer default 0,
  last_alert_at timestamptz
);
```

### pokkit_monitor_log
```sql
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
```

### pokkit_skills
```sql
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
```

### pokkit_skill_suggestions
```sql
create table pokkit_skill_suggestions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid references pokkit_users(id),
  suggestion text not null,
  status text default 'pending',
  votes integer default 1
);
```

### pokkit_events
```sql
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
```

### pokkit_email_sends
```sql
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
```

### pokkit_account_connections
```sql
create table pokkit_account_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references pokkit_users(id) on delete cascade,
  created_at timestamptz default now(),
  service text not null,
  connection_type text not null,
  connection_id text not null,
  metadata jsonb default '{}',
  status text default 'active',
  last_used_at timestamptz
);
```

### pokkit_mlm_connectors
```sql
create table pokkit_mlm_connectors (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  display_name text,
  webhook_url text not null,
  webhook_secret text not null,
  rep_direct_amount numeric default 7.50,
  botmakers_amount numeric default 2.00,
  override_pool_amount numeric default 5.50,
  override_levels jsonb default '[30,25,20,15,10]',
  active boolean default true
);
```

---

## CORE ARCHITECTURE

### SMS Processing Flow
```
User texts Pokkit number
  → Twilio webhook → POST /api/twilio/sms
  → Validate Twilio signature
  → Load user by phone number
  → If unknown number → onboarding flow
  → Build context:
      - User profile + preferences
      - Recent conversation history (last 10)
      - Active monitors summary
      - Active reminders
      - Memory items
  → Send to Claude with full context + tool definitions
  → Claude determines intent + calls tools
  → Simple tasks: respond immediately
  → Background tasks: queue via QStash + respond "On it"
  → Save conversation to pokkit_conversations
  → Return Twilio TwiML response
```

### Background Job Flow (QStash)
```
Task queued to QStash
  → QStash delivers to /api/jobs/[type]
  → Job executes (research, monitor check, etc)
  → Result saved to pokkit_tasks
  → SMS sent to user with result
  → Twilio TTS callback if configured
```

### Monitoring Flow (Vercel Cron)
```
Vercel Cron fires every 15 minutes
  → /api/cron/check-monitors
  → Load all active monitors due for check
  → For each monitor:
      → Dispatch QStash job
  → QStash delivers to /api/jobs/monitor-check
  → Browserbase + Stagehand checks target
  → Compare to threshold/previous value
  → If condition met → SMS alert to user
  → Log to pokkit_monitor_log
```

---

## API ROUTES

### Twilio
```
POST /api/twilio/sms              — Inbound SMS webhook
POST /api/twilio/sms-status       — Delivery status callback
```

### Jobs (QStash receivers)
```
POST /api/jobs/research           — Multi-item research + email report
POST /api/jobs/monitor-check      — Single monitor check via Browserbase
POST /api/jobs/email-send         — Draft + send email via Resend
POST /api/jobs/reminder-send      — Send due reminder SMS
POST /api/jobs/morning-briefing   — Compile + send morning briefing
POST /api/jobs/outbound-notify    — Simple TTS callback notification
POST /api/jobs/skill-build        — Dynamic skill construction (Phase 2)
```

### Cron (Vercel Cron)
```
GET /api/cron/check-monitors      — Every 15 min — dispatch monitor jobs
GET /api/cron/check-reminders     — Every 5 min — dispatch reminder jobs
GET /api/cron/morning-briefings   — Every hour — dispatch due briefings
GET /api/cron/trial-expiring      — Daily — notify expiring trials
```

### Stripe
```
POST /api/stripe/webhook          — Payment events
GET  /api/stripe/portal           — Customer portal redirect
POST /api/stripe/checkout         — Create checkout session
```

### Apex MLM
```
POST /api/apex/webhook            — Receive rep status updates
GET  /api/apex/events             — Apex pulls commission events
```

### User Dashboard
```
GET  /api/user/profile            — Get user profile
PUT  /api/user/profile            — Update preferences
GET  /api/user/monitors           — List active monitors
DELETE /api/user/monitors/[id]    — Cancel monitor
GET  /api/user/reminders          — List reminders
GET  /api/user/history            — Conversation history
GET  /api/user/usage              — Usage stats
```

---

## CLAUDE SYSTEM PROMPT

```
You are Pokkit, the personal AI assistant for {{user_name}}.

PERSONALITY:
- Warm, capable, direct, slightly playful
- Never robotic or corporate
- Get things done fast
- Make the user feel great about asking anything
- Use their name occasionally but not excessively
- Brief responses — this is SMS not email
- Confirm before acting on anything consequential

ABOUT {{user_name}}:
{{user_profile_block}}

THEIR CONTACTS:
{{contacts_block}}

THEIR ACTIVE MONITORS:
{{monitors_block}}

RECENT CONTEXT:
{{recent_conversations_block}}

MEMORY:
{{memory_block}}

TODAY: {{current_date}} | TIMEZONE: {{user_timezone}}

YOUR CAPABILITIES:
You can handle almost anything via the tools below.
When you don't have a tool for something — attempt it
via web research or be honest about the limitation.

RESPONSE RULES:
- Keep SMS responses under 160 chars when possible
- For longer info use multiple messages or offer email
- Always confirm before booking, buying, or transacting
- For monitoring requests confirm: what, threshold, frequency
- For research requests confirm: items, delivery email
- Never make up information — search if unsure
- If user asks for something you can build as a skill
  attempt it and save for future use

TOOLS:
{{tools_block}}
```

---

## TOOL DEFINITIONS

```typescript
// Memory tools
save_memory(category, key, value)
get_memory(category?, key?)
save_contact(name, phone, relationship?)
get_contacts()

// Task management
add_task(title, list_type?)        // todo | someday
list_tasks(list_type?)
complete_task(id)

// Calendar
add_event(title, event_at, notes?, location?)
list_events(date_range?)
delete_event(id)

// Reminders
set_reminder(title, remind_at, channel?, notes?)
set_recurring_reminder(title, frequency, time, channel?)
list_reminders()
cancel_reminder(id)

// Research
queue_research(items[], deliver_to_email)
// Queues QStash job → Claude researches each item
// Compiles report → Resend delivers to email
// SMS: "Your report on X items is ready — check email"

// Monitoring
create_monitor(type, params, threshold?, frequency?)
list_monitors()
update_monitor(id, params)
cancel_monitor(id)

// Browser tasks
queue_browser_task(task_description, target_url?)
// Queues QStash job → Browserbase + Stagehand
// Executes task → returns result
// SMS user with confirmation

// Email
draft_email(to, subject_hint, content_intent)
// Claude drafts → sends preview via SMS
// User approves → Resend sends
send_email(to, subject, body)

// Information (direct — no async needed)
search_web(query)
get_weather(location)
get_flight_status(flight_number)
get_stock_price(ticker)
calculate(expression)
convert_units(value, from_unit, to_unit)
translate(text, target_language)

// Notifications
send_sms(message)              // Send to user
send_tts_callback(message)     // Twilio TTS call to user

// Skills
suggest_skill(description)     // Log skill suggestion
```

---

## VERCEL CRON CONFIGURATION

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/check-monitors",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/check-reminders",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/morning-briefings",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/trial-expiring",
      "schedule": "0 10 * * *"
    }
  ]
}
```

---

## QSTASH JOB PATTERNS

```typescript
// Queue a research job
import { Client } from "@upstash/qstash"
const qstash = new Client({ token: process.env.QSTASH_TOKEN })

await qstash.publishJSON({
  url: `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/research`,
  body: {
    userId,
    items: researchItems,
    deliverTo: userEmail,
    taskId
  }
})

// Queue a monitor check
await qstash.publishJSON({
  url: `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/monitor-check`,
  body: { monitorId }
})

// Schedule a reminder (delayed delivery)
await qstash.publishJSON({
  url: `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/reminder-send`,
  body: { reminderId },
  notBefore: Math.floor(reminderTime.getTime() / 1000)
})
```

---

## LAUNCH SKILL SET

### Tier 1 — Works immediately (no browser needed)
- General Q&A and conversation
- Weather lookup
- News briefing
- Stock prices
- Flight status by number
- Sports scores
- Unit conversion
- Calculator and tip splitting
- Translation
- Reminders (one-time and recurring)
- Task and to-do list management
- Internal calendar events
- Contact book management
- Memory storage and retrieval
- Morning briefing (weather + news + events)
- Email drafting and sending via Resend
- Multi-item research reports via email

### Tier 2 — Browser tasks (Browserbase)
- Restaurant search and recommendation
- Restaurant reservation (OpenTable, Resy, direct)
- Hotel search and price comparison
- Flight search and price comparison
- Amazon order status
- Product price lookup
- Package tracking
- Business hours and information
- Local service provider search

### Tier 3 — Monitoring (Browserbase + Cron)
- Flight price monitors (alert below threshold)
- Hotel price monitors
- Product price monitors (any website)
- Amazon price drop alerts
- Competitor website change monitors
- Gas price monitors
- General web page change monitors
- News topic monitors
- Sports score alerts
- Weather event alerts

---

## MONITORING ARCHITECTURE

### Browserbase + Stagehand monitor script pattern
```typescript
import { Stagehand } from '@browserbasehq/stagehand'

export async function runMonitorCheck(monitor: Monitor) {
  const stagehand = new Stagehand({
    env: 'BROWSERBASE',
    apiKey: process.env.BROWSERBASE_API_KEY
  })

  try {
    await stagehand.init()

    switch (monitor.type) {
      case 'flight_price':
        return await checkFlightPrice(stagehand, monitor)
      case 'product_price':
        return await checkProductPrice(stagehand, monitor)
      case 'website_change':
        return await checkWebsiteChange(stagehand, monitor)
      case 'hotel_price':
        return await checkHotelPrice(stagehand, monitor)
    }
  } finally {
    await stagehand.close()
  }
}

async function checkFlightPrice(stagehand, monitor) {
  await stagehand.page.goto('https://www.google.com/flights')
  await stagehand.page.act(
    `Search round trip from ${monitor.origin} 
     to ${monitor.destination} 
     for ${monitor.date_flexibility}`
  )
  const result = await stagehand.page.extract(
    'Get the lowest available price and the 
     flight details for that price'
  )
  return {
    value: result.lowest_price,
    details: result.flight_details
  }
}
```

---

## ONBOARDING FLOW

### Signup (pokkit.ai/[repcode] or pokkit.ai)
```
Step 1: Enter name + mobile number
Step 2: Enter payment (Stripe — card saved, not charged)
Step 3: Pokkit number provisioned (Twilio)
Step 4: 14-day trial begins

Welcome SMS:
"Hey [Name]! I'm Pokkit — your personal assistant.
I replace Expedia, OpenTable, Kayak, price trackers,
and a dozen other apps. Just text me anything.
Try: 'Find me a flight to Dallas under $200 this weekend'
or 'Remind me to call my accountant tomorrow at 9am' 🎉"
```

### Trial engagement sequence
```
Day 0:  Welcome SMS (above)
Day 1:  "Quick tip: Text me 'monitor [product] 
         under $[price]' and I'll alert you 
         the moment it drops. Try it for anything."
Day 3:  "Try texting me a list of things you need
         researched — I'll email you a full report
         while you go do other things."
Day 7:  "You're halfway through your free trial.
         What's the most useful thing I've done
         for you so far? (Just reply — I'm curious)"
Day 10: "3 things Pokkit users do most:
         1. Monitor flight prices 
         2. Book restaurants instantly
         3. Research anything by text
         Try any of these today."
Day 12: "Your free trial ends in 2 days.
         After that it's $15/month — less than 
         one Starbucks a week. Your card on file
         will be charged [date] unless you text CANCEL."
Day 13: "Last day of your free trial! Text CANCEL
         before midnight to avoid being charged.
         Otherwise I'll be here every day handling
         things for you."
Day 15: "Your Pokkit subscription is active — $15/month.
         Thanks for staying! Text me anything anytime."
```

### Just-in-time account connections
```
User requests Amazon order status
  → "To check Amazon orders I need you to log in once.
     Tap this secure link — takes 60 seconds.
     I'll remember it forever after: [link]"

User requests email draft + send
  → "Where should I send emails from?
     Reply with your email address and I'll send
     from pokkit@mail.pokkit.ai with your name.
     Or tap here to connect your Gmail: [link]"

User requests booking that needs payment
  → "To book this I'll need a card on file.
     Tap here to add one securely via Stripe: [link]
     Your real card number never touches Pokkit."
```

---

## DYNAMIC SKILL BUILDING (Phase 2 — Month 3+)

### How it works
```
User requests something Pokkit can't do
  → Claude evaluates feasibility
  → If feasible: design skill definition
  → Spin up Claude Code agent
  → Claude Code writes Browserbase/API script
  → Test in sandbox (3 attempts max)
  → If passes: save to pokkit_skills, status: active
  → Execute for requesting user immediately
  → After 10 successful uses: available to all users
  → Log to skill library

If fails after 3 attempts:
  → Log to skill_suggestions with status: needs_human_review
  → Notify user: "I couldn't figure that out yet —
     I've added it to my learning list and will
     let you know when I can do it."
```

---

## MLM CONNECTOR ARCHITECTURE

### Pluggable connector pattern
```typescript
// pokkit_mlm_connectors table stores config per MLM partner
// On subscription events → fire webhook to configured URL

async function fireMLMEvent(
  userId: string,
  eventType: 'new_subscription' | 'renewal' | 'upgrade' | 'cancellation'
) {
  const user = await getUser(userId)
  const connector = await getConnector(user.mlm_connector)
  if (!connector?.active) return

  const payload = {
    event: eventType,
    rep_code: user.rep_code,
    user_id: userId,
    plan: user.plan,
    mrr: getPlanMRR(user.plan),
    rep_direct: connector.rep_direct_amount,
    timestamp: new Date().toISOString()
  }

  await fetch(connector.webhook_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': connector.webhook_secret
    },
    body: JSON.stringify(payload)
  })
}
```

---

## FILE STRUCTURE

```
/apps/pokkit
├── app/
│   ├── page.tsx                    # Landing page
│   ├── [repcode]/page.tsx          # Rep referral landing
│   ├── account/page.tsx            # User dashboard
│   ├── dashboard/
│   │   └── rep/page.tsx            # Rep portal
│   └── api/
│       ├── twilio/
│       │   ├── sms/route.ts        # Inbound SMS
│       │   └── sms-status/route.ts
│       ├── jobs/
│       │   ├── research/route.ts
│       │   ├── monitor-check/route.ts
│       │   ├── email-send/route.ts
│       │   ├── reminder-send/route.ts
│       │   ├── morning-briefing/route.ts
│       │   └── outbound-notify/route.ts
│       ├── cron/
│       │   ├── check-monitors/route.ts
│       │   ├── check-reminders/route.ts
│       │   ├── morning-briefings/route.ts
│       │   └── trial-expiring/route.ts
│       ├── stripe/
│       │   ├── webhook/route.ts
│       │   ├── portal/route.ts
│       │   └── checkout/route.ts
│       ├── apex/
│       │   ├── webhook/route.ts
│       │   └── events/route.ts
│       └── user/
│           ├── profile/route.ts
│           ├── monitors/route.ts
│           └── history/route.ts
├── lib/
│   ├── twilio.ts                   # Twilio client + helpers
│   ├── claude.ts                   # Anthropic client
│   ├── browserbase.ts              # Browserbase + Stagehand
│   ├── qstash.ts                   # QStash client
│   ├── supabase.ts                 # Supabase client
│   ├── stripe.ts                   # Stripe client
│   ├── resend.ts                   # Resend client
│   ├── prompt-builder.ts           # Dynamic system prompt
│   ├── context-loader.ts           # User context loader
│   ├── mlm-connector.ts            # MLM webhook fire
│   └── tools/
│       ├── memory.ts
│       ├── reminders.ts
│       ├── calendar.ts
│       ├── monitors.ts
│       ├── research.ts
│       ├── browser.ts
│       ├── email.ts
│       ├── info.ts
│       └── index.ts                # Tool registry
├── monitors/
│   ├── flight-price.ts             # Stagehand scripts
│   ├── product-price.ts
│   ├── hotel-price.ts
│   ├── website-change.ts
│   └── gas-price.ts
├── supabase/
│   └── migrations/
│       └── 001_pokkit_schema.sql
├── public/
│   └── (landing page assets)
├── vercel.json                     # Cron config
├── .env.local
├── CLAUDE.md
└── PROJECT-SPEC.md
```

---

## CLAUDE.md

```markdown
# POKKIT — Claude Code Instructions

## What This Is
Pokkit: personal AI assistant on a phone number.
SMS only. No app. Replaces Expedia, OpenTable, Kayak,
price trackers, reminder apps — all via text.
$15/month. 14-day free trial. Apex MLM distribution.

## Stack
Twilio (SMS) + Claude (AI) + Browserbase (web tasks)
+ Vercel Cron (scheduling) + QStash (async jobs)
+ Supabase (database) + Resend (email) + Stripe (billing)
Reuses Jordyn credentials for Twilio, Supabase, Stripe, Resend.

## Critical Rules
1. NEVER hardcode credentials — always process.env
2. NEVER hardcode commission values — always load from DB
3. Validate Twilio signatures on every webhook
4. Validate QStash signatures on every job endpoint
5. RLS on all Supabase tables — service role for server ops
6. Always confirm before booking, buying, or transacting
7. One trial per phone number — enforce in DB
8. Commission events fire to MLM connector on every
   subscription lifecycle event

## Key Patterns
- SMS responses: under 160 chars when possible
- Context loaded fresh on every SMS via context-loader.ts
- Tools registered in lib/tools/index.ts only
- All async work via QStash — never await inline in SMS handler
- Monitor checks via Vercel Cron → QStash → job handler
- Browserbase sessions always closed in finally block
- Email always via Resend — never direct SMTP

## Gates
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

## Current Gate
GATE 0 — not started

## Never Do
- Add VAPI (no voice at launch)
- Add Inngest (use QStash + Vercel Cron)
- Add Railway (not needed)
- Read user email inbox (Resend outbound only)
- Store passwords (Browserbase sessions only)
- Hardcode any $ amounts (always from DB config)
```

---

## BUILD GATES

### Gate 0 — Setup (2 days)
- [ ] Next.js 14 project initialized
- [ ] Supabase connected, all tables migrated
- [ ] Environment variables configured
- [ ] Stripe products created: Solo $15, Family $29
- [ ] Stripe trial configuration: 14 days
- [ ] Twilio number configured, SMS webhook set
- [ ] QStash account configured
- [ ] Vercel Cron configured (vercel.json)
- [ ] Resend domain verified (mail.pokkit.ai)
- [ ] Browserbase account configured
- [ ] CLAUDE.md written, in repo root
- [ ] Landing page shell deployed

### Gate 1 — Core SMS Agent (3 days)
- [ ] Inbound SMS handler with Twilio signature validation
- [ ] Unknown number → onboarding response
- [ ] Context loader: profile + memory + conversations
- [ ] Dynamic system prompt builder
- [ ] Claude processes SMS and responds
- [ ] Tool registry wired up
- [ ] Memory tools working (save/get)
- [ ] Conversation saved to DB on every interaction
- [ ] Reminder tools working
- [ ] Basic Q&A and info tools working
- [ ] Test: text 10 different things, all handled correctly

### Gate 2 — Research + Email (2 days)
- [ ] Research job handler at /api/jobs/research
- [ ] QStash queuing from SMS handler
- [ ] Claude researches items via web search tool
- [ ] Report compiled and formatted
- [ ] Resend delivers to user email
- [ ] SMS notification when report ready
- [ ] Email draft + send flow working
- [ ] Test: "research these 5 things and email me" → report arrives

### Gate 3 — Scheduling + Reminders (2 days)
- [ ] Vercel Cron for reminder checks (/api/cron/check-reminders)
- [ ] QStash delayed delivery for precise reminder timing
- [ ] Reminder send job handler
- [ ] Morning briefing builder + scheduler
- [ ] Morning briefing cron + job handler
- [ ] Recurring reminder logic
- [ ] Test: set reminder for 5 minutes from now → SMS arrives

### Gate 4 — Browser Tasks (3 days)
- [ ] Browserbase + Stagehand configured
- [ ] Browser task job handler
- [ ] Restaurant search and recommendation
- [ ] Restaurant reservation (OpenTable/Resy)
- [ ] Flight search and comparison
- [ ] Hotel search and comparison
- [ ] Product price lookup
- [ ] Amazon order status
- [ ] Confirm-before-act protocol for all bookings
- [ ] Test: "book Perry's Saturday 7pm for 2" → confirmation received

### Gate 5 — Monitoring (3 days)
- [ ] pokkit_monitors table + CRUD tools
- [ ] Monitor check cron (/api/cron/check-monitors)
- [ ] Monitor check job handler
- [ ] Flight price monitor (Browserbase)
- [ ] Product price monitor (Browserbase)
- [ ] Website change monitor (Browserbase)
- [ ] Hotel price monitor (Browserbase)
- [ ] Gas price monitor (Browserbase)
- [ ] Alert SMS on threshold met
- [ ] Monitor management via SMS (list, cancel, update)
- [ ] Test: set flight monitor → manually trigger check → alert fires

### Gate 6 — Billing + Trial (2 days)
- [ ] Stripe checkout flow with 14-day trial
- [ ] Card on file, no charge until day 15
- [ ] Stripe webhook handler (all lifecycle events)
- [ ] Trial engagement SMS sequence (Inngest→QStash scheduled)
- [ ] Trial expiring cron notifications
- [ ] CANCEL command handling
- [ ] Plan status enforced on all SMS interactions
- [ ] Test: complete signup, receive welcome SMS, cancel, no charge

### Gate 7 — MLM Connector + Rep Portal (2 days)
- [ ] pokkit_mlm_connectors table seeded with Apex config
- [ ] Commission event webhook fires on all subscription events
- [ ] Rep referral links: pokkit.ai/[repcode]
- [ ] Rep attribution saved to user on signup
- [ ] Rep dashboard: /dashboard/rep
  - [ ] Subscriber count
  - [ ] Monthly commission estimate
  - [ ] Referral link with copy button
  - [ ] Trial vs paid breakdown
- [ ] Test: signup via rep link → commission event fires to Apex

### Gate 8 — Landing Page + Launch (3 days)
- [ ] Landing page (see UX spec below)
- [ ] Mobile-first, sub-3 second load
- [ ] Demo SMS conversation animation
- [ ] Pricing section
- [ ] Rep referral system on all pages
- [ ] Transactional emails via Resend
  - [ ] Welcome email
  - [ ] Trial ending reminder
  - [ ] Subscription active
  - [ ] Cancellation confirmation
- [ ] PWA support (add to home screen)
- [ ] Analytics (Vercel Analytics)
- [ ] Test: full end-to-end signup to first successful task

---

## SUCCESS METRICS PER GATE

- Gate 1: Send 10 different SMS requests, all handled ✓
- Gate 2: Research request → formatted report in email ✓
- Gate 3: Set reminder → SMS arrives at correct time ✓
- Gate 4: Book restaurant via SMS → confirmation received ✓
- Gate 5: Set flight monitor → fires when threshold met ✓
- Gate 6: 14-day trial → card not charged until day 15 ✓
- Gate 7: Rep link signup → commission event fires to Apex ✓
- Gate 8: Cold visitor → signup → first task completed < 5 min ✓
