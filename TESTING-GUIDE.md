# Testing Guide for Pokkit

## Running Tests

### Unit Tests (Vitest)
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run all tests (unit + E2E)
npm run test:all
```

---

## Stripe Test Credit Cards

Use these test credit cards in development/staging environments:

### ✅ Successful Payments

**Visa (Basic)**
- Number: `4242 4242 4242 4242`
- CVC: Any 3 digits
- Expiry: Any future date

**Visa (Debit)**
- Number: `4000 0566 5566 5556`
- CVC: Any 3 digits
- Expiry: Any future date

**Mastercard**
- Number: `5555 5555 5555 4444`
- CVC: Any 3 digits
- Expiry: Any future date

**American Express**
- Number: `3782 822463 10005`
- CVC: Any 4 digits
- Expiry: Any future date

**Discover**
- Number: `6011 1111 1111 1117`
- CVC: Any 3 digits
- Expiry: Any future date

### ❌ Card Failures

**Card Declined**
- Number: `4000 0000 0000 0002`
- Will decline with generic decline code

**Insufficient Funds**
- Number: `4000 0000 0000 9995`
- Will decline with insufficient_funds code

**Expired Card**
- Number: `4000 0000 0000 0069`
- Will decline with expired_card code

**Incorrect CVC**
- Number: `4000 0000 0000 0127`
- Will decline with incorrect_cvc code

**Processing Error**
- Number: `4000 0000 0000 0119`
- Will decline with processing_error code

### 🔐 3D Secure / SCA Testing

**Requires Authentication**
- Number: `4000 0025 0000 3155`
- Will trigger 3D Secure authentication

**Authentication Required (Not Supported)**
- Number: `4000 0082 6000 0000`
- Will fail if 3D Secure not implemented

---

## Test Data Guidelines

### Phone Numbers
Use these test formats:
- US: `+1555XXXXXXX` (555 is reserved for testing)
- Example: `+15551234567`

### Email Addresses
- Use `+` aliasing: `your-email+test1@example.com`
- Use test domains: `test@example.com`

### User Names
- Use clearly fake names: "Test User", "John Doe"
- Avoid real-looking names that might confuse analytics

---

## Testing Workflows

### Signup Flow Testing

**Test Solo Plan ($19/mo)**
```
1. Go to /signup
2. Select "Solo" plan
3. Enter:
   - Name: Test User Solo
   - Phone: +15551234001
   - Password: TestPass123!
   - Email: test+solo@example.com
4. Credit Card: 4242 4242 4242 4242
5. CVC: 123
6. Expiry: 12/25
7. Submit
8. Should create user with 14-day trial
```

**Test Voice Plan ($39/mo)**
```
1. Go to /signup
2. Select "Solo + Voice" plan
3. Enter test details
4. Credit Card: 4242 4242 4242 4242
5. Should provision VAPI voice agent
6. Should receive SMS with voice instructions
```

### Payment Method Testing

**Test Adding Payment Method**
```
1. Login to /account
2. Go to /account/payment-methods
3. Click "Add Payment Method"
4. Enter card: 5555 5555 5555 4444 (Mastercard)
5. Should save successfully
```

**Test Failed Payment**
```
1. Go to /signup
2. Enter card: 4000 0000 0000 0002 (decline card)
3. Should show error message
4. Should NOT create user
```

### Voice Testing

**Test Voice Provisioning**
```
1. Sign up for voice-enabled plan
2. Check database: voice_enabled = true
3. Check database: voice_minutes_quota = 100 (solo) or 200 (family/business)
4. Call the Pokkit number
5. Should connect to VAPI agent
6. Try command: "Help"
7. Should respond with capabilities
```

**Test Voice Async Tasks**
```
1. Call Pokkit number
2. Say: "Compare prices for PS5"
3. Agent should offer to text results
4. Say: "Yes, text me"
5. Call should end gracefully
6. Should receive SMS with results
```

### Alexa Integration Testing

**Test Alexa Linking**
```
1. Login to /account
2. Go to /account/integrations
3. Click "Link Amazon Alexa"
4. Should redirect to Amazon OAuth
5. Authorize
6. Should return with "Connected" status
```

**Test Smart Home Control**
```
1. Link Alexa account
2. Text Pokkit: "Turn off living room lights"
3. Should execute Alexa command
4. Should receive confirmation SMS
```

**Test Without Alexa**
```
1. DON'T link Alexa
2. Text Pokkit: "Set thermostat to 72"
3. Should receive error with link to /account/integrations
```

---

## Database Testing

### Test Voice Quota Trigger
```sql
-- Insert test user with solo_voice plan
INSERT INTO pokkit_users (name, phone, plan)
VALUES ('Test Voice', '+15559999999', 'solo_voice');

-- Check that trigger set voice fields
SELECT voice_enabled, voice_minutes_quota
FROM pokkit_users
WHERE phone = '+15559999999';

-- Should return: voice_enabled=true, voice_minutes_quota=100
```

### Test Voice Reset Cron
```bash
# Manually trigger voice reset
curl -X GET http://localhost:3000/api/cron/reset-voice-minutes \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Should reset all users whose reset_at date has passed
```

---

## Webhook Testing

### Test Stripe Webhooks
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to localhost
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
```

### Test Twilio Webhooks
```bash
# Use ngrok to expose localhost
ngrok http 3000

# Update Twilio webhook URL to ngrok URL
# Send test SMS to Pokkit number
```

### Test VAPI Webhooks
```bash
# VAPI webhooks are auto-configured per assistant
# Test by making actual voice call to provisioned number
# Or use VAPI dashboard to send test webhook
```

---

## Monitoring Test Results

### Check Logs
- Vercel Logs: https://vercel.com/[project]/logs
- Supabase Logs: https://supabase.com/dashboard/project/[id]/logs
- Stripe Logs: https://dashboard.stripe.com/test/logs
- VAPI Logs: https://vapi.ai/logs

### Check Database
```sql
-- Check recent signups
SELECT id, name, phone, plan, created_at
FROM pokkit_users
ORDER BY created_at DESC
LIMIT 10;

-- Check voice calls
SELECT user_id, duration_seconds, minutes_used, created_at
FROM pokkit_voice_calls
ORDER BY created_at DESC
LIMIT 10;

-- Check conversations
SELECT user_id, message_in, message_out, intent, created_at
FROM pokkit_conversations
ORDER BY created_at DESC
LIMIT 10;
```

---

## Cleanup After Testing

### Delete Test Users
```sql
-- Delete test users (be careful!)
DELETE FROM pokkit_users
WHERE phone LIKE '+1555%' OR name LIKE 'Test%';
```

### Cancel Test Subscriptions
```bash
# Use Stripe dashboard or CLI
stripe subscriptions list --status=all
stripe subscriptions cancel <subscription_id>
```

---

## CI/CD Testing

Tests are configured to run automatically on:
- Pull requests
- Pushes to main branch
- Pre-deployment

### GitHub Actions (if configured)
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
      - run: npx playwright install
      - run: npm run test:e2e
```

---

## Important Notes

⚠️ **NEVER use real credit cards in test mode**
⚠️ **ALWAYS use test environment variables**
⚠️ **Clean up test data regularly**
⚠️ **Monitor test costs** (VAPI, Anthropic API calls)
⚠️ **Use separate Stripe test mode account**

---

## Resources

- Stripe Testing: https://stripe.com/docs/testing
- Playwright Docs: https://playwright.dev/
- Vitest Docs: https://vitest.dev/
- VAPI Testing: https://docs.vapi.ai/testing
- Twilio Testing: https://www.twilio.com/docs/iam/test-credentials
