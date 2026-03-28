# POKKIT — TWIN AGENT SPEC v1.0
## All Backend Logic | Built and Run by Twin
### BotMakers Inc. | Confidential

---

## OVERVIEW

This spec defines every Twin agent that powers Pokkit's backend.
Twin handles ALL backend intelligence and integrations.
Claude Code handles ONLY the Next.js frontend and thin webhook receivers.

The bridge between Twin and Next.js is Supabase.
Next.js writes to Supabase. Twin reads from Supabase, does the work,
writes results back. Next.js surfaces results to users.

---

## CREDENTIALS TWIN NEEDS

Connect these services in Twin before building any agent:

```
Supabase:
  URL:              NEXT_PUBLIC_SUPABASE_URL
  Service Role Key: SUPABASE_SERVICE_ROLE_KEY

Anthropic:
  API Key:          ANTHROPIC_API_KEY
  Model:            claude-sonnet-4-5

Twilio:
  Account SID:      TWILIO_ACCOUNT_SID
  Auth Token:       TWILIO_AUTH_TOKEN
  From Number:      TWILIO_PHONE_NUMBER

Browserbase:
  API Key:          BROWSERBASE_API_KEY

Resend:
  API Key:          RESEND_API_KEY
  From Email:       hello@mail.pokkit.ai

Stripe:
  Secret Key:       STRIPE_SECRET_KEY

Apex Webhook:
  URL:              APEX_WEBHOOK_URL
  Secret:           APEX_WEBHOOK_SECRET
```

---

## SUPABASE TABLES TWIN READS/WRITES

Twin interacts with these tables. Full schema in Claude Code spec.

```
pokkit_users          — user profiles, plan status, preferences
pokkit_tasks          — job queue (Twin polls this constantly)
pokkit_conversations  — conversation history Twin writes after every SMS
pokkit_memory         — user memory Twin reads for context + writes to save
pokkit_reminders      — reminders Twin checks every 5 minutes
pokkit_monitors       — active monitors Twin checks every 15 minutes
pokkit_monitor_log    — Twin writes results of every monitor check
pokkit_events         — internal calendar Twin reads for morning briefing
pokkit_email_sends    — Twin writes every email sent
pokkit_skills         — skill library Twin reads for routing + writes when building
pokkit_skill_suggestions — user suggestions Twin evaluates for skill building
pokkit_actions        — outbound actions Twin logs (bookings, calls, etc)
pokkit_mlm_connectors — MLM webhook config Twin reads to fire commission events
```

---

## JOB QUEUE PATTERN

Every background job flows through pokkit_tasks.
Twin agents poll this table continuously.

```
pokkit_tasks columns:
  id              — unique job ID
  user_id         — which user this job is for
  type            — job type (see below)
  status          — pending | processing | done | failed
  priority        — 1-10 (1=highest)
  input           — job parameters (jsonb)
  result          — job output (jsonb)
  error           — error message if failed
  attempts        — retry count
  claimed_at      — when Twin claimed it
  completed_at    — when Twin finished it

Job types:
  sms             — process inbound SMS
  research        — multi-item research + email report
  browser_task    — execute Browserbase task
  email_send      — draft and send email via Resend
  outbound_notify — simple TTS callback to user
  skill_build     — build new dynamic skill (Phase 2)
```

**Claiming a job (prevent double processing):**
Before processing any job Twin must:
1. Check status = 'pending'
2. Update status = 'processing', claimed_at = now()
3. Only proceed if update succeeded (optimistic locking)
This prevents two Twin instances processing the same job.

---

## AGENT 1 — SMS INTELLIGENCE ENGINE

### Purpose
Processes every inbound SMS from a Pokkit user.
Loads their context, asks Claude what to do, executes tool calls,
sends SMS response, saves conversation.

### Trigger
New row in pokkit_tasks where type='sms' AND status='pending'
Check every 10 seconds.

### Process

```
STEP 1 — Claim the job
UPDATE pokkit_tasks SET status='processing', claimed_at=now()
WHERE id=[job_id] AND status='pending'
If 0 rows updated: skip (another instance claimed it)

STEP 2 — Load user context
FROM pokkit_users WHERE id = task.user_id
  → name, phone_number, preferences, contacts, timezone
  → plan, plan_status (if not active/trialing: reply upgrade message)

FROM pokkit_conversations 
WHERE user_id = task.user_id 
ORDER BY created_at DESC LIMIT 10
  → recent conversation history

FROM pokkit_memory 
WHERE user_id = task.user_id AND active = true
  → all memory items

FROM pokkit_monitors 
WHERE user_id = task.user_id AND status = 'active'
  → list of what Pokkit is watching for user

FROM pokkit_reminders 
WHERE user_id = task.user_id AND status = 'pending'
ORDER BY remind_at LIMIT 5
  → upcoming reminders

FROM pokkit_events
WHERE user_id = task.user_id 
AND event_at >= now() AND event_at <= now() + interval '7 days'
  → upcoming events

STEP 3 — Build system prompt
Use this exact template:

"You are Pokkit, the personal AI assistant for [name].

PERSONALITY:
- Warm, capable, direct, slightly playful
- Never robotic or corporate  
- Get things done fast
- Brief SMS responses — under 160 chars when possible
- Use their name occasionally not excessively
- Always confirm before booking, buying, or transacting

ABOUT [name]:
Timezone: [timezone]
Preferences: [preferences json]
Contacts: [contacts json]

THEIR ACTIVE MONITORS ([count]):
[list each monitor type and target]

UPCOMING EVENTS:
[list events in next 7 days]

UPCOMING REMINDERS:
[list next 5 reminders]

RECENT MEMORY:
[list memory items by category]

RECENT CONVERSATION:
[last 10 messages formatted as: User/Pokkit: message]

TODAY: [current date and time in user timezone]

YOUR CAPABILITIES — you can handle:
- Research anything and email a formatted report
- Book restaurants, flights, hotels via browser
- Monitor prices and websites — alert when conditions met
- Set reminders and recurring notifications
- Draft and send emails on user's behalf
- Track Amazon orders and product prices
- Find local businesses and services
- Answer any question via web search
- Manage tasks, events, contacts, memory
- Walk user through anything step by step

TOOL CALLS AVAILABLE:
[list all tools below]

ROUTING RULES:
- Simple Q&A, reminders, memory: handle immediately
- Research 2+ items: queue as background job, tell user to expect email
- Browser tasks (booking, ordering): confirm details first, then queue
- Monitoring requests: confirm what/threshold/frequency, then create monitor
- Email requests: draft first, show user, send on confirmation

RESPONSE FORMAT:
Keep under 160 chars for simple responses.
For longer content offer to email it.
Never say 'As an AI' or similar.
Just be helpful and get it done."

STEP 4 — Send to Claude API
POST https://api.anthropic.com/v1/messages
{
  model: "claude-sonnet-4-5",
  max_tokens: 1024,
  system: [system prompt above],
  messages: [
    { role: "user", content: task.input.message }
  ],
  tools: [tool definitions — see Tools section]
}

STEP 5 — Process Claude response
For each content block in response:
  
  If type = "text":
    → This is the SMS to send to user
    → Store as reply_text
  
  If type = "tool_use":
    → Execute the tool (see Tools section)
    → Send tool result back to Claude
    → Continue conversation until Claude returns text
    → Some tools queue background jobs
    → Some tools execute immediately and return result

STEP 6 — Send SMS reply
Twilio API: POST /2010-04-01/Accounts/[SID]/Messages
{
  From: TWILIO_PHONE_NUMBER,
  To: user.phone_number,
  Body: reply_text
}

STEP 7 — Save conversation
INSERT INTO pokkit_conversations:
{
  user_id: task.user_id,
  channel: 'sms',
  direction: 'inbound',
  message_in: task.input.message,
  message_out: reply_text,
  intent: detected_intent,
  skill_used: skill_name_if_any
}

STEP 8 — Complete job
UPDATE pokkit_tasks SET status='done', completed_at=now(),
result={ reply_sent: true, intent: detected_intent }
WHERE id = task.id

ERROR HANDLING:
Any failure → UPDATE status='failed', error=message, attempts+=1
If attempts >= 3: status='failed' permanently
Send user: "Having a moment — please try again"
```

### Tools Claude can call

```
IMMEDIATE TOOLS (execute inline, return result to Claude):

save_memory(category, key, value)
  → INSERT/UPSERT pokkit_memory

get_memory(category?, key?)
  → SELECT from pokkit_memory

save_contact(name, phone, relationship?)
  → Update contacts jsonb in pokkit_users

get_contacts()
  → Return contacts from pokkit_users

add_task(title, list_type?)
  → INSERT pokkit_tasks type='todo'

list_tasks(list_type?)
  → SELECT from pokkit_tasks where type='todo'

complete_task(id)
  → UPDATE pokkit_tasks set status='done'

add_event(title, event_at, notes?, location?)
  → INSERT pokkit_events

list_events(date_range?)
  → SELECT pokkit_events

set_reminder(title, remind_at, notes?)
  → INSERT pokkit_reminders

cancel_reminder(id)
  → UPDATE pokkit_reminders status='cancelled'

list_reminders()
  → SELECT pokkit_reminders status='pending'

list_monitors()
  → SELECT pokkit_monitors status='active'

cancel_monitor(id)
  → UPDATE pokkit_monitors status='cancelled'

search_web(query)
  → Twin native web search
  → Return top 3 results summary

get_weather(location)
  → Web search: "current weather [location]"
  → Return temp, conditions, forecast

get_flight_status(flight_number)
  → Web search: "[flight_number] flight status"
  → Return on-time/delayed/gate info

get_stock_price(ticker)
  → Web search: "[ticker] stock price"
  → Return current price and change

calculate(expression)
  → Evaluate math expression
  → Return result

translate(text, target_language)
  → Claude native translation
  → Return translated text

BACKGROUND TOOLS (queue job, return "queued" to Claude):

queue_research(items[], deliver_to_email)
  → INSERT pokkit_tasks type='research'
     input: { items, deliver_to: email }
  → Return: "Queued research for [n] items"
  → Claude tells user: "On it — report coming to [email]"

queue_browser_task(task_description, target_url?,
                   confirm_before_act?)
  → INSERT pokkit_tasks type='browser_task'
     input: { task_description, target_url,
              confirm_before_act: true }
  → Return: "Browser task queued"
  → Claude tells user: "On it — I'll text you when done"

create_monitor(type, params, threshold?,
               threshold_direction?, frequency?)
  → INSERT pokkit_monitors
  → Return: "Monitor created"
  → Claude confirms: "Watching [X] — I'll alert you [condition]"

queue_email(to_address, subject, body_intent)
  → Claude first drafts the email
  → Sends draft as SMS to user for approval
  → On 'yes'/'send' reply:
     INSERT pokkit_tasks type='email_send'
  → Return: "Email queued"
```

---

## AGENT 2 — RESEARCH ENGINE

### Purpose
Takes a list of research items, searches the web for each,
compiles a professional formatted report, emails it to the user.

### Trigger
New row in pokkit_tasks where type='research' AND status='pending'
Check every 30 seconds.

### Process

```
STEP 1 — Claim job (same optimistic lock as Agent 1)

STEP 2 — Load user
SELECT from pokkit_users WHERE id = task.user_id

STEP 3 — Research each item
For each item in task.input.items:
  
  a. Web search: "[item] [current year] latest"
  b. Web search: "[item] detailed information"
  c. Extract key findings:
     - Main answer/conclusion
     - Key data points and numbers
     - Important caveats
     - Sources (domain names)
  d. Store in findings array:
     { item, findings, sources, searched_at }

STEP 4 — Compile report
Build HTML email with this structure:

Subject: "Your Pokkit Research Report — [date]"

Body:
<h1>Research Report</h1>
<p>Prepared for [name] | [date]</p>
<hr>
<p><strong>Executive Summary</strong><br>
[2-3 sentence overview of all findings]</p>
<hr>

For each item:
<h2>[item number]. [item title]</h2>
<p>[Main findings in 2-4 sentences]</p>
<ul>
  <li>[Key point 1]</li>
  <li>[Key point 2]</li>
  <li>[Key point 3]</li>
</ul>
<p><em>Sources: [domain1], [domain2]</em></p>
<hr>

<p style="color:#666;font-size:12px">
Research conducted by Pokkit on [date].
Reply to this email or text your Pokkit number
with any follow-up questions.
</p>

STEP 5 — Send via Resend
POST https://api.resend.com/emails
{
  from: "Pokkit Research <research@mail.pokkit.ai>",
  to: [task.input.deliver_to],
  subject: "Your Pokkit Research Report — [n] items",
  html: [compiled html above]
}

STEP 6 — Log email send
INSERT pokkit_email_sends:
{
  user_id, to_address, subject, body_html,
  type: 'research_report', resend_id, status: 'sent'
}

STEP 7 — Notify user via SMS
Twilio SMS to user:
"Your research report on [n] items is ready —
check [deliver_to_email] 📧"

STEP 8 — Complete job
UPDATE pokkit_tasks status='done',
result={ items_researched: n, email_sent: deliver_to }

ERROR HANDLING:
If Resend fails: retry 3 times, then SMS user:
"Had trouble sending your report — 
 want me to text you the highlights instead?"
```

---

## AGENT 3 — MONITOR CHECKER

### Purpose
Runs every 15 minutes. Checks all active monitors that are due.
Uses Browserbase + Stagehand for all web checks.
Fires SMS alerts when conditions are met.

### Trigger
Schedule: every 15 minutes

### Process

```
STEP 1 — Find due monitors
SELECT * FROM pokkit_monitors
WHERE status = 'active'
AND (
  last_checked_at IS NULL
  OR last_checked_at < now() - interval '23 hours'
)
LIMIT 20

STEP 2 — For each monitor, open Browserbase session

  Use Browserbase API to create session:
  POST https://www.browserbase.com/v1/sessions
  { projectId: BROWSERBASE_PROJECT_ID }
  → Returns session_id and connect_url

  Connect Stagehand to session

STEP 3 — Execute check based on monitor.type

  TYPE: flight_price
  ─────────────────
  Navigate to https://www.google.com/flights
  
  Use Stagehand act():
  "Search for [trip_type] flights from [origin] 
   to [destination] for [date_flexibility]"
  
  Wait for results to load
  
  Use Stagehand extract():
  "Get all flight options with their prices, 
   airlines, departure times, and arrival times.
   Return as structured list."
  
  Find lowest price in results
  found_value = lowest_price_number
  found_details = cheapest flight details
  
  If found_value <= monitor.threshold:
    ALERT: "🎯 Flight alert! [origin]→[destination]
    just dropped to $[found_value].
    [airline], [dates].
    Want the booking link?"
  
  ─────────────────
  TYPE: product_price
  ─────────────────
  Navigate to monitor.target_url
  
  Use Stagehand extract():
  "Get the current price of this product.
   Return as a number only."
  
  found_value = extracted_price
  
  If threshold_direction = 'below' AND found_value <= threshold:
    ALERT: "📦 Price drop! [product] is now 
    $[found_value] at [site_name].
    Want the link?"
  
  ─────────────────
  TYPE: website_change
  ─────────────────
  Navigate to monitor.monitor_url
  
  Use Stagehand extract():
  "Extract the content of [monitor_element].
   Return the exact text."
  
  found_value = extracted_content
  
  If found_value != monitor.last_value:
    ALERT: "🔔 Change detected on [url]!
    
    Was: [monitor.last_value truncated to 100 chars]
    Now: [found_value truncated to 100 chars]"
  
  ─────────────────
  TYPE: hotel_price
  ─────────────────
  Navigate to https://www.hotels.com
  
  Use Stagehand act():
  "Search for hotels in [destination] 
   checking in [checkin] checking out [checkout]
   for [guests] guest(s)"
  
  Use Stagehand extract():
  "Get the 3 cheapest available hotels with
   their names, prices per night, and ratings."
  
  found_value = lowest_price
  
  If found_value <= monitor.threshold:
    ALERT: "🏨 Hotel alert! Found rooms in 
    [destination] from $[found_value]/night.
    Lowest: [hotel_name] at $[price].
    Want details?"
  
  ─────────────────
  TYPE: gas_price
  ─────────────────
  Web search (no browser needed):
  "[location] gas prices today cheapest"
  
  Extract lowest price found
  found_value = price
  
  If found_value <= monitor.threshold:
    ALERT: "⛽ Gas alert! [station] has
    [grade] for $[found_value]/gal near you."

STEP 4 — Close Browserbase session
Always close regardless of success or failure.

STEP 5 — Log result
INSERT pokkit_monitor_log:
{
  monitor_id, checked_at: now(),
  value_found: found_value,
  threshold_met: (alert was sent),
  alert_sent: (alert was sent),
  browserbase_session_id
}

STEP 6 — Update monitor
UPDATE pokkit_monitors:
{
  last_checked_at: now(),
  last_value: found_value,
  last_value_at: now(),
  alert_count: +1 if alert sent,
  last_alert_at: now() if alert sent
}

STEP 7 — Send alert if condition met
Twilio SMS to user.phone_number:
[alert message from step 3]

ERROR HANDLING:
If Browserbase fails: log error, update last_checked_at,
do NOT send alert (avoid false negatives).
Retry on next scheduled run.
If 5 consecutive failures: SMS user
"Having trouble checking your [monitor type] monitor.
 I'll keep trying."
```

---

## AGENT 4 — REMINDER SENDER

### Purpose
Fires every 5 minutes. Sends due reminders via SMS.
Handles one-time and recurring reminders.

### Trigger
Schedule: every 5 minutes

### Process

```
STEP 1 — Find due reminders
SELECT * FROM pokkit_reminders
WHERE status = 'pending'
AND remind_at <= now()
ORDER BY remind_at ASC
LIMIT 50

STEP 2 — For each reminder

  a. Load user: SELECT from pokkit_users WHERE id=reminder.user_id
  
  b. Send SMS via Twilio:
     "🔔 [reminder.title]
      [reminder.notes if present, else omit]"
  
  c. UPDATE pokkit_reminders:
     status='sent', sent_at=now()
  
  d. If recurring is not null:
     Calculate next_remind_at:
       daily   → remind_at + 1 day
       weekly  → remind_at + 7 days
       monthly → remind_at + 1 month
     
     If next_remind_at < recurring_end_at (or no end):
       INSERT new pokkit_reminders row with next_remind_at
  
  e. Log to pokkit_conversations:
     { user_id, channel:'sms', direction:'outbound',
       message_out: sms_sent, intent:'reminder' }

ERROR HANDLING:
If Twilio fails: mark reminder status='retry',
retry on next run. After 3 failures: status='failed'.
```

---

## AGENT 5 — MORNING BRIEFING

### Purpose
Runs every hour. Finds users whose morning briefing
is scheduled for the current hour in their timezone.
Compiles and sends a personalized morning SMS.

### Trigger
Schedule: every hour on the hour

### Process

```
STEP 1 — Find users due for briefing
SELECT * FROM pokkit_users
WHERE morning_briefing_enabled = true
AND plan_status IN ('active', 'trialing')

For each user:
  Convert current UTC time to user.timezone
  If current_hour_in_user_tz = user.morning_briefing_time:
    Process this user

STEP 2 — Compile briefing for each user

  a. Get today's events:
     SELECT from pokkit_events
     WHERE user_id = user.id
     AND event_at::date = today in user timezone
     ORDER BY event_at

  b. Get weather:
     Web search: "current weather [user location from preferences]"
     Extract: temperature, conditions, high/low

  c. Get news:
     If user has news_topics in preferences:
       Web search: "[topic] news today"
       Extract: top 2 headlines
     Else:
       Web search: "top news today"
       Extract: top 2 headlines

  d. Get reminders due today:
     SELECT from pokkit_reminders
     WHERE user_id = user.id
     AND remind_at::date = today
     AND status = 'pending'
     LIMIT 2

  e. Get active monitor alerts from last 24h:
     SELECT from pokkit_monitor_log
     WHERE monitor_id IN (SELECT id FROM pokkit_monitors
                          WHERE user_id = user.id)
     AND threshold_met = true
     AND checked_at > now() - interval '24 hours'

STEP 3 — Build SMS (keep under 320 chars)

  Template:
  "Good morning [first_name]! [weather_emoji] [temp]°, [conditions].
  [IF events: "Today: [event1 title at time][, event2]." ]
  [IF news: "[headline 1 short]." ]
  [IF reminders: "Don't forget: [reminder title]." ]
  Have a great day!"

  Weather emojis:
  sunny/clear → ☀️
  cloudy → ☁️
  rain → 🌧️
  storm → ⛈️
  snow → ❄️
  
  If over 320 chars: trim news first, then events to 1

STEP 4 — Send via Twilio
  SMS to user.phone_number

STEP 5 — Log
  INSERT pokkit_conversations:
  { user_id, channel:'sms', direction:'outbound',
    message_out: sms_sent, intent:'morning_briefing' }

ERROR HANDLING:
If web search fails for weather: skip weather, send rest.
Never fail to send if user has events or reminders —
those are critical.
```

---

## AGENT 6 — EMAIL SENDER

### Purpose
Sends emails drafted by Pokkit on behalf of users.
Handles both user-requested emails and system emails (reports, etc).

### Trigger
New row in pokkit_tasks where type='email_send' AND status='pending'
Check every 30 seconds.

### Process

```
STEP 1 — Claim job

STEP 2 — Load details
task.input contains:
  to_address    — recipient email
  subject       — email subject
  body_html     — HTML email body (pre-built by Claude)
  body_text     — plain text version
  type          — user_requested | research_report | system

STEP 3 — Send via Resend API
POST https://api.resend.com/emails
{
  from: "Pokkit <hello@mail.pokkit.ai>",
  reply_to: [user.email if set],
  to: [task.input.to_address],
  subject: task.input.subject,
  html: task.input.body_html,
  text: task.input.body_text
}

STEP 4 — Log
INSERT pokkit_email_sends:
{
  user_id, to_address, subject,
  body_html, body_text, type,
  resend_id: response.id,
  status: 'sent'
}

STEP 5 — Notify user
If type = 'user_requested':
  Twilio SMS: "Email sent to [to_address] ✓"

STEP 6 — Complete job
UPDATE pokkit_tasks status='done'

ERROR HANDLING:
Resend failure → retry 3 times with 1 min delay
After 3 failures → SMS user:
"Trouble sending that email — want to try again?"
```

---

## AGENT 7 — BROWSER TASK WORKER

### Purpose
Executes any browser-based task using Browserbase + Stagehand.
Restaurant bookings, flight searches, hotel lookups,
product orders, form filling, account lookups.

### Trigger
New row in pokkit_tasks where type='browser_task' AND status='pending'
Check every 20 seconds.

### Process

```
STEP 1 — Claim job

STEP 2 — Load task details
task.input contains:
  task_description    — natural language task
  target_url          — starting URL if known
  confirm_before_act  — true for bookings/purchases
  confirmation_given  — true if user already confirmed
  expected_output     — what to return to user

STEP 3 — If confirm_before_act = true AND confirmation_given = false

  a. Open Browserbase session
  b. Navigate to target site
  c. Research/find the relevant options
  d. Extract details WITHOUT completing action
  e. Close session
  
  f. Format confirmation SMS:
     "Ready to [action]:
      [key details — business, date, time, price, etc]
      Reply YES to confirm or tell me what to change."
  
  g. Send SMS to user
  
  h. UPDATE pokkit_tasks:
     status='awaiting_confirmation',
     result={ options_found: details }
  
  i. STOP — wait for user reply
     (Agent 1 SMS handler will update
      confirmation_given=true and requeue)

STEP 4 — Execute task
Open Browserbase session

Use Stagehand to execute task_description:
  stagehand.act(task_description)

Common task patterns:

  RESTAURANT BOOKING:
  Navigate to restaurant website or OpenTable
  act("Find available times for [party_size] people 
       on [date] around [time]")
  act("Select [specific time] and complete reservation
       for [name]")
  extract("Get the confirmation number and details")
  
  FLIGHT SEARCH:
  Navigate to Google Flights or airline site
  act("Search [trip_type] from [origin] to [destination]
       on [dates] for [passengers] passenger(s)")
  extract("Get all available flights with prices,
           airlines, times, and any baggage fees")
  
  AMAZON ORDER STATUS:
  Navigate to amazon.com (use saved session if available)
  act("Go to Your Orders")
  extract("Find the most recent order for [product]
           and get its current status and delivery date")
  
  FORM FILLING:
  Navigate to target_url
  act("Fill out the form with:
       Name: [user.name]
       Email: [user.email]
       Phone: [user.phone]
       [any other required fields from task]
       Submit the form")
  extract("Get the confirmation message or number")

STEP 5 — Close Browserbase session

STEP 6 — Log action
INSERT pokkit_actions:
{
  user_id, type: task_type,
  task_description, result: extracted_result,
  status: 'completed'
}

STEP 7 — Send result to user
Format result as concise SMS.
Examples:
  "Done! Perry's confirmed Saturday 7pm for 2.
   Confirmation #4821. 🍽️"
  
  "Found 3 flights HOU→DAL tomorrow:
   $127 Southwest 8am, $143 AA 11am, $156 UA 2pm.
   Want me to book one?"
  
  "Your Amazon order for [product] ships tomorrow.
   Tracking: [number]"

STEP 8 — Complete job
UPDATE pokkit_tasks status='done',
result={ action_completed: true, details: result }

ERROR HANDLING:
Browserbase session failure → retry once
Page navigation failure → try alternative URL
Form submission failure → screenshot + report to user
"Ran into trouble completing that — 
 here's what I found before the issue: [partial result]"
```

---

## AGENT 8 — MLM COMMISSION CONNECTOR

### Purpose
Fires commission events to the Apex AgentPulse webhook
(or any configured MLM connector) on every subscription
lifecycle event.

### Trigger
New row in pokkit_tasks where type='mlm_event' AND status='pending'
Check every 30 seconds.

### Process

```
STEP 1 — Claim job

STEP 2 — Load connector config
SELECT * FROM pokkit_mlm_connectors
WHERE name = task.input.connector_name
AND active = true

STEP 3 — Load user
SELECT * FROM pokkit_users WHERE id = task.user_id

STEP 4 — Build payload
{
  event: task.input.event_type,
  // new_subscription | renewal | upgrade | cancellation
  rep_code: user.rep_code,
  user_id: user.id,
  plan: user.plan,
  mrr: task.input.mrr,
  rep_direct: connector.rep_direct_amount,
  botmakers_amount: connector.botmakers_amount,
  override_pool: connector.override_pool_amount,
  override_levels: connector.override_levels,
  timestamp: now()
}

STEP 5 — Fire webhook
POST connector.webhook_url
Headers:
  Content-Type: application/json
  X-Webhook-Secret: connector.webhook_secret
  X-Event-Type: task.input.event_type
Body: payload above

STEP 6 — Complete job
UPDATE pokkit_tasks status='done',
result={ webhook_fired: true, status_code: response.status }

ERROR HANDLING:
Non-200 response → retry 3 times with exponential backoff
After 3 failures → log error, notify BotMakers admin
Commission events must never be silently dropped.
```

---

## AGENT 9 — TRIAL ENGAGEMENT SEQUENCE

### Purpose
Sends the automated trial engagement SMS sequence
to keep users engaged and convert to paid.

### Trigger
Schedule: every hour — check for users needing sequence messages

### Process

```
STEP 1 — Find users needing sequence messages

For each sequence day [0, 1, 3, 7, 10, 12, 13]:
  
  SELECT * FROM pokkit_users
  WHERE plan_status = 'trialing'
  AND DATE(created_at + interval '[day] days') = today
  AND trial_sequence_day != [day]
  // Use a trial_sequence_day column to track progress

STEP 2 — Send appropriate message

DAY 0 (already sent at signup — skip in this agent)

DAY 1:
"Quick tip: Text me 'monitor [anything] under $[price]'
 and I'll alert you the moment it drops.
 Works for flights, hotels, any product. Try it!"

DAY 3:
"Try this: text me a list of things you need researched.
 I'll compile a full report and email it to you
 while you go do other things. Just say
 'research these things for me:' and list them."

DAY 7:
"You're halfway through your free trial.
 What's the most useful thing I've done for you?
 (Reply anytime — I'm curious and I'm learning)"

DAY 10:
"3 things Pokkit users love most:
 1. Flight price monitors that text when deals drop
 2. Instant restaurant bookings by text
 3. Research reports emailed while they sleep
 Try any of these today."

DAY 12:
"Your free trial ends in 2 days.
 After that it's $15/month — less than one Starbucks.
 Your card will be charged [trial_end_date] unless
 you text CANCEL before then."

DAY 13:
"Last day of your free trial!
 Text CANCEL before midnight to avoid being charged.
 Otherwise I'll be here every day handling things for you."

STEP 3 — Send via Twilio
SMS to user.phone_number

STEP 4 — Update user
UPDATE pokkit_users SET trial_sequence_day = [day]

STEP 5 — Log
INSERT pokkit_conversations:
{ user_id, channel:'sms', direction:'outbound',
  message_out: sms_sent, intent:'trial_sequence_day_[n]' }
```

---

## AGENT 10 — SKILL BUILDER (Phase 2 — Month 3+)

### Purpose
Dynamically builds new Pokkit skills from user suggestions
that have received enough votes. Uses Claude + Browserbase
to design, write, test, and deploy new skills automatically.

### Trigger
New/updated row in pokkit_skill_suggestions
where status='pending' AND votes >= 5
Check every hour.

### Process

```
STEP 1 — Load suggestion
SELECT * FROM pokkit_skill_suggestions
WHERE status='pending' AND votes >= 5
LIMIT 1

UPDATE status='evaluating'

STEP 2 — Evaluate feasibility
Ask Claude:
"A user wants Pokkit to be able to: [suggestion]

Evaluate:
1. Is this technically feasible via web search, 
   Browserbase, or API calls?
2. What tools would be needed?
3. What would success look like?
4. What are the risks or failure modes?
5. What trigger phrases would activate this skill?

Respond with feasible: true/false and reasoning."

STEP 3 — If feasible: design the skill

Ask Claude:
"Design a Pokkit skill for: [suggestion]

Create:
1. skill_name (snake_case, unique)
2. description (one sentence)
3. trigger_phrases (array of 5-10 example requests)
4. tools_required (list of tools needed)
5. step_by_step_process (how to execute this skill)
6. browserbase_script (Stagehand code if browser needed)
7. success_criteria (how to know it worked)
8. error_handling (what to do if it fails)"

STEP 4 — Test the skill
Run the skill against 3 test cases:
  - Typical use case
  - Edge case
  - Partial information case

If 2/3 pass:
  INSERT pokkit_skills:
  { name, description, trigger_phrases,
    tools_required, browserbase_script,
    active: true, created_by: 'dynamic' }
  
  UPDATE pokkit_skill_suggestions status='built'
  
  Notify requesting user:
  SMS: "Good news — I just learned how to [skill]!
        Try it anytime: '[example trigger phrase]'"

If < 2/3 pass:
  UPDATE pokkit_skill_suggestions status='failed'
  Log failure details
  
  If 3 build attempts failed:
    status='needs_human_review'
    Notify admin

STEP 5 — Make skill available
After INSERT to pokkit_skills:
Agent 1 (SMS Intelligence Engine) will automatically
pick up new skills on next context load because it
reads from pokkit_skills table for routing decisions.
```

---

## TWIN SETUP CHECKLIST

Before deploying any agents complete these steps:

- [ ] Connect Supabase (URL + service role key)
- [ ] Connect Anthropic API (claude-sonnet-4-5)
- [ ] Connect Twilio (SID + auth token + from number)
- [ ] Connect Browserbase (API key + project ID)
- [ ] Connect Resend (API key)
- [ ] Connect Stripe (secret key — for reading subscription data)
- [ ] Connect Apex webhook (URL + secret)
- [ ] Test Supabase read/write (insert test row, read it back)
- [ ] Test Twilio SMS (send test message to your phone)
- [ ] Test Browserbase (open session, navigate to google.com, close)
- [ ] Test Resend (send test email to yourself)
- [ ] Test Anthropic API (send test message, get response)

## AGENT DEPLOYMENT ORDER

Deploy and test agents in this order:

1. Agent 4 — Reminder Sender (simplest — no AI or browser)
2. Agent 5 — Morning Briefing (scheduled, no browser)
3. Agent 2 — Research Engine (AI + email, no browser)
4. Agent 6 — Email Sender (simple Resend integration)
5. Agent 8 — MLM Connector (webhook fire)
6. Agent 9 — Trial Sequence (scheduled SMS)
7. Agent 3 — Monitor Checker (Browserbase required)
8. Agent 7 — Browser Task Worker (Browserbase required)
9. Agent 1 — SMS Intelligence Engine (everything combined)
10. Agent 10 — Skill Builder (Phase 2 only)

Test each agent fully before deploying the next.
Agent 1 depends on all others working correctly.

## TESTING EACH AGENT

Agent 4: Insert a reminder with remind_at = 2 minutes from now.
  Wait 5 minutes. Verify SMS received.

Agent 5: Set your own morning_briefing_time to current hour.
  Verify briefing SMS received within the hour.

Agent 2: Insert research task with 3 items, your email.
  Verify formatted report email arrives within 10 minutes.

Agent 3: Insert a flight monitor HOU→DAL under $500.
  Manually trigger a check run.
  Verify pokkit_monitor_log has a new row.

Agent 7: Insert browser task "Find current hours for 
  Perry's Steakhouse Houston".
  Verify result SMS received within 5 minutes.

Agent 1: Text your Pokkit number "What's the weather today".
  Verify intelligent SMS response received.
  Verify conversation saved to pokkit_conversations.

---

*Pokkit Twin Agent Spec v1.0 | BotMakers Inc. | Confidential*
*All backend logic runs in Twin. Claude Code builds frontend only.*
