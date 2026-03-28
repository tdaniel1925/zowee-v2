# VAPI Voice Agent Integration Specification

## Overview
Integrate VAPI (Voice AI Platform Integration) to enable AI voice calls on Pokkit phone numbers for users on voice-enabled plans.

## Pricing Tiers with Voice

| Plan | Price | Voice Minutes | Users |
|------|-------|---------------|-------|
| Solo | $19/mo | None | 1 |
| Family | $34/mo | None | Up to 5 |
| **Solo + Voice** | **$39/mo** | **100 min/mo** | **1** |
| **Family + Voice** | **$59/mo** | **200 min/mo** | **Up to 5** |
| **Business** | **$97/mo** | **200 min/mo** | **Unlimited** |

**Overage**: $0.50/minute

## Technical Architecture

### 1. VAPI Integration Flow

```
User calls Pokkit number
    ↓
Twilio receives call → Webhook to Pokkit
    ↓
Pokkit checks user plan & minutes
    ↓
If voice enabled → Forward to VAPI
    ↓
VAPI AI Agent answers
    ↓
Conversation processed by Claude
    ↓
Actions executed (same as SMS skills)
    ↓
Usage tracked → Deduct minutes
    ↓
Call ends → Log to database
```

### 2. Database Schema Updates

```sql
-- Add voice-related columns to pokkit_users table
ALTER TABLE pokkit_users ADD COLUMN voice_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE pokkit_users ADD COLUMN voice_minutes_used INTEGER DEFAULT 0;
ALTER TABLE pokkit_users ADD COLUMN voice_minutes_quota INTEGER DEFAULT 0;
ALTER TABLE pokkit_users ADD COLUMN voice_minutes_reset_at TIMESTAMP;
ALTER TABLE pokkit_users ADD COLUMN vapi_assistant_id TEXT;
ALTER TABLE pokkit_users ADD COLUMN vapi_phone_number_id TEXT;

-- Create voice_call_logs table
CREATE TABLE pokkit_voice_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES pokkit_users(id) ON DELETE CASCADE,
  call_sid TEXT NOT NULL,
  vapi_call_id TEXT,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  duration_seconds INTEGER,
  minutes_used DECIMAL(10,2),
  cost DECIMAL(10,2),
  transcript TEXT,
  summary TEXT,
  actions_taken JSONB,
  status TEXT, -- 'in_progress', 'completed', 'failed', 'no_answer'
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_voice_calls_user ON pokkit_voice_calls(user_id);
CREATE INDEX idx_voice_calls_started ON pokkit_voice_calls(started_at DESC);

-- RLS policies
ALTER TABLE pokkit_voice_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice calls"
  ON pokkit_voice_calls FOR SELECT
  USING (auth.uid() IN (
    SELECT auth_user_id FROM pokkit_users WHERE id = pokkit_voice_calls.user_id
  ));
```

### 3. Plan Configuration

Update `pokkit_users` table plan field to support new plans:

```typescript
type PlanType =
  | 'solo'           // $19 - SMS only
  | 'family'         // $34 - SMS only, up to 5 users
  | 'solo_voice'     // $39 - SMS + 100 voice minutes
  | 'family_voice'   // $59 - SMS + 200 voice minutes
  | 'business'       // $97 - SMS + 200 voice minutes + coming soon features

interface VoiceQuota {
  solo_voice: 100,
  family_voice: 200,
  business: 200
}
```

### 4. VAPI Setup Process

#### A. VAPI Account Configuration

1. **Sign up for VAPI**:
   - Go to vapi.ai
   - Create business account
   - Get API key

2. **Create Assistant Template**:
   ```json
   {
     "name": "Pokkit AI Assistant",
     "model": {
       "provider": "anthropic",
       "model": "claude-sonnet-4",
       "temperature": 0.7,
       "systemPrompt": "You are Pokkit, a helpful AI assistant that can help with booking flights, tracking prices, researching products, and much more. Be concise and action-oriented."
     },
     "voice": {
       "provider": "11labs",
       "voiceId": "rachel" // Professional, friendly voice
     },
     "transcriber": {
       "provider": "deepgram",
       "model": "nova-2",
       "language": "en"
     },
     "functions": [
       // Same skill functions as SMS
     ]
   }
   ```

3. **Configure Phone Numbers**:
   - VAPI will provide phone numbers OR
   - Use Twilio forwarding to VAPI

#### B. Per-User Assistant Provisioning

When user signs up for voice plan:

```typescript
async function provisionVoiceAgent(userId: string, plan: PlanType) {
  // 1. Create VAPI assistant for this user
  const assistant = await vapi.assistants.create({
    name: `Pokkit Assistant - User ${userId}`,
    model: {
      provider: 'anthropic',
      model: 'claude-sonnet-4',
      systemPrompt: `You are Pokkit, helping user ${user.name}.
      User context: ${JSON.stringify(userContext)}`,
    },
    voice: {
      provider: '11labs',
      voiceId: 'rachel',
    },
    serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
  })

  // 2. Get or create phone number
  const phoneNumber = await getOrCreateVapiPhoneNumber(userId)

  // 3. Link assistant to phone number
  await vapi.phoneNumbers.update(phoneNumber.id, {
    assistantId: assistant.id,
  })

  // 4. Save to database
  await supabase
    .from('pokkit_users')
    .update({
      vapi_assistant_id: assistant.id,
      vapi_phone_number_id: phoneNumber.id,
      voice_enabled: true,
      voice_minutes_quota: getVoiceQuota(plan),
      voice_minutes_reset_at: getNextResetDate(),
    })
    .eq('id', userId)

  return { assistant, phoneNumber }
}
```

#### C. Twilio → VAPI Forwarding

Option 1: **Direct VAPI Phone Numbers** (Simpler)
- VAPI provides phone number
- User gets new number for voice calls
- SMS goes to Pokkit Twilio number
- Voice goes to VAPI number

Option 2: **Twilio Forwarding** (Better UX - Same number)
- User's Pokkit number handles both SMS and voice
- Twilio webhook checks if it's SMS or voice call
- SMS → Pokkit SMS webhook
- Voice → Forward to VAPI via TwiML

```xml
<!-- Twilio Voice Webhook Response -->
<Response>
  <Dial>
    <Sip>sip:${vapiSipAddress}?assistant=${assistantId}</Sip>
  </Dial>
</Response>
```

### 5. Webhook Implementation

```typescript
// app/api/vapi/webhook/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, call } = body

  switch (type) {
    case 'assistant-request':
      // VAPI requesting assistant config for incoming call
      return await handleAssistantRequest(call)

    case 'function-call':
      // User requested an action during call
      return await handleFunctionCall(call)

    case 'call-started':
      // Call began - create log entry
      return await logCallStart(call)

    case 'call-ended':
      // Call ended - update usage, save transcript
      return await logCallEnd(call)

    case 'transcript':
      // Real-time transcript chunk
      return await saveTranscriptChunk(call)
  }
}

async function handleFunctionCall(call) {
  const { functionName, parameters } = call.message

  // Map to same skills as SMS
  const skill = getSkillByFunctionName(functionName)
  const result = await skill.execute(parameters, call.customer.userId)

  return NextResponse.json({
    result: result.message,
    // VAPI will speak this to the user
  })
}

async function logCallEnd(call) {
  const duration = call.endedAt - call.startedAt
  const minutes = Math.ceil(duration / 60)

  const { data: user } = await supabase
    .from('pokkit_users')
    .select('voice_minutes_used, voice_minutes_quota')
    .eq('vapi_assistant_id', call.assistantId)
    .single()

  // Update usage
  const newUsed = user.voice_minutes_used + minutes
  const overageMinutes = Math.max(0, newUsed - user.voice_minutes_quota)
  const overageCost = overageMinutes * 0.50

  await supabase
    .from('pokkit_users')
    .update({ voice_minutes_used: newUsed })
    .eq('vapi_assistant_id', call.assistantId)

  // Log call
  await supabase
    .from('pokkit_voice_calls')
    .insert({
      user_id: user.id,
      call_sid: call.twilioCallSid,
      vapi_call_id: call.id,
      from_number: call.customer.number,
      to_number: call.phoneNumber.number,
      duration_seconds: duration,
      minutes_used: minutes,
      cost: overageCost,
      transcript: call.transcript,
      summary: call.analysis?.summary,
      status: 'completed',
      ended_at: new Date(call.endedAt),
    })

  // If overage, charge user
  if (overageCost > 0) {
    await chargeOverage(user.id, overageCost, overageMinutes)
  }

  return NextResponse.json({ success: true })
}
```

### 6. Function/Skill Integration

VAPI functions = Same as SMS skills:

```typescript
const vapiFunctions = [
  {
    name: 'book_flight',
    description: 'Search and book flights',
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
        date: { type: 'string' },
        passengers: { type: 'number' },
      },
    },
  },
  {
    name: 'track_price',
    description: 'Monitor product prices',
    parameters: {
      type: 'object',
      properties: {
        product: { type: 'string' },
        target_price: { type: 'number' },
        url: { type: 'string' },
      },
    },
  },
  // ... all other SMS skills
]
```

### 7. Monthly Reset Cron Job

```typescript
// app/api/cron/reset-voice-minutes/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Reset all users whose reset date has passed
  const { data: users } = await supabase
    .from('pokkit_users')
    .select('id, plan, voice_minutes_reset_at')
    .lte('voice_minutes_reset_at', new Date().toISOString())
    .eq('voice_enabled', true)

  for (const user of users) {
    await supabase
      .from('pokkit_users')
      .update({
        voice_minutes_used: 0,
        voice_minutes_reset_at: getNextResetDate(),
      })
      .eq('id', user.id)
  }

  return NextResponse.json({ reset: users.length })
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/poll-tasks",
      "schedule": "*/1 * * * *"
    },
    {
      "path": "/api/cron/reset-voice-minutes",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### 8. Stripe Product Setup

Create new Stripe products:

```bash
# Solo + Voice ($39)
stripe products create --name "Pokkit Solo + Voice" --description "100 voice minutes per month"
stripe prices create --product=prod_xxx --unit-amount=3900 --currency=usd --recurring[interval]=month

# Family + Voice ($59)
stripe products create --name "Pokkit Family + Voice" --description "200 voice minutes for up to 5 users"
stripe prices create --product=prod_xxx --unit-amount=5900 --currency=usd --recurring[interval]=month

# Business ($97)
stripe products create --name "Pokkit Business" --description "200 voice minutes + email & calendar (coming soon)"
stripe prices create --product=prod_xxx --unit-amount=9700 --currency=usd --recurring[interval]=month
```

Update `.env.local`:
```
STRIPE_SOLO_PRICE_ID=price_xxx
STRIPE_FAMILY_PRICE_ID=price_xxx
STRIPE_SOLO_VOICE_PRICE_ID=price_xxx
STRIPE_FAMILY_VOICE_PRICE_ID=price_xxx
STRIPE_BUSINESS_PRICE_ID=price_xxx
```

### 9. User Dashboard Updates

Add voice usage section to `/account`:

```tsx
<div className="mb-6">
  <h3 className="text-lg font-semibold mb-2">Voice Minutes</h3>
  {user.voice_enabled ? (
    <>
      <div className="flex items-center justify-between mb-2">
        <span>Used this month:</span>
        <span className="font-semibold">
          {user.voice_minutes_used} / {user.voice_minutes_quota} minutes
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-pokkit-green h-2 rounded-full"
          style={{
            width: `${(user.voice_minutes_used / user.voice_minutes_quota) * 100}%`,
          }}
        />
      </div>
      <p className="text-sm text-gray-400 mt-2">
        Resets on {formatDate(user.voice_minutes_reset_at)}
      </p>
    </>
  ) : (
    <p className="text-gray-400">
      Upgrade to a voice plan to enable AI voice calls.{' '}
      <Link href="/pricing" className="text-pokkit-green">
        View plans →
      </Link>
    </p>
  )}
</div>
```

### 10. Implementation Checklist

- [ ] Sign up for VAPI account
- [ ] Create database migration 004
- [ ] Update plan type definitions
- [ ] Create Stripe products for new plans
- [ ] Implement voice provisioning function
- [ ] Create VAPI webhook endpoint
- [ ] Implement function call routing
- [ ] Create voice minutes reset cron
- [ ] Update signup flow to handle new plans
- [ ] Update dashboard to show voice usage
- [ ] Test complete flow end-to-end
- [ ] Document voice features for users

### 11. Cost Analysis

**VAPI Costs** (approximate):
- Voice: ~$0.10-0.15/minute
- Transcription: ~$0.01/minute
- Claude API: ~$0.02/minute
- Total: ~$0.13-0.18/minute

**Our Pricing**:
- Charge: $20 extra for 100 min = $0.20/min
- Overage: $0.50/min
- Margin: Healthy 10-65% per minute

**Monthly Revenue Increase**:
- 100 users on Solo + Voice: $2,000/mo extra
- 50 users on Family + Voice: $2,500/mo extra
- 20 users on Business: $1,940/mo extra
- **Total potential: $6,440/mo additional revenue**

## Summary

This integration enables:
1. ✅ AI voice calls on same Pokkit number
2. ✅ Same skills/actions as SMS
3. ✅ Usage tracking and billing
4. ✅ Per-user voice agents
5. ✅ Transcript logging
6. ✅ Overage handling

Users can now:
- Call their Pokkit number
- Talk to AI assistant
- Execute any SMS skill via voice
- Get hands-free assistance
- Review call transcripts in dashboard
