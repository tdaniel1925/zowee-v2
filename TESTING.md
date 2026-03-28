# Zowee Testing Guide

## SMS Intelligence Testing

Test the complete intent detection and routing system.

---

## Test Cases

### 1. Price Monitoring

**Test: Basic Price Monitor**
```
Text: "Monitor Nike Air Max, alert me under $89"
```
Expected:
- Intent detected: `monitor_price`
- Database: New row in `zowee_monitors` table
- Response: "✓ Watching Nike Air Max! I'll text you the moment it drops below $89."

**Test: Price Monitor Without Target**
```
Text: "Watch iPhone 15 Pro prices"
```
Expected:
- Intent detected: `monitor_price`
- Response asks for target price

---

### 2. Flight Monitoring

**Test: Flight Price Monitor**
```
Text: "Watch flights from Houston to Dallas under $150"
```
Expected:
- Intent detected: `monitor_flight`
- Database: New row in `zowee_monitors` with type='flight'
- Response confirms monitoring setup

---

### 3. Reminders

**Test: Set Reminder**
```
Text: "Remind me tomorrow at 9am to call mom"
```
Expected:
- Intent detected: `reminder`
- Database: New row in `zowee_reminders`
- Response confirms reminder set with time

**Test: Reminder Without Time**
```
Text: "Remind me to buy groceries"
```
Expected:
- Response asks when to remind

---

### 4. Flight Booking

**Test: Flight Search**
```
Text: "Find me a flight to Dallas under $150 this weekend"
```
Expected:
- Intent detected: `booking_flight`
- Database: New row in `zowee_actions` with type='flight_search'
- Response acknowledges (feature coming soon message)

---

### 5. Restaurant Booking

**Test: Restaurant Reservation**
```
Text: "Book Perry's Saturday 7pm for 2"
```
Expected:
- Intent detected: `booking_restaurant`
- Response acknowledges request

**Test: Restaurant Without Details**
```
Text: "Book me a table at Pappadeaux"
```
Expected:
- Response asks for date/time

---

### 6. Questions & Research

**Test: General Question**
```
Text: "What's the weather in Austin?"
```
Expected:
- Intent detected: `question` or `research`
- Response from Claude with helpful answer

**Test: Open-Ended Query**
```
Text: "Tell me about the best restaurants in Houston"
```
Expected:
- Intent detected: `research` or `question`
- Claude-powered detailed response

---

### 7. Help Command

**Test: Help Request**
```
Text: "Help"
```
Expected:
- Intent detected: `help`
- Response lists all capabilities

---

### 8. Cancel Flow

**Test: Cancel Mention**
```
Text: "How do I cancel?"
```
Expected:
- Intent detected: `cancel`
- Response explains cancellation process

---

## Database Verification

After running tests, verify database entries:

### Check Conversations
```sql
SELECT * FROM zowee_conversations
ORDER BY created_at DESC
LIMIT 10;
```
Should show:
- All test messages logged
- Intent field populated correctly
- Responses saved

### Check Monitors
```sql
SELECT * FROM zowee_monitors
WHERE status = 'active'
ORDER BY created_at DESC;
```
Should show:
- Price monitors with product names
- Flight monitors with origin/destination
- Correct thresholds set

### Check Reminders
```sql
SELECT * FROM zowee_reminders
WHERE status = 'pending'
ORDER BY remind_at ASC;
```
Should show:
- Reminders with correct times
- Titles matching user requests

### Check Actions
```sql
SELECT * FROM zowee_actions
ORDER BY created_at DESC;
```
Should show:
- Booking attempts logged
- Task descriptions saved

---

## Intent Accuracy Testing

Test edge cases to verify intent detection:

**Ambiguous Messages:**
```
Text: "Dallas"
```
Expected: Asks for clarification

**Multi-Intent:**
```
Text: "Book a flight to Miami and set a reminder for tomorrow"
```
Expected: Handles first intent, possibly prompts for second

**Typos:**
```
Text: "Munitor nike shoz under $90"
```
Expected: Still detects `monitor_price` intent

---

## Conversation Flow Testing

Test multi-turn conversations:

**Flow 1: Progressive Monitor Setup**
```
User: "Monitor something for me"
Zowee: "What would you like me to monitor?"
User: "Nike shoes"
Zowee: "What price should I alert you at?"
User: "$75"
Zowee: "✓ Watching Nike shoes! I'll text when it drops below $75"
```

**Flow 2: Incomplete Booking**
```
User: "Book a restaurant"
Zowee: "Which restaurant?"
User: "Perry's"
Zowee: "When would you like to book?"
User: "Saturday at 7pm"
Zowee: "Got it, will confirm..."
```

---

## Performance Testing

### Response Time
- SMS should respond within 5-10 seconds
- Intent detection adds ~1-2 seconds
- Total: Under 10 seconds ideal

### Concurrent Messages
Send multiple texts rapidly:
```
Text 1: "Monitor product A"
Text 2: "Monitor product B"
Text 3: "Monitor product C"
```
All should process correctly without conflicts.

---

## Error Handling Testing

**Test: Invalid Phone Number**
- Send from unregistered number
- Should create new user automatically

**Test: Malformed Input**
```
Text: "!@#$%^&*()"
```
Expected: Graceful fallback response

**Test: Very Long Message**
```
Text: <1000+ character message>
```
Expected: Processes without error

**Test: Empty Message**
```
Text: " "
```
Expected: Handles gracefully

---

## Stripe Integration Testing

### Test: Checkout Flow
1. Navigate to signup page
2. Fill form with test data
3. Use test card: `4242 4242 4242 4242`
4. Verify:
   - User created in database
   - `plan_status` = 'trialing'
   - `trial_ends_at` set to 14 days from now
   - `stripe_customer_id` populated

### Test: Webhook Events

**Simulate invoice.paid:**
Use Stripe CLI:
```bash
stripe trigger invoice.payment_succeeded
```
Verify: User `plan_status` updates to 'active'

**Simulate payment_failed:**
```bash
stripe trigger invoice.payment_failed
```
Verify: User `plan_status` updates to 'past_due'

---

## Monitoring Test Results

### Vercel Logs
Watch real-time logs:
```bash
vercel logs --follow
```

Look for:
```
📱 SMS from +12345: "Monitor Nike shoes under $89"
🎯 Intent: monitor_price (98%)
✅ Sent reply: "✓ Watching Nike shoes! ..."
```

### Supabase Logs
Check database queries in Supabase dashboard logs.

---

## Regression Testing Checklist

Before each deployment, verify:

- [ ] SMS webhook receives messages
- [ ] Intent detection works for all types
- [ ] Monitors are created correctly
- [ ] Reminders are saved with timestamps
- [ ] Conversations are logged
- [ ] User creation works
- [ ] Stripe checkout creates users
- [ ] Stripe webhooks update status
- [ ] Claude API responds
- [ ] Twilio sends replies
- [ ] Database RLS policies work
- [ ] Error handling is graceful

---

## Load Testing (Optional)

Use tools like Artillery or k6:

```yaml
# artillery.yml
config:
  target: "https://your-app.vercel.app"
  phases:
    - duration: 60
      arrivalRate: 5

scenarios:
  - name: "SMS Processing"
    engine: "http"
    flow:
      - post:
          url: "/api/twilio/sms"
          json:
            From: "+12345678901"
            Body: "Monitor test product under $50"
```

Run:
```bash
artillery run artillery.yml
```

---

## Success Criteria

**GATE 1 Complete when:**
- ✓ All test cases pass
- ✓ Database entries verified
- ✓ Response times acceptable
- ✓ Error handling works
- ✓ Stripe integration functional
- ✓ Ready for beta users

**Next: GATE 2 — Landing Page**
