# POKKIT — Claude Code Instructions

## What This Is
Pokkit personal AI assistant. SMS only. No app.
Replaces Expedia, OpenTable, Kayak, price trackers
and a dozen other apps. All via text message.
$15/month Solo. $24/month Family. 14-day free trial.
Distributed through Apex Affinity Group MLM network.

## My Job (Claude Code)
Build the ENTIRE Pokkit application:
- Next.js frontend (landing, signup, user dashboard, admin panel)
- Full webhook receivers with actual processing logic
- SMS message processing with Claude API
- All external API integrations (Twilio, Browserbase, Stripe, Apex)
- Background jobs and scheduled tasks
- Database operations via Supabase

No Twin agents. I do everything.

## ⚠️ CRITICAL: Check Before ANY Feature Request
**BEFORE implementing ANY feature, bug fix, or change:**
1. Read DEPENDENCY-MAP.md in full
2. Identify which tables/APIs/services are affected
3. Check the Feature Request Checklist in DEPENDENCY-MAP.md
4. If ANY checkbox is unclear → ASK the user first

**This is MANDATORY. Skipping this step may break core functionality.**

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
5. **NO MLM logic in Pokkit** — all commission tracking happens in Apex
6. RLS on all Supabase tables — service role for server ops
7. Mobile first on every component — test at 375px
8. Validate ALL webhook signatures before processing (Stripe, Twilio)
9. Send all customer lifecycle events to Apex webhook

## Webhook Pattern (Stripe, Twilio)
1. Validate signature (NEVER skip this)
2. Process the request (call Claude API, external APIs, etc.)
3. Update Supabase with results
4. Send webhooks to Apex for customer events (non-blocking)
5. Send response (SMS reply, etc.)
6. Return 200

## Pricing (never hardcode — always load from DB or env)
Solo: $15/month | Family: $24/month
**All commission calculations handled by Apex Affinity system**

## Architecture Overview
- **Pokkit App**: Frontend + webhook receivers + Apex integration
- **Apex System**: MLM commission tracking + rep portal (external)
- **Data Flow**: Pokkit → Apex via webhooks (customer lifecycle events)
- **Admin Access**: /admin panel for company admins to view stats
- **Rep Access**: Reps use Apex portal (NOT Pokkit) for commissions

## Development Status
✅ Gate 0: Setup (database, migrations)
✅ Gate 1: Webhooks (Stripe, Twilio, Apex integration)
✅ Gate 2: Landing page
✅ Gate 3: Signup flow
✅ Gate 4: User dashboard (/account)
✅ Gate 5: Admin panel (/admin)

**Status**: All core gates complete. MLM functionality removed (handled by Apex).

## Key Files (Read These First)
- **DEPENDENCY-MAP.md** — **READ BEFORE ANY CHANGES** (shows all dependencies)
- PROJECT-SPEC.md — full product spec
- CLAUDE-CODE-SPEC.md — detailed frontend build instructions
- supabase/migrations/001_pokkit_schema.sql — initial schema
- supabase/migrations/002_remove_mlm_add_apex_webhook.sql — MLM removal + Apex

## Questions?
1. Check DEPENDENCY-MAP.md first (understand what you're changing)
2. Check CLAUDE-CODE-SPEC.md second (design/frontend guidance)
3. Check PROJECT-SPEC.md third (product requirements)
4. If still unclear → ASK the user

Never guess on webhook signatures, database schema changes, or external API integration.
