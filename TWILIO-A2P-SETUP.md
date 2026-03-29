# Twilio A2P 10DLC Setup Guide

## Overview

Your Pokkit app now uses **individual phone numbers** for each user, automatically linked to your existing A2P 10DLC campaign through Twilio Messaging Services.

---

## How It Works

### A2P Campaign Inheritance

1. **You have** an approved A2P 10DLC campaign with Twilio
2. **Campaign is linked** to a Messaging Service (configured in Twilio Console)
3. **When we provision** a phone number for a new user:
   - Purchase the number via Twilio API
   - Add number to your Messaging Service
   - **Number automatically inherits A2P registration** ✅
4. **All SMS** sent from that number uses the Messaging Service (A2P compliant)

### Architecture

```
User Signs Up
    ↓
Provision Twilio Phone Number
    ↓
Add to Messaging Service (linked to A2P campaign)
    ↓
Save to Database
    ↓
User's number is A2P compliant ✅
```

---

## Setup Steps

### Step 1: Get Your Messaging Service SID

1. Go to [Twilio Console > Messaging > Services](https://console.twilio.com/us1/develop/sms/services)
2. Find the Messaging Service **linked to your A2P campaign**
3. Copy the Service SID (starts with `MG...`)

### Step 2: Add to Environment Variables

Update `.env.local`:

```bash
TWILIO_MESSAGING_SERVICE_SID=MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 3: Run Database Migration

Execute the migration to add Twilio columns:

```sql
-- In Supabase SQL Editor
-- Run: supabase/migrations/006_twilio_individual_numbers.sql

ALTER TABLE pokkit_users
ADD COLUMN IF NOT EXISTS twilio_phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS twilio_phone_number_sid VARCHAR(255),
ADD COLUMN IF NOT EXISTS twilio_messaging_service_sid VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_pokkit_users_twilio_phone
ON pokkit_users(twilio_phone_number);
```

### Step 4: Verify A2P Configuration

In Twilio Console:

1. **Messaging > Services** → Select your service
2. **Compliance** tab → Verify A2P campaign is linked
3. **Sender Pool** tab → Your provisioned numbers will appear here automatically

---

## How Phone Provisioning Works

### File: `lib/twilio/provisioning.ts`

**Key Functions:**

1. **`searchAvailableNumbers(areaCode?)`**
   - Searches for available US phone numbers
   - Filters for SMS + Voice + MMS capabilities

2. **`purchasePhoneNumber(phoneNumber)`**
   - Purchases the number
   - Configures webhooks (SMS/Voice)
   - **Adds to Messaging Service** (A2P registration!)
   - Returns SID and Messaging Service SID

3. **`provisionPhoneNumber(userId, areaCode?)`**
   - Complete provisioning workflow
   - Search → Purchase → Configure → Save to DB
   - Handles errors with cleanup

4. **`sendSMS(from, to, body)`**
   - Sends SMS using Messaging Service
   - Ensures A2P compliance on all messages

---

## Signup Flow (Updated)

### File: `app/api/signup/route.ts`

```typescript
// 1. Create user account (Supabase + Stripe)
const newUser = await createUser(...)

// 2. Provision Twilio phone number
const phoneResult = await provisionPhoneNumber(newUser.id)
// ✅ Number automatically added to A2P campaign

// 3. Send welcome SMS from user's NEW Pokkit number
await sendSMS(
  phoneResult.phoneNumber,  // From: User's Pokkit number
  userPersonalPhone,         // To: User's personal phone
  welcomeMessage
)
```

---

## Database Schema

### New Columns in `pokkit_users`:

| Column | Type | Description |
|--------|------|-------------|
| `twilio_phone_number` | VARCHAR(20) | User's Pokkit phone number (e.g., +15551234567) |
| `twilio_phone_number_sid` | VARCHAR(255) | Twilio Phone Number SID (e.g., PNxxx...) |
| `twilio_messaging_service_sid` | VARCHAR(255) | Links to A2P campaign (e.g., MGxxx...) |

**Index:** `idx_pokkit_users_twilio_phone` for fast lookups

---

## SMS Webhook

### File: `app/api/twilio/sms/route.ts`

**How it identifies users:**

```typescript
// Incoming SMS webhook from Twilio
const { From, To, Body } = request

// Find user by their Pokkit phone number (the number that RECEIVED the message)
const user = await supabase
  .from('pokkit_users')
  .select('*')
  .eq('twilio_phone_number', To)  // User's Pokkit number
  .single()

// Process message with Claude API
const result = await processMessage(Body, user)

// Reply FROM user's Pokkit number
await sendSMS(
  To,    // From: User's Pokkit number
  From,  // To: User's personal phone
  result.message
)
```

---

## A2P Compliance Checklist

✅ **Brand Registered** - Your business registered with TCR
✅ **Campaign Approved** - Use case approved (customer care, mixed, etc.)
✅ **Messaging Service Created** - Linked to campaign
✅ **Environment Variable Set** - `TWILIO_MESSAGING_SERVICE_SID`
✅ **Numbers Auto-Added** - All provisioned numbers added to service
✅ **SMS via Service** - All messages sent through Messaging Service

---

## Cost Breakdown

### Per User (Monthly):

| Item | Cost |
|------|------|
| Phone Number | $1.00 |
| SMS Sent (estimate 100/month) | $0.79 |
| SMS Received (estimate 100/month) | $0.79 |
| **Total per user** | **~$2.58/month** |

### A2P Fees (One-Time/Annual):

| Item | Cost | Frequency |
|------|------|-----------|
| Brand Registration | $4 | One-time |
| Campaign Vetting | $15 | One-time |
| Brand Vetting (optional) | $40 | One-time |
| Numbers added to service | $0 | Free |

### Your Pricing vs. Costs:

| Plan | Price | Cost | Profit |
|------|-------|------|--------|
| Solo | $19 | $2.58 | $16.42 (86%) |
| Solo + Voice | $39 | $2.58 + VAPI | ~$34 (87%) |
| Family | $34 | $10.32 (4 users) | $23.68 (70%) |

---

## Troubleshooting

### Issue: "TWILIO_MESSAGING_SERVICE_SID is required"

**Solution:** Add Messaging Service SID to `.env.local`

### Issue: "Failed to add number to Messaging Service"

**Possible causes:**
- Messaging Service doesn't exist
- Service not linked to A2P campaign
- Wrong Service SID

**Solution:** Verify Service SID in Twilio Console

### Issue: "Phone provisioning failed"

**Check:**
1. Twilio account has credit
2. No available numbers in area code (try without area code)
3. Webhook URLs are correct
4. Database migration completed

### Issue: "SMS not sending"

**Check:**
1. Number added to Messaging Service (check Twilio Console)
2. A2P campaign approved
3. Messaging Service has A2P campaign linked
4. Environment variable `TWILIO_MESSAGING_SERVICE_SID` set correctly

---

## Testing

### Test Phone Provisioning:

```bash
# In your test suite or via API call
POST /api/signup
{
  "name": "Test User",
  "phone": "5551234567",
  "email": "test@example.com",
  "password": "test123",
  "plan": "solo"
}

# Check logs for:
# [Twilio] Purchasing number: +15551234567
# [Twilio] Number added to Messaging Service: MGxxx...
# [Twilio] Number is now A2P compliant via campaign
```

### Verify in Twilio Console:

1. **Phone Numbers > Manage > Active Numbers**
   - See newly provisioned number
2. **Messaging > Services > [Your Service] > Sender Pool**
   - Number appears in pool
3. **Try sending SMS:**
   - Text the provisioned number
   - Check webhook receives message
   - Verify reply comes from Pokkit number

---

## Next Steps

1. ✅ **Get Messaging Service SID** from Twilio Console
2. ✅ **Add to `.env.local`**
3. ✅ **Run database migration**
4. ✅ **Test signup flow** with new user
5. ✅ **Verify number appears** in Messaging Service
6. ✅ **Send test SMS** to confirm A2P compliance

---

## Migration from Telnyx

If you were previously using Telnyx:

- ✅ Code now uses Twilio by default
- ✅ Signup flow updated
- ✅ Database schema supports both (for transition)
- ⚠️ Keep Telnyx code for future migration option

**To fully remove Telnyx:**
1. Ensure all users have Twilio numbers
2. Remove `lib/telnyx/` directory
3. Remove `TELNYX_API_KEY` from `.env.local`

---

**Your Pokkit app is now A2P compliant with individual phone numbers!** 🎉
