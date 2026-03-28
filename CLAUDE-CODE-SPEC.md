# POKKIT — CLAUDE CODE SPEC v1.0
## Frontend + Thin Webhooks Only
### BotMakers Inc. | Claude Code Build Package | Confidential

---

## WHAT CLAUDE CODE BUILDS

Claude Code builds ONLY:
1. Next.js frontend (landing page, signup, dashboard, rep portal)
2. Thin webhook receivers (Twilio, Stripe — just write to Supabase)
3. Database schema and migrations
4. Environment configuration

Claude Code does NOT build:
- Agent logic (Twin handles this)
- API integrations (Twin handles this)
- Background jobs (Twin handles this)
- Browser automation (Twin + Browserbase handles this)

The rule: if it requires calling an external API to do work,
Twin does it. If it requires displaying data or receiving
a webhook, Claude Code does it.

---

## CLAUDE.md

```markdown
# POKKIT — Claude Code Instructions

## What This Is
Pokkit personal AI assistant. SMS only. No app.
Replaces Expedia, OpenTable, Kayak, price trackers
and a dozen other apps. All via text. $15/month.

## My Job (Claude Code)
Build the Next.js frontend and thin webhook receivers.
Twin agents handle ALL backend logic and integrations.
Supabase is the shared state layer between us.

## Stack
Next.js 14 + Supabase + Stripe + Vercel
Reuses Jordyn credentials for Supabase and Stripe.

## Critical Rules
1. NEVER hardcode credentials — always process.env
2. NEVER build agent logic — that's Twin's job
3. NEVER call Twilio, Anthropic, or Browserbase directly
4. Webhook receivers ONLY write to Supabase, nothing else
5. All commission values loaded from DB — never hardcoded
6. RLS on all tables — use service role for server ops
7. Mobile first on every page — test at 375px minimum

## Webhook Receiver Pattern
Every webhook receiver follows this exact pattern:
1. Validate signature (Twilio or Stripe)
2. Write relevant data to Supabase
3. Return 200 OK immediately
4. Twin reads from Supabase and does the actual work

NEVER do any work in a webhook receiver beyond writing to DB.

## Gate Order
0 → 1 → 2 → 3 → 4 → 5

## Current Gate
GATE 0 — not started

## Design System
See UX SPEC section for full design direction.
Dark theme. Accent: #00E5B4 (teal-green).
Fonts: Syne (display) + DM Sans (body).
Mobile first always.
```

---

## ENVIRONMENT VARIABLES

```env
# Reused from Jordyn
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_AUTH_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=

# Pokkit specific
TWILIO_PHONE_NUMBER=
STRIPE_SOLO_PRICE_ID=
STRIPE_FAMILY_PRICE_ID=
NEXT_PUBLIC_APP_URL=https://pokkit.ai
APEX_WEBHOOK_SECRET=
CRON_SECRET=
```

---

## DATABASE SCHEMA

Run this migration first. All other gates depend on it.

```sql
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
```

---

## FILE STRUCTURE

```
apps/pokkit/
├── app/
│   ├── layout.tsx                    # Root layout + fonts
│   ├── page.tsx                      # Landing page
│   ├── [repcode]/
│   │   └── page.tsx                  # Rep referral landing
│   ├── signup/
│   │   └── page.tsx                  # Signup page
│   ├── account/
│   │   └── page.tsx                  # User dashboard
│   ├── dashboard/
│   │   └── rep/
│   │       └── page.tsx              # Rep portal
│   └── api/
│       ├── twilio/
│       │   └── sms/
│       │       └── route.ts          # Inbound SMS receiver
│       ├── stripe/
│       │   ├── webhook/
│       │   │   └── route.ts          # Stripe events
│       │   ├── checkout/
│       │   │   └── route.ts          # Create checkout session
│       │   └── portal/
│       │       └── route.ts          # Customer portal
│       ├── apex/
│       │   └── webhook/
│       │       └── route.ts          # Apex status updates
│       └── user/
│           ├── profile/
│           │   └── route.ts
│           ├── monitors/
│           │   └── route.ts
│           └── history/
│               └── route.ts
├── lib/
│   ├── supabase.ts                   # Supabase client
│   ├── stripe.ts                     # Stripe client
│   └── utils.ts                      # Helpers
├── components/
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── AppReplacement.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── SmsExamples.tsx
│   │   ├── Pricing.tsx
│   │   ├── Testimonials.tsx
│   │   └── Faq.tsx
│   ├── signup/
│   │   └── SignupForm.tsx
│   ├── dashboard/
│   │   ├── MonitorCard.tsx
│   │   ├── ReminderCard.tsx
│   │   └── ActivityFeed.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── SmsDemo.tsx               # Animated SMS mockup
├── supabase/
│   └── migrations/
│       └── 001_pokkit_schema.sql
├── public/
│   └── fonts/
├── vercel.json
├── .env.local
└── CLAUDE.md
```

---

## GATE 0 — PROJECT SETUP

```
- [ ] Next.js 14 initialized with App Router + TypeScript
- [ ] Tailwind CSS configured
- [ ] Google Fonts loaded: Syne + DM Sans
- [ ] Supabase client configured (lib/supabase.ts)
- [ ] Stripe client configured (lib/stripe.ts)
- [ ] Database migration run (001_pokkit_schema.sql)
- [ ] Stripe products created:
      Solo: $15/month with 14-day trial
      Family: $24/month with 14-day trial
- [ ] Environment variables all configured
- [ ] Vercel project created and connected
- [ ] Domain pokkit.ai connected (or placeholder)
- [ ] CLAUDE.md in repo root
- [ ] Deploy empty shell — confirm Vercel builds
```

---

## GATE 1 — WEBHOOK RECEIVERS

### Twilio SMS Receiver
```typescript
// app/api/twilio/sms/route.ts
// ONLY responsibility: validate + write to Supabase
// Twin reads from Supabase and processes

import { validateRequest } from 'twilio'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Validate Twilio signature
  const body = await request.formData()
  const params = Object.fromEntries(body)
  const signature = request.headers.get('x-twilio-signature') || ''
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/sms`
  
  const isValid = validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  )
  
  if (!isValid) {
    return new Response('Unauthorized', { status: 403 })
  }

  const fromNumber = params.From as string
  const messageBody = params.Body as string
  const twilioSid = params.MessageSid as string

  // 2. Find or handle unknown user
  const { data: user } = await supabase
    .from('pokkit_users')
    .select('id, plan_status')
    .eq('phone_number', fromNumber)
    .single()

  if (!user) {
    // Unknown number — write special task for Twin to handle
    await supabase.from('pokkit_tasks').insert({
      type: 'sms',
      status: 'pending',
      priority: 1,
      input: {
        message: messageBody,
        from_number: fromNumber,
        twilio_sid: twilioSid,
        unknown_user: true
      }
    })
  } else {
    // 3. Write SMS task to queue — Twin picks it up
    await supabase.from('pokkit_tasks').insert({
      user_id: user.id,
      type: 'sms',
      status: 'pending',
      priority: 1,
      input: {
        message: messageBody,
        from_number: fromNumber,
        twilio_sid: twilioSid
      }
    })
  }

  // 4. Return empty TwiML immediately
  // Twin sends the actual SMS response
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
```

### Stripe Webhook Receiver
```typescript
// app/api/stripe/webhook/route.ts
// ONLY responsibility: update Supabase on payment events
// Twin fires MLM commission events from Supabase triggers

import Stripe from 'stripe'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabase = createClient(...)
  
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  switch (event.type) {
    
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      // Update user with Stripe IDs
      await supabase.from('pokkit_users')
        .update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan_status: 'trialing',
          trial_ends_at: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString()
        })
        .eq('id', session.metadata?.user_id)
      
      // Queue MLM commission event for Twin
      await supabase.from('pokkit_tasks').insert({
        user_id: session.metadata?.user_id,
        type: 'mlm_event',
        status: 'pending',
        input: {
          event_type: 'new_subscription',
          connector_name: session.metadata?.mlm_connector || 'apex_affinity',
          mrr: session.metadata?.plan === 'family' ? 24 : 15
        }
      })
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      
      await supabase.from('pokkit_users')
        .update({ plan_status: 'active' })
        .eq('stripe_customer_id', customerId)
      
      // Queue MLM renewal event
      const { data: user } = await supabase
        .from('pokkit_users')
        .select('id, plan, mlm_connector')
        .eq('stripe_customer_id', customerId)
        .single()
      
      if (user) {
        await supabase.from('pokkit_tasks').insert({
          user_id: user.id,
          type: 'mlm_event',
          status: 'pending',
          input: {
            event_type: 'renewal',
            connector_name: user.mlm_connector,
            mrr: user.plan === 'family' ? 24 : 15
          }
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      
      const { data: user } = await supabase
        .from('pokkit_users')
        .select('id, plan, mlm_connector')
        .eq('stripe_subscription_id', subscription.id)
        .single()
      
      if (user) {
        await supabase.from('pokkit_users')
          .update({ plan_status: 'canceled' })
          .eq('id', user.id)
        
        // Queue MLM cancellation event
        await supabase.from('pokkit_tasks').insert({
          user_id: user.id,
          type: 'mlm_event',
          status: 'pending',
          input: {
            event_type: 'cancellation',
            connector_name: user.mlm_connector,
            mrr: 0
          }
        })
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await supabase.from('pokkit_users')
        .update({ plan_status: 'past_due' })
        .eq('stripe_customer_id', invoice.customer as string)
      break
    }
  }

  return new Response('OK', { status: 200 })
}
```

### Stripe Checkout Creator
```typescript
// app/api/stripe/checkout/route.ts

export async function POST(request: Request) {
  const { name, phone, repCode, plan } = await request.json()
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabase = createClient(...)

  // Create user record first
  const { data: user } = await supabase
    .from('pokkit_users')
    .insert({
      name,
      phone_number: phone,
      rep_code: repCode || null,
      plan: plan || 'solo'
    })
    .select()
    .single()

  // Create Stripe checkout with trial
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'paypal'],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: 14
    },
    line_items: [{
      price: plan === 'family'
        ? process.env.STRIPE_FAMILY_PRICE_ID
        : process.env.STRIPE_SOLO_PRICE_ID,
      quantity: 1
    }],
    metadata: {
      user_id: user.id,
      plan: plan || 'solo',
      rep_code: repCode || '',
      mlm_connector: 'apex_affinity'
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?cancelled=true`
  })

  return Response.json({ url: session.url })
}
```

---

## GATE 2 — LANDING PAGE

### Design Direction
```
Theme:        Dark, bold, modern consumer tech
Background:   #0A0A0B (near black)
Accent:       #00E5B4 (teal-green — THE Pokkit color)
Display font: Syne (geometric, distinctive)
Body font:    DM Sans (clean, readable)
Motion:       Staggered fade-up on load,
              SMS demo animates like real conversation
Mobile:       Design mobile first, 375px minimum
```

### CSS Variables (global.css)
```css
:root {
  --bg-primary: #0A0A0B;
  --bg-secondary: #111113;
  --bg-tertiary: #1A1A1D;
  --accent: #00E5B4;
  --accent-dim: #00B890;
  --accent-glow: rgba(0, 229, 180, 0.15);
  --text-primary: #F2F2F3;
  --text-secondary: #8A8A9A;
  --text-tertiary: #4A4A5A;
  --border: rgba(255, 255, 255, 0.08);
  --border-accent: rgba(0, 229, 180, 0.3);
  --font-display: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

### Landing Page Sections (in order)

#### Section 1 — Hero (above fold)
```
Layout: Two columns desktop, stacked mobile
Left: headline + subheadline + CTA
Right: animated SMS demo phone mockup

HEADLINE (cycles every 3 seconds with fade):
"Delete your apps."
"Text Pokkit."
(cycles through: "Book flights.", "Track prices.",
 "Research anything.", back to "Delete your apps.")

SUBHEADLINE:
"One text replaces Expedia, OpenTable, Kayak,
price trackers, and a dozen other apps."

STATS ROW (3 items):
• $15/month
• No app required  
• Works on any phone

CTA BUTTON:
[Try Free for 2 Weeks →]
Below: "No charge for 14 days · Cancel anytime by text"

SMS DEMO MOCKUP (right side):
Animated conversation showing messages appearing
one by one with typing indicator between each.

Scenario 1 (show for 8 seconds then fade, show scenario 2):
User: "Find me a flight to Dallas under $150 this weekend"
Pokkit: [typing...]
Pokkit: "Found 3 options! Cheapest: $127 Southwest
         Fri-Sun. Want me to book it?"
User: "Yes please"
Pokkit: "Booked! Confirmation #SW4821.
         Southwest, departs 8am Friday. ✈️"

Scenario 2:
User: "Monitor Nike Air Max — alert me under $89"
Pokkit: "Watching Nike Air Max. I'll text you
         the moment it drops below $89."
[2 days later badge appears]
Pokkit: "Price drop! Nike Air Max just hit $84.
         Amazon. Want the link?"

Scenario 3:
User: "Book Perry's Saturday 7pm for 2"
Pokkit: "Confirming: Perry's Westheimer, Sat 7pm,
         table for 2 under your name. Book it?"
User: "Yes"
Pokkit: "Done! Confirmed at Perry's. #4821. 🍽️"
```

#### Section 2 — App Replacement
```
Headline: "One text. Everything handled."

Two columns:

LEFT — "The old way" (dark card with red tint):
Show app icons list with X marks:
✗ Expedia
✗ Priceline  
✗ OpenTable
✗ Hotels.com
✗ Kayak
✗ Honey
✗ GasBuddy
✗ Google Alerts
✗ Flighty
✗ Yelp
✗ Price trackers
✗ Reminder apps
"...and 47 more apps"

RIGHT — "The Pokkit way" (dark card with accent border):
Single phone showing one text message:
"Find me a flight to Dallas under $150
 and book me at Perry's tonight"

Animation: On scroll into view, apps fade out
one by one from left column
```

#### Section 3 — How It Works
```
3 steps in a row (cards on mobile):

1. Text anything
   "No app. No login. Just text your
    Pokkit number like any contact."

2. Pokkit handles it
   "Books, researches, monitors, reminds —
    using the same services you'd use yourself,
    but faster."

3. Get results
   "Confirmation texts, email reports,
    price alerts — delivered to you."

Below steps:
"Works on any phone. Your parents' phone.
 Your old flip phone. Any phone."
```

#### Section 4 — Real Examples
```
Headline: "See it in action"

6 SMS conversation cards in a 2x3 grid (1x6 mobile)
Each shows a real conversation:

Card 1: Flight Monitor
Card 2: Restaurant Booking  
Card 3: Research Report
Card 4: Price Drop Alert
Card 5: Morning Briefing
Card 6: Step by Step Help

(See full conversation content in design mockup above)
```

#### Section 5 — Pricing
```
Single centered pricing card:

$15 / month
Everything. Unlimited.

✓ Book flights, hotels & restaurants
✓ Monitor prices — alert when they drop
✓ Research reports emailed to you
✓ Reminders & morning briefings
✓ Email drafting & sending
✓ New skills added every week
✓ Works on any phone — no app ever

[Start Free — 2 Weeks on Us →]

No charge for 14 days.
Cancel anytime by texting CANCEL.

━━━━━━━━━━━━━━━━━━━━

Family plan: $24/month for up to 6 numbers
```

#### Section 6 — Testimonials
```
3 cards:

"I texted Pokkit to monitor Houston→Miami flights.
 Three days later I got a text — prices dropped to
 $134. Booked it in 30 seconds."
— Mike T., Houston TX

"I sent Pokkit 8 things to research for a client
 meeting. Got a professional report in my inbox
 20 minutes later while I was driving."
— Sarah K., Insurance Agent, Katy TX

"My wife loves that I actually remember our
 anniversary now. Pokkit texts me a week before
 every important date. $15 well spent."
— David R., Dallas TX
```

#### Section 7 — FAQ
```
Accordion FAQ:

Q: Does it work with my phone?
A: Yes. Regular text message (SMS) on any phone.
   No smartphone required. If you can send a text,
   you can use Pokkit.

Q: What can Pokkit actually do?
A: Book restaurants, flights, and hotels. Monitor
   prices and alert you when they drop. Research
   anything and email you a report. Set reminders.
   Draft and send emails. Answer any question.
   New skills added every week.

Q: What if it can't do something I ask?
A: Pokkit tells you honestly and suggests an
   alternative. You can also text "I wish you
   could [thing]" to suggest a new skill.

Q: Is my information secure?
A: Yes. We never store passwords. Connections use
   secure authentication. Your data is encrypted
   and never sold or shared.

Q: How do I cancel?
A: Text CANCEL to your Pokkit number. Done.
   No forms, no phone calls, no hassle.
```

#### Section 8 — Footer CTA
```
Large centered CTA:
"Start texting Pokkit today."
[Try Free for 2 Weeks →]
"$15/month after trial. Cancel anytime by text."

Footer links:
Privacy Policy | Terms of Service
© 2026 BotMakers Inc.
```

---

## GATE 3 — SIGNUP PAGE

```
URL: /signup and /[repcode]

If repcode present: load rep name from pokkit_users
Show at top: "You were invited by [Rep Name] 🎉"

Form (3 fields only):

Your name
[________________________]

Mobile number (becomes your Pokkit number)
[________________________]

Choose your plan:
( ) Solo — $15/month (1 person)
( ) Family — $24/month (up to 6 people)

[Continue to Secure Checkout →]
(Clicking opens Stripe checkout in same tab)

Below button:
🔒 Secure checkout via Stripe
No charge for 14 days · Cancel anytime by text
Your card is saved but not charged until day 15

On success (Stripe redirects back):
Show: "You're in! Check your phone —
        your welcome text is on its way. 🎉"
```

---

## GATE 4 — USER DASHBOARD

```
URL: /account
Requires: phone number auth (magic link via Supabase)

Mobile-first layout.
All data loaded from Supabase (Twin writes it, we display it).

Header:
POKKIT
[plan badge: Solo $15 / Family $24]
[Manage Billing] button → Stripe portal

Section 1 — Your Pokkit Number:
(832) 555-0142
[Copy] [Open in Messages]
"Text this number anytime from any phone"

Section 2 — Active Monitors:
For each row in pokkit_monitors (status=active):
  [icon] [label]
  Last checked: [time ago]
  Current value: [last_value]
  [Cancel] button

[+ Set Up a Monitor] → opens simple form

Section 3 — Upcoming Reminders:
For each row in pokkit_reminders (status=pending):
  🔔 [title]
  [remind_at formatted nicely]
  [Cancel] button

Section 4 — Recent Activity:
Last 10 rows from pokkit_conversations (direction=inbound):
  Show: message_in (truncated) + intent badge
  Grouped by date

Section 5 — Account:
[Manage Billing] → Stripe portal
[Upgrade to Family] → if on Solo plan
[Cancel Subscription] → Stripe portal
```

---

## GATE 5 — REP PORTAL

```
URL: /dashboard/rep
Requires: rep auth (Supabase auth, rep_code verified)

Header:
POKKIT REP PORTAL
Welcome, [name]
Rep code: [code]

Section 1 — Referral Link:
Your referral link:
pokkit.ai/[repcode]
[Copy Link] [Share via Text]
[Share via Email]

Section 2 — This Month Stats:
4 metric cards:
• Active subscribers: [count]
• Trial subscribers: [count]  
• New this month: [count]
• Est. direct commission: $[count × 7.50 for solo, × 10 for family]

Section 3 — Subscriber List:
Table showing pokkit_users where rep_code = this rep:
Name | Plan | Status | Joined | Commission

Section 4 — Commission History:
Monthly breakdown of estimated commissions
(Read from pokkit_tasks where type='mlm_event')

Note: "Actual commission payments processed by
       Apex Affinity Group AgentPulse"
```

---

## MOBILE-FIRST RULES

Apply to every single component:

```
1. Base styles are mobile (375px)
2. md: prefix for tablet (768px+)
3. lg: prefix for desktop (1024px+)

4. Touch targets: min-height 44px, min-width 44px
5. Font size: minimum 16px (prevents iOS zoom on focus)
6. No horizontal scroll at any viewport
7. Full-width buttons on mobile
8. Padding: 16px horizontal on mobile, 24px on tablet+
9. Stack columns on mobile, grid on desktop
10. SMS mockups: max-width 320px, centered

Tailwind breakpoint pattern:
<div className="
  flex flex-col          // mobile: stacked
  md:flex-row            // tablet+: side by side
  gap-4 md:gap-8         // tighter on mobile
  px-4 md:px-6 lg:px-8  // responsive padding
  text-sm md:text-base   // responsive text
">
```

---

## ANIMATION IMPLEMENTATION

```tsx
// components/ui/AnimatedSmsDemo.tsx
// The most important component on the landing page
// Shows real SMS conversations playing out automatically

'use client'
import { useState, useEffect } from 'react'

const scenarios = [
  {
    messages: [
      { from: 'user', text: 'Find me a flight to Dallas under $150 this weekend' },
      { from: 'pokkit', text: 'Found 3 options! Cheapest: $127 Southwest Fri-Sun. Book it?' },
      { from: 'user', text: 'Yes please' },
      { from: 'pokkit', text: 'Booked! Confirmation #SW4821. Southwest, departs 8am Friday. ✈️' },
    ]
  },
  {
    messages: [
      { from: 'user', text: 'Monitor Nike Air Max — alert me under $89' },
      { from: 'pokkit', text: 'Watching Nike Air Max. I\'ll text you the moment it drops below $89.' },
      { from: 'pokkit', text: '🎯 Price drop! Nike Air Max just hit $84 on Amazon. Want the link?', delay: true },
    ]
  },
  {
    messages: [
      { from: 'user', text: 'Book Perry\'s Saturday 7pm for 2' },
      { from: 'pokkit', text: 'Confirming: Perry\'s Westheimer, Sat 7pm, table for 2 under your name. Book it?' },
      { from: 'user', text: 'Yes' },
      { from: 'pokkit', text: 'Done! Confirmed at Perry\'s. Confirmation #4821. 🍽️' },
    ]
  }
]

// Each message appears with a delay
// Typing indicator shows between messages
// After full scenario: pause 2 seconds, fade, next scenario
```

---

## VERCEL CONFIGURATION

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/health",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Note: Most scheduling is handled by Twin agents.
Vercel cron is only needed for health checks
and any lightweight polling Twin can't handle.

---

## BUILD GATE CHECKLIST

### Gate 0 ✓ When:
- Vercel build succeeds
- Supabase tables all created
- Stripe products created with trial
- Empty pages deploy without errors

### Gate 1 ✓ When:
- Text Pokkit number → pokkit_tasks row appears in Supabase
- Stripe test payment → pokkit_users plan_status updates
- Both webhooks return 200 without errors

### Gate 2 ✓ When:
- Landing page loads in < 3 seconds on mobile
- SMS demo animation plays correctly
- CTA button opens Stripe checkout
- Page looks correct at 375px, 768px, 1280px

### Gate 3 ✓ When:
- Signup form submits → Stripe checkout opens
- After payment → user created in Supabase
- Welcome SMS triggered (Twin sends it)
- Rep referral link pre-populates rep_code

### Gate 4 ✓ When:
- User can log in with phone number
- Monitors show from Supabase
- Reminders show from Supabase
- Activity feed shows conversations
- Billing link opens Stripe portal

### Gate 5 ✓ When:
- Rep can log in
- Subscriber count shows correctly
- Referral link copies correctly
- Commission estimate calculates correctly

---

## MARKETING ROLLOUT PLAN

### Pre-launch (2 weeks before)

Week 1:
- Register pokkit.ai domain
- Set up email list at pokkit.ai (simple landing with email capture)
- Message: "Something is replacing all your apps. Get early access."
- Share with Bill, Betsy, Jonathan for Apex team preview
- Rep preview: "You're getting first access before we open to everyone"

Week 2:
- Give 10 Apex reps beta access
- Have each rep use it for themselves for one week
- Collect their stories: what surprised them, what they used most
- Those stories become testimonials and rep training material

### Launch Day

Morning:
- Email early list: "Pokkit is live. Your apps are obsolete."
- Text all beta reps: "We're live. Your rep link is [link]. Go."
- Post on Apex rep communication channels

Rep activation sequence:
- Bill sends message to all Apex reps introducing Pokkit
- Each rep gets their personal referral link
- Rep training video: 5 minute demo showing restaurant booking live
- Script: "Try it on yourself first. Then show one person today."

### Week 1 Post-Launch

Daily:
- Monitor trial signup rate
- Watch conversion day 1, 3, 7 engagement
- Track which SMS requests are most common
- Fix any broken flows immediately

Rep support:
- Daily Apex leadership update: signups, actives, trials
- Celebrate first rep who hits 10 subscribers
- Share best demo stories in rep channel

### Month 1 Goals

Primary:
- 100 paid subscribers
- 25+ active reps selling Pokkit
- < 30% trial churn rate

Secondary:
- Identify top 5 most-used skills
- Identify top 5 most-requested new skills
- First upgrade from Solo to Family

### Month 2-3

Content:
- "Delete your apps" campaign on social
- Rep success stories shared weekly
- New skill announcement every 2 weeks
- Email to trial cancellations: "Here's what you missed"

Product:
- Add 3-5 new skills based on month 1 requests
- Build dynamic skill learning (Agent 10)
- Add WhatsApp support via Twilio

Distribution:
- Approach second MLM network with Pokkit white-label
- Build connector for second partner
- Announce: "Pokkit now available through [Partner]"

### The Rep Incentive Program

Fast Start Bonus (propose to Bill):
Rep earns $25 bonus for every 5 paid Pokkit subscribers
they personally enroll in their first 60 days.

This creates:
- Sprint mentality at launch
- Reps who focus on Pokkit immediately
- Clear milestone to celebrate
- Momentum before it can slow down

Leaderboard:
Weekly rep leaderboard showing top Pokkit sellers.
Public in Apex rep channels.
Top 3 get recognition. Top 1 gets something special.

### Positioning By Audience

For reps selling to individuals:
"$15 a month replaces a dozen apps you already use.
 Two weeks free. Cancel by text. Try it."

For reps selling to families:
"$24 a month covers your whole household.
 Kids, parents, grandparents — all on the same plan."

For reps selling to business owners:
"Your clients are paying for Expedia, Kayak, OpenTable
 separately. Pokkit replaces all of them for $15.
 And you earn $7.50 every month they keep it."

For recruiting new reps:
"50% direct commission on a $15 product.
 Sign up 20 people and you're making $150/month forever.
 Before a single override."

### The Demo Script (for every rep)

Pull out your phone in front of the prospect.
Text your Pokkit number: "Book [nearest good restaurant]
tonight at 7pm for 2"

Wait.

3-4 minutes later you get a confirmation text.

Say: "That just replaced OpenTable, Yelp, and 20 minutes
      of searching. $15 a month. Want to try it free?"

That demo closes more than any slide deck.
Every rep should be able to do it in any conversation.

---

*Pokkit Claude Code Spec v1.0 | BotMakers Inc. | Confidential*
*Claude Code builds frontend + thin webhooks only.*
*Twin agents handle all backend intelligence and integrations.*
