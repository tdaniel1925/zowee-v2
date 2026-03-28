# Pokkit Deployment Guide

## Step 1: Deploy to Vercel

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts to link/create project
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### Step 2: Configure Environment Variables in Vercel

Add all variables from `.env.local` to Vercel:

**Supabase:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

**Twilio:**
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

**Stripe:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_SOLO_PRICE_ID
STRIPE_FAMILY_PRICE_ID
```

**Anthropic:**
```
ANTHROPIC_API_KEY
```

**Resend:**
```
RESEND_API_KEY
RESEND_FROM_EMAIL
```

**App:**
```
NEXT_PUBLIC_APP_URL (set to your Vercel domain)
APEX_WEBHOOK_SECRET
CRON_SECRET
```

**Testing:**
```
TEST_PHONE_NUMBER
TEST_EMAIL
```

### Step 3: Get Your Vercel URL

After deployment, note your URL:
- Production: `https://your-project.vercel.app`
- Or custom domain if configured

Update `NEXT_PUBLIC_APP_URL` environment variable with this URL.

---

## Step 4: Configure Twilio Webhook

### A. Log into Twilio Console

Go to: https://console.twilio.com

### B. Configure Phone Number Webhook

1. Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your Pokkit phone number: `+16517287626`
3. Scroll to **Messaging**
4. Under **A MESSAGE COMES IN**:
   - Set to: **Webhook**
   - URL: `https://your-project.vercel.app/api/twilio/sms`
   - HTTP Method: **POST**
5. Click **Save**

### C. Test Twilio Webhook

Send a text message to your Twilio number:
```
Text: "Hello Pokkit"
```

You should receive a Claude-powered response!

---

## Step 5: Configure Stripe Webhook

### A. Log into Stripe Dashboard

Go to: https://dashboard.stripe.com

### B. Add Webhook Endpoint

1. Navigate to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Configure:
   - **Endpoint URL:** `https://your-project.vercel.app/api/stripe/webhook`
   - **Events to send:**
     - `checkout.session.completed`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`
4. Click **Add endpoint**

### C. Get Webhook Signing Secret

1. Click on your newly created webhook
2. Copy the **Signing secret** (starts with `whsec_`)
3. Update `STRIPE_WEBHOOK_SECRET` in Vercel environment variables
4. Redeploy to apply the change

---

## Step 6: Test the Complete Flow

### Test 1: SMS Processing

Text your Twilio number:
```
"Monitor Nike Air Max, alert me under $89"
```

Expected:
- Response confirming monitor created
- Database entry in `pokkit_monitors` table

### Test 2: Intent Detection

Try different intents:

**Price Monitor:**
```
"Watch flights from Houston to Dallas under $150"
```

**Reminder:**
```
"Remind me tomorrow at 9am to call mom"
```

**Question:**
```
"What's the weather like in Dallas?"
```

**Help:**
```
"Help"
```

### Test 3: Stripe Checkout

1. Go to: `https://your-project.vercel.app/signup`
2. Fill out the form
3. Complete test checkout with card: `4242 4242 4242 4242`
4. Verify user created in Supabase with `plan_status: 'trialing'`

---

## Monitoring & Debugging

### Check Logs

**Vercel Logs:**
```bash
vercel logs --follow
```

Or view in dashboard:
https://vercel.com/your-username/your-project/logs

**Look for:**
- `📱 SMS from +1234567890: <message>`
- `🎯 Intent: monitor_price (95%)`
- `✅ Sent reply to +1234567890: <response>`

### Check Database

Log into Supabase:
https://supabase.com/dashboard

Check tables:
- `pokkit_users` — New users created
- `pokkit_conversations` — SMS history
- `pokkit_monitors` — Active monitors
- `pokkit_reminders` — Scheduled reminders

### Common Issues

**SMS not received:**
- Check Twilio webhook configuration
- Verify `NEXT_PUBLIC_APP_URL` is correct
- Check Vercel logs for errors
- Verify Twilio signature validation

**Stripe webhook failing:**
- Verify webhook secret is correct
- Check endpoint URL is exact
- Review selected events
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

**Claude not responding:**
- Verify `ANTHROPIC_API_KEY` is set
- Check API quota/rate limits
- Review Vercel function logs

---

## Next Steps

Once deployed and tested:

1. **Set up custom domain** (optional)
   - Configure in Vercel dashboard
   - Update `NEXT_PUBLIC_APP_URL`

2. **Build landing page** (GATE 2)
   - Implement hero section
   - Add SMS demo animation
   - Create pricing cards

3. **Add advanced features:**
   - Browserbase integration for web scraping
   - Scheduled cron jobs for monitors
   - Email notifications via Resend

4. **Launch to beta users:**
   - Give Apex reps their referral links
   - Monitor usage and feedback
   - Iterate on features

---

**Deployment Checklist:**

- [ ] Deployed to Vercel
- [ ] All environment variables configured
- [ ] Twilio webhook configured
- [ ] Stripe webhook configured
- [ ] SMS test successful
- [ ] Database tables verified
- [ ] Logs reviewed
- [ ] Ready for beta testing
