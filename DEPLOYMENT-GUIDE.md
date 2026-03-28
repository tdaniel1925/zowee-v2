# Pokkit Deployment Guide

## ✅ Completed Steps

### 1. Stripe Products Created ✅
All 5 pricing tiers have been created in Stripe:

```
Solo ($19/mo):          price_1TG3l30UcCrfpyRULCFgKPU5
Family ($34/mo):        price_1TG3l30UcCrfpyRUVlOw7WNK
Solo + Voice ($39/mo):  price_1TG3l30UcCrfpyRUNq67MAQc
Family + Voice ($59/mo): price_1TG3l40UcCrfpyRUYjl1f01o
Business ($97/mo):      price_1TG3l40UcCrfpyRUiRQZO6oG
```

These are already in `.env.local`.

### 2. Code Implementation ✅
- ✅ VAPI client wrapper
- ✅ Voice provisioning system
- ✅ Webhook endpoint
- ✅ Function call routing
- ✅ Usage tracking
- ✅ Overage charging
- ✅ Monthly reset cron
- ✅ Dashboard UI
- ✅ All 5 plans supported

---

## 🔴 ACTION REQUIRED: Database Migration

### Step 1: Apply Migration 004

1. **Open Supabase SQL Editor:**
   https://supabase.com/dashboard/project/xxxtbzypheuiniuqynas/sql/new

2. **Copy the migration file:**
   Open: `supabase/migrations/004_voice_plans_and_features.sql`

3. **Paste into SQL Editor and click "Run"**

4. **Verify with these queries:**

```sql
-- Check columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pokkit_users'
  AND column_name LIKE 'voice%';

-- Expected: voice_enabled, voice_minutes_used, voice_minutes_quota, voice_minutes_reset_at, vapi_assistant_id, vapi_phone_number_id

-- Check table exists
SELECT * FROM pokkit_voice_calls LIMIT 1;

-- Expected: Returns empty set (no error)

-- Test trigger
UPDATE pokkit_users
SET plan = 'solo_voice'
WHERE id = (SELECT id FROM pokkit_users LIMIT 1);

SELECT voice_enabled, voice_minutes_quota
FROM pokkit_users
LIMIT 1;

-- Expected: voice_enabled = true, voice_minutes_quota = 100
```

---

## 🟡 NEXT: VAPI Account Setup

### Step 2: Sign Up for VAPI

1. **Go to:** https://vapi.ai
2. **Sign up** for a business account
3. **Get your API key** from the dashboard
4. **Create webhook secret** (any secure random string)

### Step 3: Configure VAPI Webhook

1. **In VAPI Dashboard:**
   - Go to Settings → Webhooks
   - Set Callback URL: `https://pokkit.ai/api/vapi/webhook`
   - Set Webhook Secret: (copy from your .env.local: `8kJ2mN9pL4qR7sT0vW3xY6zB1cD5eF8gH2iJ4kL7mN0pQ3rS6tU9vW2xY5zA8bC`)

2. **Update .env.local if needed:**
   - VAPI_API_KEY should be your actual VAPI API key
   - VAPI_WEBHOOK_SECRET is already set

### Step 4: Test VAPI Connection

Run this test script:

```bash
node scripts/test-vapi-connection.js
```

---

## 🟢 DEPLOYMENT: Push to Production

### Step 5: Update Vercel Environment Variables

Go to: https://vercel.com/tdaniel1925s-projects/your-project/settings/environment-variables

Add/Update these variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxtbzypheuiniuqynas.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Twilio
TWILIO_ACCOUNT_SID=AC***
TWILIO_AUTH_TOKEN=***
TWILIO_PHONE_NUMBER=+1***

# Stripe (NEW PRICES)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51T9s4Y0UcCrfpyRU...
STRIPE_SECRET_KEY=sk_test_51T9s4Y0UcCrfpyRU...
STRIPE_WEBHOOK_SECRET=whsec_PMthYQ67GaMfcVAE5CBO5ur6O2JgIyIr
STRIPE_SOLO_PRICE_ID=price_1TG3l30UcCrfpyRULCFgKPU5
STRIPE_FAMILY_PRICE_ID=price_1TG3l30UcCrfpyRUVlOw7WNK
STRIPE_SOLO_VOICE_PRICE_ID=price_1TG3l30UcCrfpyRUNq67MAQc
STRIPE_FAMILY_VOICE_PRICE_ID=price_1TG3l40UcCrfpyRUYjl1f01o
STRIPE_BUSINESS_PRICE_ID=price_1TG3l40UcCrfpyRUiRQZO6oG

# Anthropic
ANTHROPIC_API_KEY=sk-ant-***

# App
NEXT_PUBLIC_APP_URL=https://pokkit.ai

# Apex
APEX_WEBHOOK_URL=https://agentpulse.apexaffinity.com/api/zowee/events
APEX_WEBHOOK_SECRET=***

# Cron
CRON_SECRET=test-secret-123

# Browserbase
BROWSERBASE_API_KEY=bb_live_NPvKcMAyDgk8akiq92XhBuF6TYI
BROWSERBASE_PROJECT_ID=a7e9357f-3c2b-47df-ae77-3ae3163aca6e

# Alexa
ALEXA_CLIENT_ID=amzn1.application-oa2-client.***
ALEXA_CLIENT_SECRET=amzn1.oa2-cs.v1.***
NEXT_PUBLIC_ALEXA_CLIENT_ID=amzn1.application-oa2-client.***

# VAPI (GET FROM VAPI.AI DASHBOARD)
VAPI_API_KEY=YOUR_VAPI_API_KEY_HERE
VAPI_WEBHOOK_SECRET=8kJ2mN9pL4qR7sT0vW3xY6zB1cD5eF8gH2iJ4kL7mN0pQ3rS6tU9vW2xY5zA8bC
```

### Step 6: Deploy

```bash
git push origin master
```

Vercel will automatically deploy.

### Step 7: Verify Deployment

1. **Check build logs** in Vercel dashboard
2. **Test cron jobs:**
   - `/api/cron/poll-tasks` (runs every minute)
   - `/api/cron/reset-voice-minutes` (runs daily at midnight)

3. **Test endpoints:**
   ```bash
   # Twilio SMS webhook
   curl https://pokkit.ai/api/twilio/sms

   # Stripe webhook
   curl https://pokkit.ai/api/stripe/webhook

   # VAPI webhook (when VAPI is configured)
   curl https://pokkit.ai/api/vapi/webhook
   ```

---

## 🧪 TESTING: End-to-End Flow

### Test 1: SMS-Only Signup (Solo Plan)

1. Go to https://pokkit.ai/signup
2. Select "Solo" ($19/mo)
3. Enter test details:
   - Name: Test User
   - Phone: Your test number
   - Email: test@example.com
   - Password: TestPass123!
4. Complete signup
5. Verify:
   - ✅ Welcome SMS received
   - ✅ Stripe subscription created
   - ✅ User in database with plan='solo'
   - ✅ No voice features enabled

### Test 2: Voice-Enabled Signup (Solo + Voice)

1. Go to https://pokkit.ai/signup
2. Select "Solo + Voice" ($39/mo)
3. Enter test details
4. Complete signup
5. Verify:
   - ✅ Welcome SMS mentions calling
   - ✅ User in database with plan='solo_voice'
   - ✅ voice_enabled = true
   - ✅ voice_minutes_quota = 100
   - ✅ VAPI assistant provisioned (check logs)

### Test 3: Voice Call (When VAPI Configured)

1. Call the Pokkit number from registered phone
2. VAPI should answer with AI assistant
3. Try commands:
   - "Help"
   - "Track iPhone 15 prices"
   - "Search YouTube for cooking videos"
4. Verify:
   - ✅ Call logged in pokkit_voice_calls
   - ✅ Minutes deducted from quota
   - ✅ Actions executed (same as SMS)

### Test 4: SMS Processing

1. Text the Pokkit number: "Track PS5 prices under $450"
2. Verify:
   - ✅ Receives SMS response
   - ✅ Intent parsed correctly
   - ✅ Skill executed
   - ✅ Conversation logged

### Test 5: Dashboard

1. Login at https://pokkit.ai/account
2. Verify:
   - ✅ Shows correct plan and pricing
   - ✅ Voice usage section (if voice plan)
   - ✅ Active monitors displayed
   - ✅ Recent conversations shown

---

## 📊 Monitoring

### Key Metrics to Watch

1. **Signups:**
   - Track in Supabase: `SELECT COUNT(*) FROM pokkit_users`
   - Track in Stripe dashboard

2. **Voice Usage:**
   ```sql
   SELECT
     plan,
     COUNT(*) as users,
     AVG(voice_minutes_used) as avg_usage,
     SUM(voice_minutes_used) as total_usage
   FROM pokkit_users
   WHERE voice_enabled = true
   GROUP BY plan;
   ```

3. **Revenue:**
   - Check Stripe dashboard for MRR
   - Monitor overage charges

4. **Errors:**
   - Vercel logs for application errors
   - Supabase logs for database issues
   - VAPI dashboard for call failures

---

## 🚨 Troubleshooting

### Issue: Voice provisioning fails on signup
- Check VAPI API key is valid
- Verify webhook URL is accessible
- Check logs in Vercel for error details

### Issue: Cron jobs not running
- Verify CRON_SECRET in Vercel environment
- Check Vercel cron logs
- Ensure vercel.json is committed

### Issue: Stripe webhooks failing
- Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
- Check webhook logs in Stripe dashboard
- Test with Stripe CLI: `stripe trigger payment_intent.succeeded`

### Issue: Database migration errors
- Ensure you're running as service role (not anon key)
- Check for conflicting column names
- Try running statements individually

---

## 📝 Checklist

- [x] Create Stripe products (5 plans)
- [x] Update .env.local with price IDs
- [ ] Apply database migration 004
- [ ] Sign up for VAPI account
- [ ] Configure VAPI webhook
- [ ] Update Vercel environment variables
- [ ] Deploy to production
- [ ] Test SMS flow
- [ ] Test voice flow (when VAPI ready)
- [ ] Verify cron jobs running
- [ ] Monitor first 24 hours

---

## 🎉 Launch Ready!

Once all checklist items are complete:

1. Update DNS to point to Vercel (if needed)
2. Enable production mode in Stripe
3. Announce launch! 🚀

**Support:** If issues arise, check:
- Vercel logs: https://vercel.com/tdaniel1925s-projects
- Supabase logs: https://supabase.com/dashboard/project/xxxtbzypheuiniuqynas/logs
- Stripe dashboard: https://dashboard.stripe.com
