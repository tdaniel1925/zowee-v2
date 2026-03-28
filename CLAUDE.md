# ZOWEE — Claude Code Instructions

## What This Is
Zowee personal AI assistant. SMS only. No app.
Replaces Expedia, OpenTable, Kayak, price trackers
and a dozen other apps. All via text message.
$15/month Solo. $24/month Family. 14-day free trial.
Distributed through Apex Affinity Group MLM network.

## My Job (Claude Code)
Build the ENTIRE Zowee application:
- Next.js frontend (landing, signup, dashboard, rep portal)
- Full webhook receivers with actual processing logic
- SMS message processing with Claude API
- All external API integrations (Twilio, Browserbase, etc.)
- Background jobs and scheduled tasks
- Database operations via Supabase

No Twin agents. I do everything.

## Stack
Next.js 14 + Tailwind + Supabase + Stripe + Vercel
Reuses Jordyn project credentials for Supabase, Stripe, Resend.

## Design System
Dark theme. Accent: #00E5B4 (teal-green).
Display font: Syne. Body font: DM Sans.
Mobile first — 375px minimum viewport always.
See CLAUDE-CODE-SPEC.md for full design direction.

## Critical Rules
1. NEVER hardcode credentials — always process.env
2. Build full agent logic — process SMS, call APIs, do the work
3. Call Twilio, Anthropic, and Browserbase as needed
4. Webhook receivers process messages AND send replies
5. Commission values always loaded from DB — never hardcoded
6. RLS on all Supabase tables — service role for server ops
7. Mobile first on every component — test at 375px
8. Validate ALL webhook signatures before processing

## Webhook Pattern (updated)
1. Validate signature
2. Process the request (call Claude API, external APIs, etc.)
3. Update Supabase with results
4. Send response (SMS reply, etc.)
5. Return 200

## Pricing (never hardcode — always load from DB or env)
Solo: $15/month | Family: $24/month
Rep direct Solo: $7.50 | Rep direct Family: $10.00
BotMakers: $2.00 | Override pool Solo: $5.50 | Family: $12.00

## Gate Order
0 (setup) → 1 (webhooks) → 2 (landing) → 3 (signup) → 4 (dashboard) → 5 (rep portal)

## Current Gate
GATE 0 — not started

## Key Files
- PROJECT-SPEC.md — full product spec
- CLAUDE-CODE-SPEC.md — detailed frontend build instructions
- TWIN-AGENT-SPEC.md — Twin backend spec (not my concern)
- supabase/migrations/001_zowee_schema.sql — run this first

## Questions?
If anything is ambiguous about the frontend or webhooks — 
check CLAUDE-CODE-SPEC.md first. If still unclear, ask.
Never guess on pricing, commission, or webhook logic.
