# 🎙️ Telnyx Voice AI Sales Widget Setup

## Overview

I've added a Telnyx Voice AI chat widget to your homepage! Visitors can now chat or talk with an AI sales agent to learn about Pokkit before signing up.

---

## ✅ What's Been Added

### 1. Sales Agent Configuration (`lib/telnyx/sales-agent.ts`)
- Complete system prompt with all Pokkit features
- Pricing information for all 5 plans
- Common questions and answers
- Friendly, enthusiastic tone

### 2. Widget Component (`components/SalesWidget.tsx`)
- React component that loads the Telnyx widget
- Styled to match Pokkit branding (teal-green #00E5B4)
- Bottom-right positioning
- Includes greeting message

### 3. Widget Loader (`components/SalesWidgetLoader.tsx`)
- Fetches assistant ID from API
- Only loads when ready
- Error handling

### 4. API Endpoint (`app/api/sales-agent/route.ts`)
- Returns assistant ID for widget
- Creates agent if it doesn't exist

### 5. Landing Page Integration (`app/page.tsx`)
- Widget added to homepage
- Loads automatically on page visit

---

## 🚀 How to Activate

### Step 1: Create the Sales Agent

Run this once to create your Telnyx sales assistant:

```bash
curl http://localhost:3000/api/sales-agent
```

This will:
1. Create a new Telnyx AI Assistant
2. Configure it with the sales prompts
3. Return the Assistant ID

### Step 2: Save the Assistant ID (Optional)

If you want to reuse the same assistant, add to `.env.local`:

```
TELNYX_SALES_AGENT_ID=your-assistant-id-here
```

### Step 3: Test It!

1. Go to http://localhost:3000
2. Look for the chat widget in the bottom-right corner
3. Click it to open
4. Try asking:
   - "How much does Pokkit cost?"
   - "What can Pokkit do?"
   - "Tell me about the free trial"
   - Click the microphone icon to talk!

---

## 🎤 What the Sales Agent Can Do

### Voice & Chat
- Visitors can TYPE or TALK to the agent
- Supports both text chat and voice conversations
- Real-time transcription visible while talking

### Knowledge Base
The agent knows:
- All 5 pricing plans ($19-$97/month)
- Every feature Pokkit offers
- How the 7-day free trial works
- Smart home integration details
- How to sign up
- Common objections and concerns

### Sample Conversations

**Example 1:**
```
Visitor: "How much is it?"
Agent: "Plans start at $19/month for SMS-only, or $39/month with voice calling! All plans include a 7-day free trial. Want to hear about the options?"
```

**Example 2:**
```
Visitor: "Can it book flights?"
Agent: "Yes! Just text something like 'Find flights to Miami next Friday' and it'll search airlines, compare prices, and help you book!"
```

**Example 3:**
```
Visitor: "What's included in the trial?"
Agent: "Great question! You get your personal Pokkit number immediately, can try ALL features for 7 days, and you're only charged after the trial ends. Cancel anytime!"
```

---

## 🎨 Widget Appearance

### Colors
- Primary: **#00E5B4** (Pokkit teal-green)
- Background: **#1a1a1a** (Dark)
- Text: **#ffffff** (White)

### Position
- Bottom-right corner of page
- Floating button when closed
- Expands to chat window when clicked

### Greeting
"👋 Hi! I'm here to help you learn about Pokkit. Ask me anything!"

---

## 💡 Why This Is Valuable

### Instant Support 24/7
- Visitors get answers immediately
- No wait times
- Available nights and weekends

### Qualifies Leads
- Educates prospects before they sign up
- Answers objections
- Builds confidence in the product

### Reduces Support Load
- Handles common questions automatically
- Frees up your time
- Consistent answers every time

### Voice = Engagement
- Voice conversations are more engaging
- Feels like talking to a real person
- Differentiates from competitors

---

## 📊 Usage Tracking (Optional)

You can track widget usage through:

1. **Telnyx Dashboard**
   - Go to telnyx.com/dashboard
   - View conversation logs
   - See most common questions

2. **Analytics** (Coming Soon)
   - Visitor engagement rates
   - Conversion tracking
   - Popular questions

---

## 🔧 Customization Options

### Change the Greeting

Edit `components/SalesWidget.tsx`, line 21:

```typescript
greeting: "Your custom greeting here!",
```

### Change Colors

Edit `components/SalesWidget.tsx`, lines 16-18:

```typescript
theme: {
  primaryColor: '#YOUR_COLOR',
  backgroundColor: '#YOUR_BG',
  textColor: '#YOUR_TEXT',
},
```

### Update Sales Prompt

Edit `lib/telnyx/sales-agent.ts`, the `SALES_AGENT_PROMPT` constant.

### Disable Voice

If you only want text chat, you can disable the microphone button in the theme config.

---

## 💰 Cost

**Telnyx Voice AI Widget:**
- First 1,000 conversations/month: **FREE**
- After that: ~$0.05-0.10 per conversation
- Very affordable for pre-sales support!

---

## 🎯 Next Steps

1. **Test it thoroughly** - Try different questions
2. **Refine the prompts** - Add any missing info
3. **Monitor conversations** - See what people ask
4. **Update as needed** - Keep info current

---

## 🆘 Troubleshooting

### Widget Not Showing
- Check browser console for errors
- Verify API endpoint returns assistant ID
- Ensure Telnyx script is loading

### Agent Giving Wrong Info
- Update the prompt in `sales-agent.ts`
- Recreate the assistant (delete old one first)

### Voice Not Working
- Check browser permissions for microphone
- Test in Chrome/Safari (best support)
- Verify Telnyx account has voice AI enabled

---

**The widget is ready to go!** Just visit your homepage and start chatting! 🚀
