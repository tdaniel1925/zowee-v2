# POKKIT — UX PROMPTS FOR CLAUDE CODE
## One Prompt Per Page | Copy and Paste Directly Into Claude Code
### BotMakers Inc. | Confidential

---

## HOW TO USE THESE PROMPTS

Each prompt below is self-contained.
Copy the entire prompt for the page you're building
and paste it into Claude Code as your first message
for that build session.

Build pages in this order:
1. Landing Page (most important — demo closes sales)
2. Signup Page
3. User Dashboard
4. Rep Portal
5. Shared Components

---

## PROMPT 1 — LANDING PAGE

```
Build the Pokkit landing page at app/page.tsx.

PRODUCT CONTEXT:
Pokkit is a personal AI assistant that lives on a phone number.
Users text it to book flights, track prices, research things,
set reminders, draft emails — replacing Expedia, OpenTable,
Kayak, Honey, Google Alerts, and a dozen other apps.
$15/month. 14-day free trial. No app ever.
Tagline: "Delete your apps. Text Pokkit."

DESIGN DIRECTION:
Dark, bold, modern consumer tech.
NOT generic SaaS. NOT purple gradients. NOT boring.
Think: Superhuman meets Linear meets a premium mobile app.

DESIGN SYSTEM:
Load from Google Fonts:
  Syne (weights 400, 700) — display/headlines
  DM Sans (weights 400, 500) — body text

CSS variables (add to globals.css):
  --bg-primary: #0A0A0B
  --bg-secondary: #111113
  --bg-tertiary: #1A1A1D
  --accent: #00E5B4
  --accent-dim: #00B890
  --accent-glow: rgba(0, 229, 180, 0.15)
  --text-primary: #F2F2F3
  --text-secondary: #8A8A9A
  --text-tertiary: #4A4A5A
  --border: rgba(255, 255, 255, 0.08)
  --border-accent: rgba(0, 229, 180, 0.3)

MOBILE FIRST: Design for 375px. Desktop is enhancement.
All touch targets minimum 44px height.
No horizontal scroll at any viewport.

PAGE SECTIONS (build all of these):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — STICKY HEADER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sticky top. Dark background with blur.
Left: POKKIT logo in Syne font, accent color
Right: "Try Free →" button (accent color, rounded)
On mobile: just logo + button, no nav links
On desktop: add "How it works" and "Pricing" anchor links

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — HERO (above fold)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full viewport height. Two columns on desktop, stacked on mobile.

LEFT COLUMN:
Animated headline that cycles every 3 seconds with smooth fade:
- "Delete your apps."
- "Book flights."
- "Track prices."
- "Research anything."
- (loops back to "Delete your apps.")
Second line (static, large): "Text Pokkit."

Use Syne font, very large (clamp 48px to 80px).
Accent color on "Text Pokkit."

Subheadline (DM Sans, text-secondary, 18-20px):
"One text replaces Expedia, OpenTable, Kayak,
price trackers, and a dozen other apps."

Three stat pills in a row:
[$15/month] [No app required] [Any phone]
Each pill: dark background, accent border, small text

CTA button (full width on mobile):
"Try Free for 2 Weeks →"
Accent background, dark text, rounded-full
Large enough to see from across the room
Below button (small, text-secondary):
"No charge for 14 days · Cancel anytime by text"

Staggered animation on load:
headline fades up first, then subhead, then stats, then CTA

RIGHT COLUMN (desktop) / BELOW (mobile):
Animated SMS demo — phone mockup showing real conversations.

Phone mockup: dark rounded rectangle, subtle border, slight shadow
Inside: messages appearing one by one like a real conversation.

Three scenarios that auto-play in sequence.
Each scenario plays then waits 2 seconds then fades to next.

Scenario 1 — Flight booking:
  [USER bubble, right aligned, accent bg]:
  "Find me a flight to Dallas under $150 this weekend"
  
  [TYPING INDICATOR, left aligned]:
  Three animated dots (400ms delay)
  
  [POKKIT bubble, left aligned, dark bg with subtle border]:
  "Found 3 options! Cheapest: $127 Southwest
   Fri-Sun. Want me to book it?"
  
  [USER]: "Yes please"
  
  [POKKIT]: "Booked! Confirmation #SW4821.
   Southwest, departs 8am Friday. ✈️"

Scenario 2 — Price monitor:
  [USER]: "Monitor Nike Air Max — alert me under $89"
  [POKKIT]: "Watching Nike Air Max. I'll text you
   the moment it drops below $89."
  [Small badge: "2 days later..."]
  [POKKIT]: "🎯 Price drop! Nike Air Max just hit
   $84 on Amazon. Want the link?"

Scenario 3 — Restaurant booking:
  [USER]: "Book Perry's Saturday 7pm for 2"
  [POKKIT]: "Confirming: Perry's Westheimer, Sat 7pm,
   table for 2. Book it?"
  [USER]: "Yes"
  [POKKIT]: "Done! Confirmed at Perry's. #4821. 🍽️"

Message timing:
  Each message appears 800ms after previous
  Typing indicator shows for 600ms before Pokkit messages
  User messages have no typing indicator

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — APP REPLACEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id="how-it-works"
Headline: "One text. Everything handled."
Subhead: "Pokkit replaces the apps you barely use
          with one number you'll text every day."

Two cards side by side (stacked on mobile):

LEFT CARD — "The old way" (subtle red tint border):
Title: "12 apps for 12 things"
List with X marks and app names:
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
✗ Reminder apps
✗ Note apps
Bottom: "...and dozens more cluttering your phone"

RIGHT CARD — "The Pokkit way" (accent border, slight glow):
Title: "One text for everything"
Show a single SMS mockup:
  [USER]: "Find flights to Dallas, book Perry's
   tonight, track the Nike deal, remind me
   about the dentist tomorrow"
  [POKKIT]: "On it. I'll handle all four. 🎯"
Bottom: "One number. Unlimited capability."

Animation: On scroll into view, the X marks on the left
appear one by one crossing out each app name.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — HOW IT WORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3 steps in cards (row on desktop, column on mobile):

Step 1 — large "01" in accent color
Icon: message bubble icon
Title: "Text anything"
Body: "No app. No login. Just text your Pokkit
number like any contact in your phone."

Step 2 — "02"
Icon: sparkles/magic icon  
Title: "Pokkit handles it"
Body: "Books, researches, monitors, and acts —
using the same services you'd use yourself,
only faster."

Step 3 — "03"
Icon: checkmark/notification icon
Title: "Results delivered"
Body: "Confirmations, reports, price alerts,
reminders — all delivered back to your phone."

Below all 3 steps, centered:
"Works on any phone. Your parents' phone.
 Your old phone. Any phone made in the last 20 years."
(smaller text, text-secondary)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — REAL EXAMPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Headline: "See it in action"
Subhead: "Real things Pokkit does every day."

6 cards in a 2-column grid (1-column mobile, 3-column desktop):
Each card shows a mini SMS conversation + label.

Card 1 — "✈️ Flight Monitor"
User: "Alert me when Houston→Miami drops below $200"
Pokkit: "Watching. I'll text you the moment it drops."
[3 days later badge]
Pokkit: "🎯 Just dropped to $187! American Airlines, March 28-30."

Card 2 — "🍽️ Restaurant Booking"
User: "Book Perry's Saturday 7pm for 2"
Pokkit: "Confirming: Perry's Westheimer, Sat 7pm, table for 2. Book it?"
User: "Yes"
Pokkit: "Done! Confirmed. #4821."

Card 3 — "📊 Research Report"
User: "Research top 5 Medicare plans in Texas and email me"
Pokkit: "On it — where should I send the report?"
User: "sarah@email.com"
Pokkit: "Report sent! Full comparison with pricing in your inbox."

Card 4 — "💰 Price Alert"
User: "Track Nike Air Max under $89 on Amazon"
Pokkit: "Watching. I'll alert you when it drops."
Pokkit: "Price drop! $84.99 right now. Want the link?"

Card 5 — "☀️ Morning Briefing"
Pokkit: "Good morning Sarah! ☀️ 78° sunny. Dentist at 2pm today.
Delta DL234 on time. 3 emails need attention."

Card 6 — "📦 Order Tracking"
User: "Where's my Amazon order for the headphones?"
Pokkit: "Your Sony headphones ship tomorrow. 
Tracking: 1Z999AA10123456784. Arrives Thursday."

Each card: dark background, subtle border, rounded corners
Label at top in small accent-colored text

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — PRICING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
id="pricing"
Headline: "Simple pricing. No surprises."

Two cards centered (stacked on mobile, side by side on desktop):

SOLO CARD (accent border, subtle glow):
Badge: "Most Popular"
$15 / month
"For one person"

Checkmark list:
✓ Book flights, hotels & restaurants
✓ Monitor prices & alert when they drop
✓ Research reports emailed to you
✓ Reminders & morning briefings
✓ Email drafting & sending  
✓ New skills added every week
✓ Works on any phone — no app ever

[Start Free — 2 Weeks on Us →]
(full width, accent button)

"No charge for 14 days
 Cancel anytime by texting CANCEL"

FAMILY CARD (standard border):
$24 / month
"For up to 6 people"

Same feature list plus:
✓ Up to 6 phone numbers
✓ Shared plan, everyone included

[Start Family Trial →]

Below both cards, centered, small text:
"🔒 Secure checkout · Stripe & PayPal accepted"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — TESTIMONIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Headline: "What people are saying"

3 quote cards in a row (column on mobile):

Card 1:
"I texted Pokkit to monitor Houston→Miami flights.
 Three days later I got a text — prices dropped to $134.
 Booked it in 30 seconds without opening a single app."
— Mike T., Houston TX
★★★★★

Card 2:
"I sent Pokkit 8 things to research for a client meeting.
 Got a professional report in my inbox 20 minutes later
 while I was driving to another appointment."
— Sarah K., Insurance Agent, Katy TX
★★★★★

Card 3:
"My wife loves that I actually remember our anniversary now.
 Pokkit texts me a week before every important date.
 $15 a month well spent."
— David R., Dallas TX
★★★★★

Card style: dark bg, subtle border, quote marks in accent color

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — FAQ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Headline: "Questions"

Accordion (one open at a time):

Q: Does it work with my phone?
A: Yes. Pokkit works via regular text message (SMS) on
   any phone. No smartphone required. No app to download.
   If you can send a text, you can use Pokkit.

Q: What can Pokkit actually do?
A: Book restaurants, flights, and hotels. Monitor prices
   and alert you when they drop. Research anything and
   email you a formatted report. Set reminders. Draft and
   send emails. Answer any question. Track orders.
   New skills added every week.

Q: What if it can't do something?
A: Pokkit tells you honestly. You can text "I wish you
   could [thing]" to suggest a new skill. Popular requests
   get built and deployed to everyone automatically.

Q: Is my information secure?
A: Yes. We never store passwords. Account connections
   use secure OAuth tokens. Your data is encrypted
   and never sold or shared.

Q: How do I cancel?
A: Text CANCEL to your Pokkit number. Done.
   No cancellation forms, no phone calls, no hassle.

Q: What happens after the free trial?
A: Your card is charged $15 on day 15. You'll get a
   reminder text on day 12 and day 13. Cancel before
   then and you owe nothing.

Accordion animation: smooth height transition, chevron rotates

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — FINAL CTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full width section, dark bg with subtle accent glow
Centered content:

Large headline (Syne): "Start texting Pokkit today."
Subhead: "Replace a dozen apps with one text message."

[Try Free for 2 Weeks →]
Large accent button, full width on mobile

Small text: "$15/month after trial · Cancel anytime by text"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOOTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POKKIT (logo, accent color)
"Delete your apps. Text Pokkit."

Links row: Privacy Policy | Terms of Service
"© 2026 BotMakers Inc. All rights reserved."

ROUTING:
All "Try Free" buttons → /signup
"Manage Billing" → /account
Rep link format: /[repcode]

PERFORMANCE:
Lazy load images below fold
Preconnect to fonts.googleapis.com
Target: < 3 second load on mobile 4G
```

---

## PROMPT 2 — SIGNUP PAGE

```
Build the Pokkit signup page at app/signup/page.tsx
AND the rep referral page at app/[repcode]/page.tsx.

Both pages show the same signup form.
The [repcode] page pre-loads rep information and
shows "You were invited by [Rep Name]" at the top.

DESIGN: Same dark theme as landing page.
Centered card layout. Simple and fast.

LAYOUT:
Vertically centered on screen.
Max width 480px. Centered horizontally.
Mobile: full width with 16px padding.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOP — LOGO + TAGLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POKKIT (accent color, Syne font, centered)
"Delete your apps. Text Pokkit."
(text-secondary, small, centered)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REP REFERRAL BADGE (only on /[repcode])
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If repcode is present in URL:
  Load rep name from Supabase pokkit_users where rep_code = [repcode]
  Show banner: "🎉 You were invited by [Rep Name]"
  Accent border, subtle accent background, centered

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAIN CARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dark card, subtle border, rounded-xl, generous padding

Heading: "Start your free 2-week trial"
Subhead: "No charge until day 15. Cancel by text anytime."

FORM FIELDS:

Your name
[________________________________]

Mobile number (this becomes your Pokkit number)
[________________________________]
Helper text: "We'll text you at this number"

Choose your plan:
Two option cards side by side:

[Solo — $15/month]          [Family — $24/month]
1 person                    Up to 6 people
(radio select — solo selected by default)

Selected plan shows accent border + checkmark

[Continue to Secure Checkout →]
Full width, accent button, large
Loading state: spinner + "Setting up your account..."

Below button:
Row of trust signals (small icons + text):
🔒 Secure checkout via Stripe & PayPal
✓ No charge for 14 days
✓ Cancel anytime by text

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUCCESS STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
After Stripe checkout completes and user returns:
Show success screen (replace form):

Large checkmark in accent color (animated)
"You're in! 🎉"
"Check your phone — your welcome text is on its way."
"Your Pokkit number: (832) 555-0142"
(load from Supabase after auth)

Button: "View Your Dashboard →" → /account

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORM LOGIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
On submit:
1. Validate: name required, valid US phone number, plan selected
2. POST to /api/stripe/checkout with { name, phone, repCode, plan }
3. API returns { url } — redirect to Stripe checkout
4. On return from Stripe: show success state

Phone validation: must be valid US format
Format as user types: (XXX) XXX-XXXX
Store as E.164: +1XXXXXXXXXX

Error states:
- Invalid phone: "Please enter a valid US phone number"
- Name empty: "Please enter your name"
- API error: "Something went wrong — please try again"
```

---

## PROMPT 3 — USER DASHBOARD

```
Build the Pokkit user dashboard at app/account/page.tsx.

This is where users manage their Pokkit account.
All data comes from Supabase — Twin writes it, we display it.
Mobile first. Clean. Useful. Not overwhelming.

AUTH: Use Supabase auth magic link (phone number or email).
If not authenticated: redirect to /account/login.

DESIGN: Same dark theme. Clean card layout.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEADER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POKKIT (logo, left)
Right side: plan badge + [Manage Billing] button
Plan badge examples: "Solo $15" or "Family $24"
[Manage Billing] → opens Stripe portal in new tab

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — POKKIT NUMBER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Card with accent border:
"Your Pokkit Number"
(832) 555-0142 (large, prominent, Syne font)

Two buttons side by side:
[Copy Number] — copies to clipboard, shows "Copied!" briefly
[Open in Messages] — sms: link for mobile

Helper text (text-secondary, small):
"Text this number from any phone anytime.
 Add it as a contact named 'Pokkit'."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — ACTIVE MONITORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Header: "Active Monitors" + count badge
"What Pokkit is watching for you"

Load from pokkit_monitors WHERE status='active'
AND user_id = current user

If empty:
  Empty state with icon
  "Nothing being monitored yet."
  "Text Pokkit: 'Monitor [flight/price/website]...'"

For each monitor:
  Card with:
  - Icon based on type (✈️ flight, 📦 product, 🌐 website, 🏨 hotel)
  - Label (e.g., "HOU→DAL under $150")
  - Last checked: "2 hours ago" (relative time)
  - Current value: "$187" or "No change detected"
  - Threshold: "Alert when below $150"
  - [Cancel] button → DELETE /api/user/monitors/[id]
    Confirm dialog before canceling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — UPCOMING REMINDERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Header: "Upcoming Reminders" + count

Load from pokkit_reminders WHERE status='pending'
AND user_id = current user
AND remind_at > now()
ORDER BY remind_at ASC
LIMIT 10

If empty:
  "No upcoming reminders."
  "Text Pokkit: 'Remind me to [thing] on [date]'"

For each reminder:
  🔔 [title]
  [formatted date/time — "Tomorrow at 9:00 AM"]
  [recurring badge if recurring]
  [Cancel] button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — RECENT ACTIVITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Header: "Recent Activity"

Load from pokkit_conversations WHERE user_id = current user
ORDER BY created_at DESC LIMIT 20

Group by date (Today, Yesterday, [date])

For each conversation:
  Direction indicator (→ sent / ← received)
  Message preview (truncated to 60 chars)
  Intent badge (if set): "booking" | "research" | "monitor" | etc
  Time (relative: "2h ago", "Yesterday 3pm")

[View All History] button if more than 20

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — ACCOUNT SETTINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Minimal section:

Morning Briefing toggle:
  [ON/OFF toggle]
  "Get a daily briefing text with weather,
   calendar, and news"
  If ON: show time picker for briefing time

Plan information:
  Current plan: Solo $15/month
  Next billing: March 28, 2026
  [Manage Billing →] Stripe portal
  [Upgrade to Family →] if on solo plan (goes to /signup?plan=family)

Danger zone:
  [Cancel Subscription] — opens Stripe portal
  Note: "Or just text CANCEL to your Pokkit number"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATA LOADING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use Supabase client-side for all reads.
Show skeleton loaders while data loads.
Refresh monitors and reminders every 60 seconds.
No real-time subscriptions needed — polling is fine.
```

---

## PROMPT 4 — REP PORTAL

```
Build the Pokkit rep portal at app/dashboard/rep/page.tsx.

This is where Apex reps manage their Pokkit subscribers
and track commissions. Simple. Data-focused. Mobile-friendly.

AUTH: Rep must be authenticated AND have a rep_code set
in their pokkit_users record.
If not authenticated: /account/login
If authenticated but no rep_code: show "Not a rep" message

DESIGN: Same dark theme. Dashboard layout.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HEADER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POKKIT REP PORTAL (logo + label)
"Welcome, [rep name]"
Rep code: [code] (small badge)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — REFERRAL LINK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Card with accent border:
"Your Referral Link"
pokkit.ai/[repcode]
(large, readable, monospace-style)

Buttons:
[Copy Link] — clipboard + "Copied!" feedback
[Share via Text] — opens SMS with pre-written message:
  "Try Pokkit free for 2 weeks — it replaces Expedia,
   OpenTable, and a dozen other apps with one text.
   Sign up here: pokkit.ai/[repcode]"
[Share via Email] — opens mailto with same message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — THIS MONTH STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4 metric cards in a 2x2 grid:

[Active Subscribers]     [Trial Subscribers]
Count from Supabase      Count from Supabase
plan_status='active'     plan_status='trialing'

[New This Month]         [Est. Direct Commission]
Signups this month       (solo_count × $7.50) +
                         (family_count × $10.00)
                         formatted as "$XXX.XX"

Each card: dark bg, subtle border, large number, small label

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — SUBSCRIBER LIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Header: "Your Subscribers ([total count])"

Load from pokkit_users WHERE rep_code = rep.rep_code
ORDER BY created_at DESC

Table (scrollable on mobile):
Name | Plan | Status | Joined | Monthly Commission

Status badges:
Active → green badge
Trial → yellow badge  
Past Due → red badge
Canceled → gray badge

Monthly Commission column:
Active Solo → $7.50
Active Family → $10.00
Trial → $0.00 (grayed, "Pending")
Canceled → $0.00 (grayed)

Show 10 at a time with [Load More] button

Total row at bottom:
"Total active commission: $[sum]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — COMMISSION HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Header: "Commission History"
Subtext: "Actual payments processed by Apex Affinity Group"

Load from pokkit_tasks WHERE type='mlm_event'
AND input->>'rep_code' = rep.rep_code
ORDER BY created_at DESC

Show monthly summaries:
March 2026    12 active subs    $90.00 est.
February 2026  9 active subs    $67.50 est.
January 2026   5 active subs    $37.50 est.

Note at bottom (text-secondary, small):
"Commission estimates based on $7.50/Solo and $10.00/Family.
 Actual payments include overrides and are processed by
 Apex Affinity Group AgentPulse."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — REP RESOURCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3 resource cards:

[Demo Script]
"The 3-minute demo that closes every room"
Text: Book a restaurant live in front of the prospect.
They see it work. They sign up.
[View Full Script →]

[Talking Points]  
"Common questions and best answers"
- "Why not just use ChatGPT?"
- "Does it work on my phone?"
- "What does it actually do?"
[View Talking Points →]

[Share Materials]
[Copy Referral Link] [Download One-Pager]
```

---

## PROMPT 5 — SHARED COMPONENTS

```
Build these shared components used across all pages.
Put in /components/ui/ directory.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 1 — AnimatedSmsDemo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: components/ui/AnimatedSmsDemo.tsx

A phone mockup that shows SMS conversations
playing out automatically like real messages.

Props:
  scenarios: Scenario[]
  autoPlay?: boolean (default true)
  loop?: boolean (default true)

Scenario type:
  messages: Message[]
  label?: string

Message type:
  from: 'user' | 'pokkit'
  text: string
  delay?: boolean // shows "2 days later" badge before

Visual design:
  Phone frame: dark rounded rectangle (360×640 or similar)
  Status bar at top: time + battery icons (decorative)
  Chat area: scrollable, messages appear from bottom
  User messages: right aligned, accent background, white text
  Pokkit messages: left aligned, dark bg, light border, white text
  "POKKIT" label at top of chat (like a contact name)
  Typing indicator: 3 animated dots in Pokkit message bubble style

Animation timing:
  800ms between each message appearing
  Typing indicator shows for 600ms before Pokkit messages
  After last message: wait 3 seconds
  Fade out entire conversation (500ms)
  Wait 500ms
  Fade in next scenario
  Repeat

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 2 — PokkitButton
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: components/ui/PokkitButton.tsx

Props:
  variant: 'primary' | 'secondary' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  href?: string
  onClick?: () => void
  children: ReactNode

Primary: accent background, dark text, rounded-full
Secondary: transparent, accent border, accent text
Ghost: transparent, text-secondary, no border

Loading state: spinner replaces text, button disabled

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 3 — PokkitCard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: components/ui/PokkitCard.tsx

Props:
  variant: 'default' | 'accent' | 'featured'
  padding?: 'sm' | 'md' | 'lg'
  children: ReactNode

Default: bg-secondary, subtle border
Accent: bg-secondary, accent border (rgba(0,229,180,0.3))
Featured: bg-secondary, accent border, subtle accent glow background

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 4 — StatusBadge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: components/ui/StatusBadge.tsx

Props:
  status: 'active' | 'trial' | 'past_due' | 'canceled'

active: green bg, green text
trial: yellow bg, yellow text
past_due: red bg, red text
canceled: gray bg, gray text

Small pill shape, text in Syne or DM Sans

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 5 — SkeletonLoader
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: components/ui/SkeletonLoader.tsx

Animated placeholder for loading states.
Pulse animation on dark background rectangles.
Used in dashboard while Supabase data loads.

Variants:
  'card' — rectangle placeholder
  'text' — line placeholder  
  'circle' — avatar placeholder

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT 6 — PokkitHeader
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: components/layout/PokkitHeader.tsx

Props:
  variant: 'landing' | 'dashboard' | 'rep'

Landing: logo + nav links + CTA button
Dashboard: logo + plan badge + billing button
Rep: logo + "Rep Portal" label + rep code badge

Sticky. Background blur. Dark.
Mobile: simplified (logo + primary action only)
```

---

## PROMPT 6 — MARKETING COPY ASSETS

```
Create a markdown file at /marketing/copy.md
containing all Pokkit marketing copy assets.
These will be used by reps, in emails, and on social.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAGLINES (use on landing page, ads, rep materials)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary: "Delete your apps. Text Pokkit."
Secondary: "One text. Everything handled."
Short: "Text it. Done."
Value prop: "The AI that actually does things."
Price anchor: "Less than $15 a month. More than a dozen apps."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ELEVATOR PITCHES (for reps to memorize)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

10-second version:
"It replaces Expedia, OpenTable, Kayak, and a dozen
 other apps with one text message. $15 a month."

30-second version:
"You know how you have 50 apps on your phone but only
 use 5 of them? Pokkit replaces the other 45 with one
 phone number you text. It books flights, tracks prices,
 researches things, sets reminders — all by text.
 No app. No login. $15 a month. Two weeks free."

60-second demo version:
"Let me show you something. [text Pokkit in front of them]
 I just asked it to book [restaurant] for Saturday.
 Watch this. [wait for confirmation text]
 That just replaced OpenTable, Yelp, and 20 minutes
 of searching. $15 a month. Want to try it free?
 No charge for two weeks."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJECTION RESPONSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"Why not just use ChatGPT?"
"ChatGPT tells you how to do things.
 Pokkit does them for you.
 It just booked that restaurant — ChatGPT can't do that."

"I already have Siri / Google Assistant."
"Siri looks things up. Pokkit takes action.
 Ask Siri to book you a table. It'll open the Yelp app.
 Ask Pokkit — it books the table and texts you
 the confirmation number."

"That sounds complicated to set up."
"There's nothing to set up. You sign up, you get a
 phone number, you text it. That's it.
 No app, no login, no configuration."

"$15 seems like a lot."
"Less than one Starbucks a week.
 And it replaces apps you're already using — just
 scattered across your phone. This puts them all
 in one place."

"I'm not very tech savvy."
"That's exactly who this is for.
 If you can send a text message you can use Pokkit.
 There's literally nothing to learn."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOCIAL MEDIA POSTS (for reps to share)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Post 1 — Demo story:
"I texted a number and it booked my dinner reservation.
 No app. No login. Just texted it like a person.
 Confirmed in 4 minutes. This is Pokkit.
 $15/month, 2 weeks free → [link]"

Post 2 — App replacement:
"Deleted 12 apps off my phone this week.
 Expedia, OpenTable, Kayak, Honey, GasBuddy...
 All replaced by one text message.
 Pokkit does what all of them did, faster, for $15/month.
 [link]"

Post 3 — Price alert:
"I set a flight monitor 3 days ago.
 Got a text this morning: 'Houston→Miami dropped to $134.'
 Booked it in 30 seconds.
 This is what Pokkit does while you live your life.
 [link]"

Post 4 — Research:
"Texted Pokkit: 'Research the top 5 Medicare plans
 in Texas and email me a summary.'
 Report was in my inbox 20 minutes later
 while I was driving to my next appointment.
 $15/month. [link]"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMAIL TEMPLATES FOR REPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Template 1 — Cold outreach:
Subject: This replaced 12 apps on my phone

Hi [Name],

Quick question — how many apps do you have on your
phone that you barely use? For me it was Expedia,
OpenTable, Kayak, price trackers, reminder apps...

I found something that replaced all of them with one
text message.

It's called Pokkit. You text it like a person and it:
• Books your restaurants and flights
• Monitors prices and alerts you when they drop
• Researches anything and emails you a report
• Sets reminders and sends morning briefings

$15 a month. Two weeks free. No app to download.

Try it here: [rep link]

[Rep Name]

Template 2 — Follow up after showing someone:
Subject: The Pokkit link I mentioned

Hey [Name],

Here's the link to try Pokkit free for two weeks:
[rep link]

No charge until day 15. Cancel any time by texting CANCEL.

The first thing to try: text it the name of a
restaurant and ask it to book a table. See what happens.

[Rep Name]
```

---

*Pokkit UX Prompts v1.0 | BotMakers Inc. | Confidential*
*Use each prompt as the opening message in a Claude Code session.*
*Build pages in order: Landing → Signup → Dashboard → Rep Portal → Components*
