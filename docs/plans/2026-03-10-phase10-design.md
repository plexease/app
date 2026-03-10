# Phase 10 — Session Enforcement, Feedback Framework & Billing Polish

> Design document for Plexease Phase 10
> Date: 2026-03-10

---

## Overview

Phase 10 delivers three functional features deferred from the Phase 9 design (sections 9e–9f): concurrent session management, a user feedback framework, and billing UI polish including a "uses → credits" terminology migration and an Enterprise callout on the upgrade page.

### What's NOT in Phase 10

- Landing page repositioning (deferred to Phase 11)
- Automated tests for Phase 10 features (deferred to Phase 11)
- Sidebar accordion navigation (Phase 11)
- Landing page tools section update (Phase 11)

---

## 1. Session Enforcement

### Behaviour

- Maximum 3 concurrent sessions per user account
- On 4th login, the oldest session (by `created_at`) is silently invalidated
- The evicted user is redirected to login on their next interaction (within ~5 minutes)
- Users can view and manage active sessions in account settings

### Login flow (auth callback)

1. Parse `User-Agent` header into friendly device name (e.g. "Chrome on Windows", "Safari on iPhone")
2. Store both raw User-Agent and parsed friendly name in the session record
3. Hash the client IP address (SHA-256, privacy-preserving) for display context
4. Insert new row into `sessions` table
5. Count user's sessions — if > 3, delete the oldest by `created_at`
6. Set `plexease_session_id` cookie with the new session's UUID

### Middleware validation (cached)

1. Read `plexease_session_id` cookie
2. Read `session_checked_at` cookie — if less than 5 minutes old, skip DB check
3. If stale or missing, query `sessions` table for this session ID
4. If session exists → update `last_active` timestamp, set `session_checked_at` to now
5. If session does not exist (evicted) → clear auth cookies, redirect to `/login?reason=session_expired`

### Login page messaging

- If URL contains `?reason=session_expired`, show a non-alarming toast: *"You were signed out because another device signed in. You can manage active sessions in Settings."*

### Active sessions UI (account settings)

New "Active Sessions" section below the existing profile settings:

- List of active sessions showing:
  - Parsed device info (friendly name)
  - Last active (relative time, e.g. "2 minutes ago")
  - "Sign out" button per session
- Current session highlighted and labelled "(this device)" — no sign-out button on current session
- "Sign out all other devices" button at the bottom of the list

### API routes

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/sessions` | List all active sessions for current user |
| `DELETE` | `/api/sessions/[id]` | Delete a specific session (must belong to current user) |
| `DELETE` | `/api/sessions?all_others=true` | Delete all sessions except current |

### Database

The `sessions` table already exists with RLS policies. One schema addition:

```sql
-- Add raw_user_agent column to sessions table
ALTER TABLE sessions ADD COLUMN raw_user_agent TEXT;
```

Existing columns: `id`, `user_id`, `device_info` (friendly name), `ip_hash`, `last_active`, `created_at`.

---

## 2. Feedback Framework

### Design principles

- Unobtrusive — never blocks the user's next action
- Dismissible — one tap to dismiss, never shows that trigger again
- CRM-ready — all feedback tied to user record with persona/tier snapshot

### Surface 1: 5th-use inline card

**Trigger:** When the user's total monthly usage count (across all tools) reaches exactly 5.

**Why total, not per-tool:** A user who tries 5 different tools has seen more of the product and gives more valuable feedback than someone running one tool 5 times.

**Rendering logic:**
1. After tool result renders, a `useFeedback` hook checks:
   - Current month's total usage count (from existing usage data)
   - Whether `fifth_use` trigger has been dismissed (via `GET /api/feedback/status`)
2. If count ≥ 5 and not dismissed and not already submitted → show inline card

**Card UI:**
- Positioned below the tool result
- Copy: *"Quick thought? Help us improve — totally optional"*
- Components: text field + "Send" button + dismiss "×" button
- On send → `POST /api/feedback` with `trigger_type: "fifth_use"`, `tool_name` from current tool
- On dismiss → `POST /api/feedback/dismiss` with `trigger_type: "fifth_use"`

### Surface 2: Persistent feedback button

- "Feedback" button in the sidebar, below navigation links, above sign-out button
- Opens a slide-out panel: *"How can we improve?"* + text field + "Send" + "Cancel"
- On send → `POST /api/feedback` with `trigger_type: "manual"`
- No dismiss tracking — always available on every page

### Surface 3: Post-cancellation intercept

**Detection via Stripe webhook (not URL-based):**
1. When `customer.subscription.updated` webhook arrives with `cancel_at_period_end: true`, set `show_cancellation_feedback = true` on the subscription record
2. Next time the user loads the dashboard, check the flag
3. If true → redirect to `/cancelled`

**`/cancelled` page:**
- Empathetic copy: *"Sorry to see you go. Your access continues until [period end date]."*
- Optional feedback: text field + "Send feedback" + "Skip" buttons
- On send → `POST /api/feedback` with `trigger_type: "cancellation"`, clear the flag
- On skip → clear the flag, redirect to dashboard
- If user has already submitted cancellation feedback → skip straight to dashboard

### API routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/feedback` | Submit feedback (`{ text, trigger_type, tool_name? }`) |
| `POST` | `/api/feedback/dismiss` | Dismiss a trigger (`{ trigger_type }`) |
| `GET` | `/api/feedback/status` | Check dismissal state + whether 5th-use card should show |

**Server-side enrichment on `POST /api/feedback`:**
- `user_id` from auth session
- `persona` from profile or cookie (snapshot at time of submission)
- `tier` from current subscription plan (snapshot)
- `status` defaults to `new`

### Database

The `feedback` and `feedback_dismissals` tables already exist with RLS policies. One schema addition:

```sql
-- Add cancellation feedback flag to subscriptions table
ALTER TABLE subscriptions ADD COLUMN show_cancellation_feedback BOOLEAN DEFAULT FALSE;
```

---

## 3. Billing UI — Credits & Enterprise Callout

### Terminology migration: "uses" → "credits"

One credit = one tool use. No functional change — purely a labelling update for market alignment.

**Components to update:**
- `UsageCounter` (sidebar) — "X/Y uses" → "X/Y credits"
- `UsageCard` (dashboard) — update copy
- `PricingCard` (landing + upgrade) — update feature descriptions
- `FeatureComparison` table — "Tool uses" row → "Monthly credits"
- `pricing-section.tsx` (landing) — update tier descriptions
- `upgrade-content.tsx` — update tier descriptions
- Tool form limit-reached messages — "You've used all your uses" → "You've used all your credits"
- Constants file comments (no code change, just documentation)

### Enterprise callout (upgrade page only)

Positioned below the existing 3-tier PricingCard row on the upgrade page.

**Design:**
- Muted/secondary card style — does not compete visually with Free/Essentials/Pro cards
- Copy: *"Need more? Enterprise plans offer custom credit limits, team accounts, and dedicated support."*
- CTA: "Contact us" button → `mailto:hello@plexease.io` (placeholder, will be updated pre-launch)

**Not added to:**
- Landing page pricing section (keeps the conversion funnel focused on 3 tiers)
- FeatureComparison table (no Enterprise column)

### No changes to

- `TierBadge` — already handles Free/Essentials/Pro correctly
- `PricingToggle` — monthly/annual toggle unchanged
- Usage limits — 10/100/1,000 remain correct
- Stripe checkout flow — no changes needed

---

## 4. File Impact Summary

### New files

| File | Purpose |
|------|---------|
| `app/api/sessions/route.ts` | GET (list) + DELETE (all others) sessions |
| `app/api/sessions/[id]/route.ts` | DELETE specific session |
| `app/api/feedback/route.ts` | POST feedback |
| `app/api/feedback/dismiss/route.ts` | POST dismiss trigger |
| `app/api/feedback/status/route.ts` | GET feedback/dismissal status |
| `app/(dashboard)/cancelled/page.tsx` | Post-cancellation feedback page |
| `components/feedback/inline-feedback-card.tsx` | 5th-use inline card component |
| `components/feedback/feedback-button.tsx` | Persistent sidebar feedback button + panel |
| `components/feedback/cancellation-feedback.tsx` | Cancellation page feedback form |
| `components/settings/active-sessions.tsx` | Active sessions list for settings page |
| `components/billing/enterprise-callout.tsx` | Enterprise banner for upgrade page |
| `lib/sessions.ts` | Session management helpers (create, validate, parse UA, enforce limit) |
| `lib/feedback.ts` | Feedback helpers (submit, dismiss, check status) |
| `lib/supabase/migrations/sessions_raw_ua.sql` | Add raw_user_agent column |
| `lib/supabase/migrations/cancellation_feedback.sql` | Add show_cancellation_feedback column |
| `hooks/use-feedback.ts` | Client hook for 5th-use card logic |

### Modified files

| File | Change |
|------|--------|
| `app/api/auth/callback/route.ts` | Add session creation + enforcement on login |
| `proxy.ts` (middleware) | Add cached session validation |
| `components/dashboard/sidebar.tsx` | Add persistent feedback button |
| `components/settings/profile-settings.tsx` or `settings/page.tsx` | Add active sessions section |
| `components/billing/usage-counter.tsx` | "uses" → "credits" |
| `components/billing/usage-card.tsx` | "uses" → "credits" |
| `components/billing/pricing-card.tsx` | "uses" → "credits" in feature lists |
| `components/billing/feature-comparison.tsx` | "Tool uses" → "Monthly credits" |
| `components/landing/pricing-section.tsx` | "uses" → "credits" |
| `app/(dashboard)/upgrade/upgrade-content.tsx` | "uses" → "credits" + Enterprise callout |
| `app/api/stripe/webhook/route.ts` | Set `show_cancellation_feedback` flag on cancellation |
| `app/(dashboard)/page.tsx` (dashboard) | Check cancellation feedback flag → redirect |
| `lib/supabase/schema.sql` | Add new columns to schema source of truth |
| Tool form components (multiple) | Update limit-reached message copy |

---

## 5. Success Criteria

- Logging in on a 4th device silently evicts the oldest session within 5 minutes
- Evicted user sees a helpful toast on redirect, not an error
- Users can view and individually sign out sessions in settings
- 5th-use feedback card appears exactly once, respects dismissal permanently
- Persistent feedback button is accessible from every authenticated page
- Post-cancellation feedback page appears once after cancelling via Stripe
- All pricing/usage copy consistently says "credits" with no remaining "uses"
- Enterprise callout is visible only on the upgrade page
