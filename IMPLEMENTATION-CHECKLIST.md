# Pokkit Implementation Checklist

## Status: Ready for Launch 🚀

### ✅ COMPLETED

#### Core Application
- [x] Complete rebrand from Zowee to Pokkit
- [x] Landing page with new pricing tiers
- [x] Signup flow supporting all 5 plans
- [x] Authentication system (email/password)
- [x] User dashboard (/account)
- [x] Admin panel (/admin)
- [x] Middleware for route protection

#### SMS Features
- [x] Twilio SMS webhook
- [x] Claude AI intent parser (20+ intents)
- [x] SMS skill executor with routing
- [x] Help skill
- [x] Price tracking skill
- [x] General conversation skill
- [x] Control skill (pause/resume)
- [x] YouTube search skill

#### Browserbase Integration
- [x] Research skills (price comparison, reviews)
- [x] Form filling skills
- [x] Payment processing skills (with SMS confirmation)
- [x] Browser task database schema
- [x] Result poller cron job
- [x] Session management

#### Alexa Integration
- [x] Smart home control skill
- [x] OAuth integration
- [x] /account/integrations page
- [x] Status, callback, unlink endpoints
- [x] Multi-user token storage

#### Payment & Billing
- [x] Stripe integration
- [x] Subscription management
- [x] Payment methods storage
- [x] Webhook handling
- [x] Trial period logic

#### Database
- [x] Migration 001: Initial schema
- [x] Migration 002: Remove MLM, add Apex
- [x] Migration 003: Browserbase tasks
- [x] Migration 004: Voice plans and features
- [x] RLS policies on all tables

#### DevOps
- [x] Lazy initialization for all clients
- [x] Environment variable setup
- [x] Vercel cron jobs
- [x] Build fixes for deployment

---

### ⏳ PENDING - Voice Agent Implementation

#### 1. Stripe Setup (15 minutes)
- [ ] Create Solo + Voice product ($39/mo) in Stripe
- [ ] Create Family + Voice product ($59/mo) in Stripe
- [ ] Create Business product ($97/mo) in Stripe
- [ ] Copy price IDs to `.env.local`
- [ ] Update price IDs in Vercel environment variables
- [ ] Update old Solo and Family products to new prices

**Commands:**
```bash
# Update existing products
stripe prices create --product=prod_SOLO --unit-amount=1900 --currency=usd --recurring[interval]=month
stripe prices create --product=prod_FAMILY --unit-amount=3400 --currency=usd --recurring[interval]=month

# Create new products
stripe products create --name="Pokkit Solo + Voice" --description="100 voice minutes per month"
stripe prices create --product=prod_xxx --unit-amount=3900 --currency=usd --recurring[interval]=month

stripe products create --name="Pokkit Family + Voice" --description="200 voice minutes for up to 5 users"
stripe prices create --product=prod_xxx --unit-amount=5900 --currency=usd --recurring[interval]=month

stripe products create --name="Pokkit Business" --description="200 voice minutes + email & calendar"
stripe prices create --product=prod_xxx --unit-amount=9700 --currency=usd --recurring[interval]=month
```

#### 2. Database Migration (5 minutes)
- [ ] Open Supabase SQL Editor
- [ ] Run migration 004_voice_plans_and_features.sql
- [ ] Verify new columns exist in pokkit_users
- [ ] Verify pokkit_voice_calls table created
- [ ] Test trigger by updating a user's plan

**Verification queries:**
```sql
-- Check columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pokkit_users'
  AND column_name LIKE 'voice%';

-- Check table
SELECT * FROM pokkit_voice_calls LIMIT 1;

-- Test trigger
UPDATE pokkit_users
SET plan = 'solo_voice'
WHERE id = 'test_user_id';

SELECT voice_enabled, voice_minutes_quota
FROM pokkit_users
WHERE id = 'test_user_id';
```

#### 3. VAPI Account Setup (30 minutes)
- [ ] Sign up at vapi.ai
- [ ] Create organization
- [ ] Get API key
- [ ] Add API key to `.env.local` as `VAPI_API_KEY`
- [ ] Create webhook secret
- [ ] Add to `.env.local` as `VAPI_WEBHOOK_SECRET`
- [ ] Configure callback URL: `https://pokkit.ai/api/vapi/webhook`
- [ ] Test webhook with VAPI's test tool

#### 4. Voice Agent Implementation (4-6 hours)
- [ ] Create `/app/api/vapi/webhook/route.ts`
- [ ] Implement function call routing
- [ ] Create voice provisioning function
- [ ] Create voice minutes reset cron (`/api/cron/reset-voice-minutes`)
- [ ] Add cron to vercel.json
- [ ] Implement overage charging
- [ ] Test end-to-end flow

**Files to create:**
```
app/api/vapi/
├── webhook/
│   └── route.ts          # Main VAPI webhook handler
lib/vapi/
├── client.ts             # VAPI client wrapper
├── provisioning.ts       # Per-user assistant setup
└── functions.ts          # Function definitions for VAPI
```

#### 5. Dashboard Updates (2 hours)
- [ ] Add voice usage section to /account
- [ ] Show minutes used / quota
- [ ] Display reset date
- [ ] List recent voice calls
- [ ] Show call transcripts
- [ ] Add upgrade CTA for non-voice users

#### 6. Testing (2 hours)
- [ ] Test signup for each plan type
- [ ] Test voice provisioning on signup
- [ ] Test calling Pokkit number
- [ ] Test function calls via voice
- [ ] Test usage tracking
- [ ] Test overage charging
- [ ] Test monthly reset
- [ ] Test plan upgrades/downgrades

---

### 📋 Optional Enhancements

#### Email & Calendar (Business Plan)
- [ ] Integrate with Gmail API
- [ ] Email drafting and sending
- [ ] Calendar event creation
- [ ] Meeting scheduling
- [ ] Email-to-SMS forwarding

#### Advanced Features
- [ ] Voice call recording storage
- [ ] Call analytics dashboard
- [ ] Voice sentiment analysis
- [ ] Multi-language support
- [ ] Custom wake words

#### Mobile App (Optional)
- [ ] React Native app
- [ ] Push notifications
- [ ] In-app voice calling
- [ ] Conversation history
- [ ] Settings management

---

## Deployment Checklist

### Pre-Deploy
- [x] All code committed and pushed
- [x] Environment variables documented
- [ ] Stripe products created
- [ ] Database migration applied
- [ ] VAPI account configured

### Deploy
- [ ] Set all env vars in Vercel
- [ ] Deploy to production
- [ ] Verify cron jobs running
- [ ] Test SMS webhook
- [ ] Test voice webhook (if implemented)
- [ ] Monitor error logs

### Post-Deploy
- [ ] Test signup flow end-to-end
- [ ] Test SMS processing
- [ ] Test Alexa integration
- [ ] Test Browserbase tasks
- [ ] Monitor Stripe webhooks
- [ ] Check database logs

---

## Environment Variables Needed in Production

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxtbzypheuiniuqynas.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SOLO_PRICE_ID=price_...
STRIPE_FAMILY_PRICE_ID=price_...
STRIPE_SOLO_VOICE_PRICE_ID=price_...
STRIPE_FAMILY_VOICE_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=https://pokkit.ai

# Apex
APEX_WEBHOOK_URL=https://agentpulse.apexaffinity.com/api/zowee/events
APEX_WEBHOOK_SECRET=...

# Cron
CRON_SECRET=... (generate secure random string)

# Browserbase
BROWSERBASE_API_KEY=bb_live_...
BROWSERBASE_PROJECT_ID=...

# Alexa
ALEXA_CLIENT_ID=amzn1...
ALEXA_CLIENT_SECRET=amzn1...
NEXT_PUBLIC_ALEXA_CLIENT_ID=amzn1...

# VAPI
VAPI_API_KEY=... (from vapi.ai)
VAPI_WEBHOOK_SECRET=... (generate secure random string)
```

---

## Cost Analysis

### Monthly Operating Costs (per user)

**SMS Only Plans (Solo, Family):**
- Twilio SMS: ~$0.01/message × 30 = $0.30/mo
- Claude API: ~$0.02/request × 30 = $0.60/mo
- Browserbase: ~$0.50/mo (5 tasks)
- **Total cost: ~$1.40/user/mo**
- **Revenue: $19-34/mo**
- **Margin: 93-98%** ✅

**Voice Plans:**
- SMS costs: $1.40/mo
- VAPI: $0.15/min × 50 avg = $7.50/mo
- **Total cost: ~$8.90/user/mo**
- **Revenue: $39-97/mo**
- **Margin: 77-91%** ✅

### Revenue Projections

**100 users:**
- 40 Solo ($19) = $760/mo
- 30 Family ($34) = $1,020/mo
- 20 Solo + Voice ($39) = $780/mo
- 8 Family + Voice ($59) = $472/mo
- 2 Business ($97) = $194/mo
- **Total: $3,226/mo**

**1,000 users:**
- Same distribution = **$32,260/mo**
- Costs: ~$5,000/mo
- **Net: ~$27,000/mo** 💰

---

## Support & Documentation

### User-Facing Docs Needed
- [ ] How to link Alexa account
- [ ] Voice calling guide
- [ ] SMS command reference
- [ ] Price tracking tutorial
- [ ] Browserbase features guide
- [ ] Plan comparison table
- [ ] FAQ page

### Internal Docs
- [x] VAPI integration spec
- [x] Project spec
- [x] Dependency map
- [ ] Runbook for common issues
- [ ] Scaling guide

---

## Next Steps Priority

1. **High Priority (Launch Blockers)**
   - [ ] Create Stripe products
   - [ ] Apply database migration
   - [ ] Set production env vars
   - [ ] Deploy to Vercel
   - [ ] Test end-to-end

2. **Medium Priority (Voice Features)**
   - [ ] VAPI account setup
   - [ ] Implement voice webhook
   - [ ] Voice provisioning
   - [ ] Dashboard voice UI
   - [ ] Test voice calling

3. **Low Priority (Enhancements)**
   - [ ] Email integration (Business plan)
   - [ ] Calendar sync (Business plan)
   - [ ] Advanced analytics
   - [ ] Mobile app (future)

---

**Last Updated:** 2026-03-28
**Status:** Ready for production deployment minus voice features
**Estimated Time to Voice Launch:** 8-10 hours of dev work
