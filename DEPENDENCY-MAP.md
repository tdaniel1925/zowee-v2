# ZOWEE — Complete Dependency Map

**Last Updated**: 2026-03-28
**Purpose**: Reference this BEFORE making ANY changes to understand impact.

---

## 🗄️ Database Schema Dependencies

### `zowee_users` (Core table)
**Columns**:
- `id` (uuid, PK)
- `name` (text)
- `phone` (text, unique)
- `email` (text, nullable)
- `zowee_number` (text, unique)
- `plan` ('solo' | 'family')
- `status` ('trial' | 'active' | 'cancelled' | 'past_due')
- `trial_ends_at` (timestamptz)
- `stripe_customer_id` (text, unique)
- `stripe_subscription_id` (text, unique)
- `created_at` (timestamptz)

**Used By**:
- `/api/signup` (create new user)
- `/api/stripe/webhook` (update subscription status)
- `/api/twilio/sms` (receive SMS from users)
- `/account` (display user info)
- `/admin` (count users, calculate stats)

**External References**:
- Stripe Customer ID links to Stripe
- Stripe Subscription ID links to Stripe
- Phone number receives SMS via Twilio
- Zowee number sends SMS via Twilio

---

### `apex_webhook_log` (Audit table)
**Columns**:
- `id` (uuid, PK)
- `created_at` (timestamptz)
- `event_type` (text) - see ApexEventType below
- `user_id` (uuid, FK → zowee_users.id, nullable)
- `payload` (jsonb)
- `response_status` (integer)
- `response_body` (text)
- `error` (text)
- `attempts` (integer, default 1)
- `sent_at` (timestamptz)
- `succeeded` (boolean, default false)

**Used By**:
- `lib/apex/webhook.ts` (log all webhook attempts)
- `/admin` (future: view webhook logs)

**External References**:
- Logs all communication with Apex Affinity system

---

### `zowee_sms_log` (Audit table)
**Columns**:
- `id` (uuid, PK)
- `created_at` (timestamptz)
- `user_id` (uuid, FK → zowee_users.id, nullable)
- `direction` ('inbound' | 'outbound')
- `from_number` (text)
- `to_number` (text)
- `body` (text)
- `twilio_sid` (text, unique)
- `status` (text)

**Used By**:
- `/api/twilio/sms` (log all SMS)
- Future: user message history view

**External References**:
- Twilio message SID links to Twilio records

---

## 🔌 API Route Dependencies

### `/api/signup` (POST)
**Dependencies**:
- Database: `zowee_users` (INSERT)
- Database: `apex_webhook_log` (INSERT via webhook util)
- Stripe API: Create customer, create subscription with trial
- Twilio API: Send welcome SMS
- Apex Webhook: Send `customer.trial_start` event
- Env Vars: `STRIPE_SECRET_KEY`, `TWILIO_*`, `APEX_WEBHOOK_URL`, `APEX_WEBHOOK_SECRET`, `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`

**Data Flow**:
1. Receive: `{ name, phone, email?, plan }`
2. Create Stripe customer + subscription (14-day trial)
3. Assign Zowee phone number (format: +1-888-ZOW-XXXX)
4. Insert into `zowee_users`
5. Send welcome SMS via Twilio
6. Send webhook to Apex (non-blocking)
7. Return: `{ success, user, zoweeNumber }`

**Critical**:
- If Stripe fails → entire signup fails
- If database insert fails → entire signup fails
- If Twilio fails → log error but continue
- If Apex webhook fails → log error but continue

---

### `/api/stripe/checkout` (POST)
**Dependencies**:
- Stripe API: Create Checkout Session
- Env Vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_URL`

**Data Flow**:
1. Receive: `{ plan: 'solo' | 'family' }`
2. Create Stripe Checkout Session with trial
3. Return: `{ url: checkoutSessionUrl }`

**Note**: Currently unused - signup flow uses `/api/signup` directly

---

### `/api/stripe/portal` (POST)
**Dependencies**:
- Stripe API: Create Billing Portal Session
- Env Vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_URL`

**Data Flow**:
1. Receive: `{ customerId: string }`
2. Create Stripe portal session
3. Return: `{ url: portalUrl }`

**Used By**:
- `/account` page (manage subscription button)

---

### `/api/stripe/webhook` (POST)
**Dependencies**:
- Database: `zowee_users` (UPDATE)
- Database: `apex_webhook_log` (INSERT via webhook util)
- Stripe API: Webhook signature verification
- Apex Webhook: Send subscription lifecycle events
- Env Vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APEX_WEBHOOK_URL`, `APEX_WEBHOOK_SECRET`

**Handled Events**:
1. `invoice.paid` → update user status to 'active', send `customer.trial_convert` or `subscription.renewed` to Apex
2. `customer.subscription.updated` → update plan, send `subscription.plan_change` to Apex
3. `customer.subscription.deleted` → set status to 'cancelled', send `subscription.cancelled` to Apex

**Critical**:
- MUST verify webhook signature before processing
- Database updates must succeed
- Apex webhooks are non-blocking (failures logged)

---

### `/api/twilio/sms` (POST)
**Dependencies**:
- Database: `zowee_users` (SELECT)
- Database: `zowee_sms_log` (INSERT)
- Twilio API: Webhook signature verification, send SMS response
- Env Vars: `TWILIO_AUTH_TOKEN`, `TWILIO_ACCOUNT_SID`, `TWILIO_PHONE_NUMBER`

**Data Flow**:
1. Receive Twilio webhook: `{ From, To, Body, MessageSid }`
2. Verify Twilio signature
3. Log to `zowee_sms_log`
4. Lookup user by `From` phone number
5. Send auto-response via Twilio
6. Return TwiML response

**Critical**:
- MUST verify webhook signature
- Twin agents will eventually process these messages

---

## 🌐 External Service Dependencies

### Stripe
**Used For**: Payment processing, subscription management
**Integrated In**:
- `/api/signup` (create customer + subscription)
- `/api/stripe/checkout` (checkout sessions)
- `/api/stripe/portal` (billing portal)
- `/api/stripe/webhook` (subscription lifecycle)

**Env Vars**:
- `STRIPE_SECRET_KEY` (server-side)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client-side)
- `STRIPE_WEBHOOK_SECRET` (webhook verification)

**Data Stored**:
- `stripe_customer_id` in `zowee_users`
- `stripe_subscription_id` in `zowee_users`

---

### Twilio
**Used For**: SMS sending/receiving
**Integrated In**:
- `/api/signup` (send welcome SMS)
- `/api/twilio/sms` (receive SMS, send responses)

**Env Vars**:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` (Zowee's main number)

**Data Stored**:
- `phone` in `zowee_users` (user's phone)
- `zowee_number` in `zowee_users` (assigned Zowee number)
- `twilio_sid` in `zowee_sms_log`

---

### Apex Affinity Group (MLM System)
**Used For**: Commission tracking, rep management
**Integrated In**:
- `/api/signup` (send `customer.trial_start`)
- `/api/stripe/webhook` (send subscription lifecycle events)
- `lib/apex/webhook.ts` (central webhook utility)

**Env Vars**:
- `APEX_WEBHOOK_URL` (Apex endpoint)
- `APEX_WEBHOOK_SECRET` (HMAC signature)

**Event Types**:
- `customer.signup` (not currently used)
- `customer.trial_start` (sent on signup)
- `customer.trial_convert` (sent on first payment)
- `subscription.active` (not currently used)
- `subscription.cancelled` (sent on cancellation)
- `subscription.plan_change` (sent on plan upgrade/downgrade)
- `subscription.renewed` (sent on renewal)

**Data Stored**:
- All attempts logged in `apex_webhook_log`

---

### Supabase
**Used For**: PostgreSQL database, RLS
**Integrated In**: Every API route, every page

**Env Vars**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-side)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side, bypasses RLS)

**Critical**:
- Service role key ONLY used in API routes (server-side)
- Anon key used in frontend (client-side)
- RLS enabled on all tables

---

### Resend
**Used For**: Email sending (future)
**Status**: Not yet implemented

**Env Vars**:
- `RESEND_API_KEY` (not yet used)

---

## 📄 Frontend Page Dependencies

### `/` (Landing Page)
**Dependencies**: None
**Data Sources**: Static content only
**External Links**: `/signup`

---

### `/signup` (Signup Page)
**Dependencies**:
- `/api/signup` (POST)
- Client-side Supabase (anon key)

**Data Flow**:
1. User enters: name, phone, email, plan
2. POST to `/api/signup`
3. Redirect to `/signup/success?zowee={number}`

---

### `/signup/success` (Success Page)
**Dependencies**: None
**Data Sources**: URL params (`?zowee=`)
**Display**: Zowee number assigned to user

---

### `/account` (User Dashboard)
**Dependencies**:
- Client-side Supabase (fetch `zowee_users` by phone)
- `/api/stripe/portal` (manage subscription button)

**Data Displayed**:
- User name, Zowee number
- Plan (Solo/Family)
- Status (Trial/Active/Cancelled)
- Trial end date
- Manage subscription button → Stripe portal

**Auth**: None (relies on phone number input)

---

### `/admin` (Company Admin Dashboard)
**Dependencies**:
- Client-side Supabase (future: fetch stats from `zowee_users`)

**Data Displayed**:
- Total signups
- Active users
- Trial users
- Monthly recurring revenue (MRR)
- Churn rate
- Average lifetime value (LTV)

**Auth**: None (should be added)
**Current State**: Placeholder stats, not wired to real data

---

## 🔄 Critical Data Flows

### Flow 1: User Signup → Apex
```
User → /signup → /api/signup → Stripe → DB → Twilio → Apex
                                  ↓
                          Creates customer
                          Creates subscription
                                  ↓
                          Inserts zowee_users
                                  ↓
                          Sends welcome SMS
                                  ↓
                          Sends webhook to Apex
                                  ↓
                          Logs to apex_webhook_log
```

### Flow 2: Subscription Lifecycle → Apex
```
Stripe → /api/stripe/webhook → DB → Apex
           ↓
   Verify signature
           ↓
   Update zowee_users
           ↓
   Send event to Apex
           ↓
   Log to apex_webhook_log
```

### Flow 3: Inbound SMS → Future Twin Processing
```
User → Twilio → /api/twilio/sms → DB
                      ↓
              Verify signature
                      ↓
              Log to zowee_sms_log
                      ↓
              Lookup user
                      ↓
              Send auto-response
                      ↓
              [Future: Twin agent processes]
```

---

## ⚠️ Breaking Change Risks

### HIGH RISK (Will break core functionality)
1. **Changing `zowee_users` column names** → Breaks all API routes
2. **Removing Stripe webhook events** → Subscription status won't update
3. **Changing Apex webhook payload structure** → Apex integration breaks
4. **Removing env vars** → APIs will fail
5. **Changing phone number format** → Twilio integration breaks

### MEDIUM RISK (Will break some features)
1. **Changing URL structure** (`/signup`, `/account`, `/admin`) → Links break
2. **Changing API route paths** → Frontend calls fail
3. **Modifying database schema without migration** → Data loss, query failures

### LOW RISK (Safe changes)
1. **Adding new columns to tables** → Safe if nullable or has defaults
2. **Adding new API routes** → Safe if no conflicts
3. **Adding new env vars** → Safe if optional
4. **Styling/UI changes** → Safe (no backend impact)

---

## 🔐 Security Dependencies

### Webhook Signature Verification
**Required For**:
- Stripe webhooks (`/api/stripe/webhook`)
- Twilio webhooks (`/api/twilio/sms`)

**Never Skip**: Skipping verification allows attackers to forge webhooks

### Environment Variables (Secrets)
**Never Commit**:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_ACCOUNT_SID`
- `APEX_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

**Always Use**: `process.env.VAR_NAME`

### Supabase RLS
**Status**: Enabled on all tables
**Critical**: Service role key bypasses RLS → only use server-side

---

## 📦 Package Dependencies

### Core Framework
- `next@14.2.35` (App Router)
- `react@18.2.0`
- `react-dom@18.2.0`

### UI/Styling
- `tailwindcss@3.4.1`
- `lucide-react` (icons)

### Database
- `@supabase/supabase-js@2.39.3`

### Payment
- `stripe@14.14.0`

### SMS
- `twilio@4.20.0`

### Development
- `typescript@5.3.3`
- `@types/node`, `@types/react`, `@types/react-dom`

**Critical**: Breaking changes in Next.js 14 → 15 may affect App Router

---

## 🎯 Feature Request Checklist

Before implementing ANY feature, check:

- [ ] Which database tables does this touch?
- [ ] Which API routes does this affect?
- [ ] Which external services does this integrate with?
- [ ] Do I need new env vars?
- [ ] Will this break existing data flows?
- [ ] Do I need a database migration?
- [ ] Does this affect webhook processing?
- [ ] Does this change authentication/authorization?
- [ ] Will this break the Apex integration?
- [ ] Do I need to update this dependency map?

**If unsure about ANY checkbox → ASK FIRST before implementing.**
