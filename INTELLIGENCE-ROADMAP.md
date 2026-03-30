# Jordyn Intelligence Roadmap
## Making Jordyn as Smart as a Voice AI Agent

### Current State (After Today's Fixes)
✅ Asks follow-up questions for missing info
✅ Beautiful formatted responses
✅ Real browser automation for research
✅ Conversation threading works

### Phase 1: Context & Memory (NEXT)
**Goal**: Remember conversations and user preferences

**Implementation**:
1. **Conversation State Tracking**
   - Track multi-turn conversations in database
   - Remember what user asked 3 messages ago
   - Reference previous topics: "those flights" = flights from 2 messages ago

2. **User Profile Learning**
   - Learn preferences from conversations
   - "I prefer window seats" → store in memory
   - "My home airport is BOS" → remember for future flights
   - Dietary restrictions, favorite cuisine, price ranges

3. **Smart Defaults**
   - Auto-fill origin based on learned home airport
   - Suggest times based on past booking patterns
   - Remember companion travelers

**Files to Modify**:
- `lib/sms/memory.ts` (NEW) - Memory management
- `lib/sms/context.ts` - Enhanced context with conversation history
- `lib/sms/parser.ts` - Parse with memory context

---

### Phase 2: Proactive Intelligence
**Goal**: Anticipate needs, make suggestions

**Features**:
1. **Smart Suggestions**
   - "Flights to LA are $50 cheaper on Tuesday. Want me to check?"
   - "That restaurant you liked has a new location nearby"

2. **Intelligent Clarifications**
   - Instead of: "What date?"
   - Say: "When would you like to fly? This weekend, next week, or specific date?"

3. **Task Chaining**
   - User: "Book flight to NYC"
   - Jordyn: "Found 3 flights. Want me to also find hotels nearby?"

**Files to Modify**:
- `lib/skills/suggestions.ts` (NEW)
- `lib/skills/browserbase-research.ts` - Add suggestion logic

---

### Phase 3: Natural Language Understanding
**Goal**: Understand like a human would

**Features**:
1. **Ambiguity Resolution**
   - "Book a table" → "Which restaurant? The sushi place from yesterday or somewhere new?"
   - "The cheap one" → Understands referring to previous results

2. **Contextual Understanding**
   - "How about tomorrow?" → Knows you're still talking about flights
   - "What about morning flights?" → Refines previous search

3. **Sentiment & Urgency Detection**
   - "ASAP!" → Prioritize, faster response
   - "Just browsing" → More detailed, less urgent

**Files to Modify**:
- `lib/sms/parser.ts` - Enhanced intent parsing with context
- `lib/sms/disambiguate.ts` (NEW) - Handle ambiguous requests

---

### Phase 4: Multi-Step Task Management
**Goal**: Handle complex, multi-step requests

**Features**:
1. **Task Decomposition**
   - "Plan my NYC trip" →
     - Find flights
     - Book hotel
     - Suggest restaurants
     - Check weather

2. **Approval Workflow**
   - Show plan first, then execute
   - "Here's what I'll do: 1) Find flights 2) Check hotels. Sound good?"

3. **Error Recovery**
   - If flight search fails, automatically try alternate dates
   - If price too high, suggest cheaper alternatives

**Files to Create**:
- `lib/tasks/orchestrator.ts` - Multi-step task management
- `lib/tasks/recovery.ts` - Error handling & alternatives

---

### Phase 5: Personalization Engine
**Goal**: Adapt to each user's style

**Features**:
1. **Communication Style Matching**
   - User texts: "yo find me flights" → Jordyn: "yo! checking flights rn"
   - User texts formally → Jordyn responds formally

2. **Preference Learning**
   - Always picks afternoon flights → Learn: prefers afternoon
   - Always chooses mid-price options → Learn: budget-conscious but not cheapest

3. **Predictive Actions**
   - "It's Tuesday, want me to check your weekly grocery deal monitors?"
   - "Your usual flight to LA - want me to search dates?"

**Files to Create**:
- `lib/personalization/style.ts` - Communication style adapter
- `lib/personalization/learn.ts` - Preference learning
- `lib/personalization/predict.ts` - Predictive suggestions

---

### Phase 6: Voice-Level Responsiveness
**Goal**: Feel as natural as voice AI

**Features**:
1. **Instant Acknowledgments**
   - Immediately: "On it! Checking flights now..."
   - Then: Research task runs in background

2. **Progress Updates**
   - For tasks >30sec: "Still searching... found 5 options so far"

3. **Conversational Fillers**
   - "Let me think..."
   - "Hmm, interesting question..."
   - "Good choice! Here's what I found..."

4. **Personality Traits**
   - Helpful but not pushy
   - Enthusiastic about good deals
   - Empathetic when things are expensive/unavailable

**Files to Modify**:
- ALL skill handlers - Add personality
- `lib/sms/personality.ts` (NEW) - Personality engine

---

### Implementation Priority

**Week 1**: Phase 1 (Context & Memory)
- Biggest intelligence boost
- Foundation for everything else

**Week 2**: Phase 3 (Natural Language) + Phase 2 (Proactive)
- Makes conversations feel natural
- Users feel understood

**Week 3**: Phase 4 (Multi-Step) + Phase 6 (Responsiveness)
- Handle complex requests
- Feel like voice agent

**Week 4**: Phase 5 (Personalization)
- Polish & personality
- Each user feels special

---

### Technical Architecture

```typescript
// Enhanced Flow
1. User texts: "find cheap flights"

2. Context Loader:
   - Load conversation history (last 10 messages)
   - Load user memories (preferences, past bookings)
   - Load active tasks (anything pending)

3. Intent Parser (with memory):
   - Parse: FIND_FLIGHT
   - Inject memories: origin = BOS (learned), prefers cheap/window seats
   - Check missing: destination, date

4. Intelligence Layer (NEW):
   - Check if can infer from context ("cheap" = max $200 based on past)
   - Check if referring to previous conversation
   - Determine urgency

5. Question Generator:
   - Smart questions with context
   - "Where to? LA again or somewhere new?"

6. Skill Executor:
   - Run with full context
   - Apply learned preferences

7. Response Generator:
   - Format with personality
   - Add proactive suggestions
   - Store memory for next time
```

### Database Schema Additions

```sql
-- Conversation memory
CREATE TABLE jordyn_conversation_memory (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES jordyn_users(id),
  topic TEXT, -- "flights_to_la", "restaurant_search"
  context JSONB, -- Full conversation context
  expires_at TIMESTAMP, -- Temporary memory (24h)
  created_at TIMESTAMP
);

-- User learned preferences
CREATE TABLE jordyn_user_memories (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES jordyn_users(id),
  category TEXT, -- "preference", "pattern", "fact"
  key TEXT, -- "home_airport", "seat_preference"
  value JSONB,
  confidence FLOAT, -- 0-1, how sure we are
  learned_from TEXT, -- "explicit" or "inferred"
  last_reinforced_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

### Success Metrics

**Before** (Current):
- User: "find flights"
- Jordyn: "Where to?"
- User: "LA"
- Jordyn: "Where from?"
- User: "Boston"
- Jordyn: "What date?"
- User: "next week"
- Jordyn: "🔍 Researching..."

**After** (Phase 6):
- User: "find cheap flights to LA next week"
- Jordyn: "On it! Checking BOS to LA next week under $200 (your usual budget). Prefer afternoon flights like usual?"
- User: "yeah"
- Jordyn: "Perfect! Searching now... 🔍"
- *(2 min later)*
- Jordyn: "Found 3 great options! The Delta 2pm flight is $179 (window seat available!)..."
