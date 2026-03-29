# Jordyn

Personal AI assistant via SMS. No app required.

## Status: GATE 1 Complete ✓

### What's Built

**GATE 0 — Project Setup** ✓
- Next.js 14 + TypeScript + Tailwind CSS
- Supabase database (13 tables created)
- Stripe products ($15 Solo, $24 Family with 14-day trials)
- Environment configuration
- Build tested and passing

**GATE 1 — Full Backend & Webhooks + Intelligence** ✓
- Twilio SMS webhook with Claude API processing
- **Intent detection system** (10 intent types)
- **Smart routing** to specialized handlers
- Price monitoring (products & flights)
- Reminder creation
- Booking assistance (flights, hotels, restaurants)
- Research & question answering
- Stripe subscription webhooks
- Stripe checkout & customer portal
- User creation and management
- Conversation logging with intent tracking

### API Routes

**Twilio:**
- `POST /api/twilio/sms` — Receives SMS, processes with Claude, sends reply

**Stripe:**
- `POST /api/stripe/webhook` — Handles subscription events
- `POST /api/stripe/checkout` — Creates checkout session
- `POST /api/stripe/portal` — Opens billing portal

### How It Works

```
User texts: "Monitor Nike shoes under $89"
    ↓
Twilio webhook → /api/twilio/sms
    ↓
Validate signature + find/create user
    ↓
Detect intent with Claude API
    ↓
Intent: monitor_price (95% confidence)
Entities: { product_name: "Nike shoes", target_price: "89" }
    ↓
Route to monitor handler
    ↓
Create monitor in Jordyn_monitors table
    ↓
Save conversation to Supabase
    ↓
Send SMS reply: "✓ Watching Nike shoes! I'll text when it drops below $89."
    ↓
User receives intelligent response
```

### Supported Intents

1. **monitor_price** — Track product prices
2. **monitor_flight** — Track flight prices
3. **reminder** — Set reminders
4. **booking_flight** — Search/book flights
5. **booking_hotel** — Find/book hotels
6. **booking_restaurant** — Reserve tables
7. **research** — Deep topic research
8. **question** — General Q&A
9. **help** — Show capabilities
10. **cancel** — Subscription management

### Environment Variables Required

See `.env.local` for complete list:
- Supabase (URL, anon key, service role key)
- Twilio (account SID, auth token, phone number)
- Stripe (secret key, webhook secret, price IDs)
- Anthropic (API key for Claude)
- Resend (API key for emails)

### Database Tables

All 13 Jordyn tables created in Supabase:
- `Jordyn_users` — User accounts & subscription status
- `Jordyn_conversations` — SMS message history
- `Jordyn_tasks` — Background task queue (for future use)
- `Jordyn_monitors` — Price & travel monitors
- `Jordyn_reminders` — User reminders
- `Jordyn_skills` — Available assistant capabilities
- `Jordyn_mlm_connectors` — MLM commission tracking
- And 6 more supporting tables

### What's Next

**GATE 2 — Landing Page**
- Hero section with animated SMS demo
- App replacement showcase
- How it works
- Pricing
- Testimonials
- FAQ

**GATE 3 — Signup Flow**
- Simple 3-field form
- Stripe checkout integration
- Rep referral link support

**GATE 4 — User Dashboard**
- Active monitors
- Upcoming reminders
- Recent conversations
- Account management

**GATE 5 — Rep Portal**
- Referral link
- Subscriber stats
- Commission tracking

### Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run database migration
npx tsx scripts/run-clean-migration.ts

# Check database tables
npx tsx scripts/check-tables.ts

# Create Stripe products
npx tsx scripts/create-stripe-products.ts
```

### Files Created

**Intelligence System:**
- `lib/intents.ts` — Intent detection with Claude
- `lib/handlers/monitor-handler.ts` — Price & flight monitoring
- `lib/handlers/reminder-handler.ts` — Reminder creation
- `lib/handlers/booking-handler.ts` — Booking assistance
- `lib/anthropic.ts` — Claude API client
- `lib/twilio-client.ts` — Twilio SMS utilities

**API Routes:**
- `app/api/twilio/sms/route.ts` — Full SMS processor
- `app/api/stripe/webhook/route.ts` — Subscription events
- `app/api/stripe/checkout/route.ts` — Payment flow
- `app/api/stripe/portal/route.ts` — Account management

**Guides:**
- `DEPLOYMENT.md` — Complete deployment guide
- `TESTING.md` — Comprehensive test cases

### Testing

See `TESTING.md` for comprehensive test cases.

**Quick Tests:**

```
Text: "Monitor Nike Air Max under $89"
→ Creates price monitor

Text: "Watch flights from Houston to Dallas under $150"
→ Creates flight monitor

Text: "Remind me tomorrow at 9am to call mom"
→ Creates reminder

Text: "Help"
→ Shows all capabilities
```

**Deployment:**

See `DEPLOYMENT.md` for complete Vercel + Twilio + Stripe setup.

---

**Built with:** Next.js 14, Tailwind CSS, Supabase, Stripe, Twilio, Claude API
