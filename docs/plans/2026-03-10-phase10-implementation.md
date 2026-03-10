# Phase 10 Implementation Plan — Session Enforcement, Feedback Framework & Billing Polish

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add concurrent session management (3-session limit), a user feedback framework (5th-use card, persistent button, post-cancellation intercept), and billing UI polish (uses→credits rename, Enterprise callout).

**Architecture:** Server-side session enforcement via auth callback + cached middleware validation. Feedback framework uses 3 surfaces (inline card, sidebar button, cancellation page) backed by existing `feedback`/`feedback_dismissals` tables. Billing changes are terminology-only (uses→credits) plus an Enterprise callout on the upgrade page.

**Tech Stack:** Next.js 16, TypeScript, Supabase (PostgreSQL + RLS), Stripe webhooks, Tailwind CSS

**Key reference files:**
- Auth callback: `app/auth/callback/route.ts`
- Middleware: `lib/supabase/middleware.ts`
- Sidebar: `components/dashboard/sidebar.tsx`
- Settings page: `app/(dashboard)/settings/page.tsx`
- Stripe webhook: `app/api/stripe/webhook/route.ts`
- Dashboard page: `app/(dashboard)/dashboard/page.tsx`
- Dashboard layout: `app/(dashboard)/layout.tsx`
- Upgrade page: `app/(dashboard)/upgrade/upgrade-content.tsx`
- Usage counter: `components/billing/usage-counter.tsx`
- Usage card: `components/billing/usage-card.tsx`
- Feature comparison: `components/billing/feature-comparison.tsx`
- Pricing section (landing): `components/landing/pricing-section.tsx`
- Limit reached card: `components/shared/limit-reached-card.tsx`
- API helpers: `lib/api-helpers.ts`
- Constants: `lib/constants.ts`
- Schema: `lib/supabase/schema.sql`
- Tool form pattern: `components/tools/tool-finder/advisor-form.tsx` (representative)

---

## Task 1: Database Migrations

**Files:**
- Create: `lib/supabase/migrations/sessions_raw_ua.sql`
- Create: `lib/supabase/migrations/cancellation_feedback.sql`
- Modify: `lib/supabase/schema.sql:134-141` (add `raw_user_agent` to sessions table)
- Modify: `lib/supabase/schema.sql:19-31` (add `show_cancellation_feedback` to subscriptions)

**Step 1: Create sessions migration**

Create `lib/supabase/migrations/sessions_raw_ua.sql`:

```sql
-- Add raw User-Agent storage to sessions table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS raw_user_agent TEXT;
```

**Step 2: Create cancellation feedback migration**

Create `lib/supabase/migrations/cancellation_feedback.sql`:

```sql
-- Add cancellation feedback flag to subscriptions table
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS show_cancellation_feedback BOOLEAN DEFAULT FALSE;
```

**Step 3: Update schema.sql source of truth**

In `lib/supabase/schema.sql`, add `raw_user_agent text,` after line 138 (`device_info text,`) in the sessions table definition.

Add `show_cancellation_feedback boolean default false,` after line 29 (`grace_period_end timestamptz,`) in the subscriptions table definition.

**Step 4: Run migrations against Supabase**

Run both migration SQL files against the development Supabase project via the Supabase dashboard SQL editor or CLI.

**Step 5: Commit**

```bash
git add lib/supabase/migrations/sessions_raw_ua.sql lib/supabase/migrations/cancellation_feedback.sql lib/supabase/schema.sql
git commit -m "feat: add database migrations for session UA and cancellation feedback flag"
```

---

## Task 2: Session Management Library

**Files:**
- Create: `lib/sessions.ts`

**Step 1: Create session management helpers**

Create `lib/sessions.ts` with these functions:

- `parseUserAgent(ua: string): string` — parses raw User-Agent into a friendly name like "Chrome on Windows". Use simple regex matching against common browser/OS patterns. Store a mapping of known patterns. Return "Unknown device" as fallback.
- `hashIp(ip: string): Promise<string>` — SHA-256 hash the IP, return first 16 hex chars (enough for display, not reversible).
- `createSession(userId: string, request: Request): Promise<string>` — inserts a new session row with parsed device_info, raw_user_agent, and ip_hash. Returns the new session UUID. Uses the Supabase service client (not user client) since we need insert permissions beyond RLS.
- `enforceSessionLimit(userId: string, maxSessions?: number): Promise<void>` — counts sessions for user. If > maxSessions (default 3), deletes the oldest by `created_at`. Uses service client.
- `validateSession(sessionId: string): Promise<boolean>` — checks if session exists in DB. If yes, updates `last_active` to now. Returns true/false. Uses service client.
- `getUserSessions(userId: string): Promise<Session[]>` — returns all sessions for user, ordered by `last_active` desc. Uses service client.
- `deleteSession(userId: string, sessionId: string): Promise<void>` — deletes a specific session belonging to the user. Uses service client.
- `deleteOtherSessions(userId: string, currentSessionId: string): Promise<void>` — deletes all sessions for user except the given one. Uses service client.

Export a `Session` type:
```typescript
export type Session = {
  id: string;
  deviceInfo: string;
  rawUserAgent: string | null;
  ipHash: string | null;
  lastActive: string;
  createdAt: string;
};
```

The service client import is `getServiceClient` from `@/lib/supabase/service`.

**Step 2: Commit**

```bash
git add lib/sessions.ts
git commit -m "feat: add session management library with UA parsing and enforcement"
```

---

## Task 3: Session Creation on Auth Callback

**Files:**
- Modify: `app/auth/callback/route.ts`

**Step 1: Update auth callback to create session**

The current auth callback is simple (lines 1-18). After the successful `exchangeCodeForSession` call (line 11), add:

1. Import `createSession`, `enforceSessionLimit` from `@/lib/sessions`
2. Get the user from the session: `const { data: { user } } = await supabase.auth.getUser()`
3. If user exists, call `createSession(user.id, request)` to get the session ID
4. Call `enforceSessionLimit(user.id)` to drop oldest if > 3
5. Set `plexease_session_id` cookie on the redirect response with the session ID (httpOnly, secure in prod, sameSite lax, maxAge 30 days)

The redirect response needs to be constructed with `NextResponse.redirect()` and then have the cookie set on it before returning.

**Step 2: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "feat: create session record and enforce 3-session limit on login"
```

---

## Task 4: Session Validation in Middleware

**Files:**
- Modify: `lib/supabase/middleware.ts:55-85`

**Step 1: Add session validation after onboarding check**

After the onboarding check block (ends at line 85), add session validation for authenticated users on protected routes:

1. Import `validateSession` from `@/lib/sessions`
2. Read `plexease_session_id` cookie from request
3. If no session cookie but user is authenticated on a protected route — skip validation (backwards compatible for existing sessions before this feature)
4. If session cookie exists, read `session_checked_at` cookie
5. If `session_checked_at` exists and is less than 5 minutes old (compare timestamps), skip DB check
6. Otherwise, call `validateSession(sessionId)`
7. If session is invalid (returns false): clear `plexease_session_id`, `session_checked_at`, and Supabase auth cookies. Redirect to `/login?reason=session_expired`
8. If session is valid: set `session_checked_at` cookie to `Date.now().toString()` with maxAge 300 (5 minutes)

Add `/cancelled` to the `onboardingExemptPaths` array (line 56) so the cancellation feedback page is accessible.

**Step 2: Commit**

```bash
git add lib/supabase/middleware.ts
git commit -m "feat: add cached session validation to middleware with 5-min TTL"
```

---

## Task 5: Session API Routes

**Files:**
- Create: `app/api/sessions/route.ts`
- Create: `app/api/sessions/[id]/route.ts`

**Step 1: Create list + delete-all-others route**

Create `app/api/sessions/route.ts`:

- `GET` handler: authenticate user via Supabase, call `getUserSessions(userId)`, return JSON array
- `DELETE` handler: authenticate user, read `plexease_session_id` cookie from request, check for `all_others=true` query param, call `deleteOtherSessions(userId, currentSessionId)`, return `{ success: true }`

Both handlers return 401 if not authenticated.

**Step 2: Create delete-specific-session route**

Create `app/api/sessions/[id]/route.ts`:

- `DELETE` handler: authenticate user, get session ID from route params, call `deleteSession(userId, sessionId)`, return `{ success: true }`
- Return 401 if not authenticated

**Step 3: Commit**

```bash
git add app/api/sessions/route.ts app/api/sessions/\[id\]/route.ts
git commit -m "feat: add session management API routes (list, delete, delete others)"
```

---

## Task 6: Active Sessions UI Component

**Files:**
- Create: `components/settings/active-sessions.tsx`

**Step 1: Build the active sessions component**

Create a client component that:

1. Accepts `currentSessionId: string` prop (from cookie, passed by settings page)
2. On mount, fetches `GET /api/sessions` and stores in state
3. Renders a list of sessions, each showing:
   - Device info (friendly name from `deviceInfo` field)
   - Last active time (relative, e.g. "2 minutes ago" — use a simple helper that computes relative time from ISO string)
   - "(this device)" label if `session.id === currentSessionId`
   - "Sign out" button (not shown for current device)
4. "Sign out" button calls `DELETE /api/sessions/{id}`, removes from local state on success, shows toast
5. "Sign out all other devices" button at the bottom calls `DELETE /api/sessions?all_others=true`, refreshes session list, shows toast
6. Loading state while fetching, empty state if only one session

Style to match existing settings page: `rounded-lg border border-surface-700 bg-surface-900 p-5` card style, `text-white` for device names, `text-muted-400` for last active times, brand-coloured buttons.

**Step 2: Commit**

```bash
git add components/settings/active-sessions.tsx
git commit -m "feat: add active sessions UI component for settings page"
```

---

## Task 7: Integrate Active Sessions into Settings Page

**Files:**
- Modify: `app/(dashboard)/settings/page.tsx`

**Step 1: Add active sessions section**

1. Import `ActiveSessions` from `@/components/settings/active-sessions`
2. Import `cookies` from `next/headers`
3. Read the `plexease_session_id` cookie value
4. Add a new section below the existing `ProfileSettings` div (after line 33), with:
   - A heading: "Active Sessions"
   - A subtitle: "Manage devices signed in to your account."
   - The `ActiveSessions` component, passing `currentSessionId`

```tsx
<div className="mt-12 max-w-lg">
  <h2 className="font-heading text-xl font-bold text-white">Active Sessions</h2>
  <p className="mt-2 text-muted-400">
    Manage devices signed in to your account.
  </p>
  <div className="mt-4">
    <ActiveSessions currentSessionId={sessionId ?? ""} />
  </div>
</div>
```

**Step 2: Commit**

```bash
git add app/(dashboard)/settings/page.tsx
git commit -m "feat: add active sessions section to settings page"
```

---

## Task 8: Session Expired Login Toast

**Files:**
- Modify: `app/(auth)/login/page.tsx` (or wherever the login form component lives)

**Step 1: Find and update the login page**

Check `app/(auth)/login/page.tsx` for the login page. Add logic to detect `?reason=session_expired` search param and show a toast:

```typescript
// In the client component or via a Suspense-wrapped search params reader
if (searchParams.get("reason") === "session_expired") {
  toast("You were signed out because another device signed in. You can manage active sessions in Settings.", { id: "session-expired" });
}
```

Use the existing `sonner` toast pattern already in the codebase.

**Step 2: Commit**

```bash
git add app/(auth)/login/
git commit -m "feat: show toast on login page when session was expired by another device"
```

---

## Task 9: Feedback Library

**Files:**
- Create: `lib/feedback.ts`

**Step 1: Create feedback helpers**

Create `lib/feedback.ts` with:

- `submitFeedback(params: { userId: string; text: string; triggerType: "fifth_use" | "cancellation" | "manual"; toolName?: string; persona: string; tier: string }): Promise<void>` — inserts into `feedback` table via service client
- `dismissFeedbackTrigger(userId: string, triggerType: "fifth_use" | "cancellation"): Promise<void>` — inserts into `feedback_dismissals` via service client
- `getFeedbackStatus(userId: string, totalUsage: number): Promise<{ showFifthUseCard: boolean }>` — checks if total usage >= 5, if `fifth_use` trigger is not dismissed, and if user hasn't already submitted `fifth_use` feedback. Returns whether to show the card. Uses service client.

**Step 2: Commit**

```bash
git add lib/feedback.ts
git commit -m "feat: add feedback library with submit, dismiss, and status helpers"
```

---

## Task 10: Feedback API Routes

**Files:**
- Create: `app/api/feedback/route.ts`
- Create: `app/api/feedback/dismiss/route.ts`
- Create: `app/api/feedback/status/route.ts`

**Step 1: Create POST /api/feedback**

Authenticate user via Supabase. Read `{ text, trigger_type, tool_name }` from request body. Validate:
- `text` is a non-empty string, max 2000 chars
- `trigger_type` is one of `fifth_use`, `cancellation`, `manual`
- `tool_name` is optional string

Resolve persona via `resolvePersona()` (import from `lib/utils`). Get user's plan via `getUserPlan()`. Call `submitFeedback()`. Return `{ success: true }`.

**Step 2: Create POST /api/feedback/dismiss**

Authenticate user. Read `{ trigger_type }` from body. Validate `trigger_type` is `fifth_use` or `cancellation`. Call `dismissFeedbackTrigger()`. Return `{ success: true }`.

**Step 3: Create GET /api/feedback/status**

Authenticate user. Get total monthly usage (same pattern as `lib/api-helpers.ts` lines 34-40 — query usage table, sum counts). Call `getFeedbackStatus(userId, totalUsage)`. Return `{ showFifthUseCard: boolean }`.

**Step 4: Commit**

```bash
git add app/api/feedback/route.ts app/api/feedback/dismiss/route.ts app/api/feedback/status/route.ts
git commit -m "feat: add feedback API routes (submit, dismiss, status)"
```

---

## Task 11: Inline Feedback Card Component

**Files:**
- Create: `components/feedback/inline-feedback-card.tsx`

**Step 1: Build the inline feedback card**

Create a client component that:

1. Accepts `toolName: string` prop
2. Has internal state: `text` (string), `submitted` (boolean), `dismissed` (boolean), `loading` (boolean)
3. On submit: POST to `/api/feedback` with `{ text, trigger_type: "fifth_use", tool_name: toolName }`. Set `submitted = true` on success. Show toast "Thanks for the feedback!"
4. On dismiss: POST to `/api/feedback/dismiss` with `{ trigger_type: "fifth_use" }`. Set `dismissed = true`.
5. If `submitted` or `dismissed`, render nothing (return null)

UI:
```
<div className="mt-6 rounded-lg border border-brand-500/30 bg-brand-500/10 p-4">
  <div className="flex items-start justify-between">
    <p className="text-sm text-brand-300">Quick thought? Help us improve — totally optional</p>
    <button onClick={handleDismiss} className="text-muted-500 hover:text-muted-300" aria-label="Dismiss">×</button>
  </div>
  <div className="mt-3 flex gap-2">
    <input type="text" value={text} onChange={...} placeholder="What could be better?" maxLength={2000}
      className="flex-1 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-white placeholder-muted-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
    <button onClick={handleSubmit} disabled={!text.trim() || loading}
      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">
      {loading ? "..." : "Send"}
    </button>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add components/feedback/inline-feedback-card.tsx
git commit -m "feat: add inline feedback card component for 5th-use trigger"
```

---

## Task 12: Feedback Hook

**Files:**
- Create: `hooks/use-feedback.ts`

**Step 1: Create the useFeedback hook**

Create a client-side hook:

```typescript
import { useState, useEffect } from "react";

export function useFeedback() {
  const [showFifthUseCard, setShowFifthUseCard] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/feedback/status");
        if (res.ok) {
          const data = await res.json();
          setShowFifthUseCard(data.showFifthUseCard);
        }
      } catch {
        // Silently fail — feedback is non-critical
      } finally {
        setChecked(true);
      }
    }
    check();
  }, []);

  return { showFifthUseCard, checked };
}
```

This hook is called once per tool form mount. The `checked` flag prevents rendering the card before the status is known (avoids flash).

**Step 2: Commit**

```bash
git add hooks/use-feedback.ts
git commit -m "feat: add useFeedback hook for 5th-use card visibility"
```

---

## Task 13: Integrate Feedback Card into Tool Forms

**Files:**
- Modify: All 18 tool form components in `components/tools/*/`

**Step 1: Add feedback card to tool forms**

For each tool form component (e.g. `components/tools/tool-finder/advisor-form.tsx`), add:

1. Import `useFeedback` from `@/hooks/use-feedback`
2. Import `InlineFeedbackCard` from `@/components/feedback/inline-feedback-card`
3. Call `const { showFifthUseCard } = useFeedback();` at the top of the component
4. After the result renders (inside the `{result && (...)}` block, after `WorkflowNext`), add:

```tsx
{showFifthUseCard && <InlineFeedbackCard toolName="tool-finder" />}
```

Use the appropriate tool name constant for each form (e.g. `TOOL_NAME_TOOL_FINDER` from constants).

The pattern across all 18 forms is the same — find the `{result && (...)}` JSX block and add the feedback card at the end.

**Tool forms to update (18 total):**
- `components/tools/tool-finder/advisor-form.tsx`
- `components/tools/integration-blueprint/planner-form.tsx`
- `components/tools/tool-planner/planner-form.tsx`
- `components/tools/connection-map/map-form.tsx`
- `components/tools/code-generator/generator-form.tsx`
- `components/tools/api-wrapper-generator/generator-form.tsx`
- `components/tools/integration-setup/setup-form.tsx`
- `components/tools/webhook-builder/builder-form.tsx`
- `components/tools/auth-guide/guide-form.tsx`
- `components/tools/workflow-builder/builder-form.tsx`
- `components/tools/error-resolver/explainer-form.tsx`
- `components/tools/how-it-works/explainer-form.tsx`
- `components/tools/troubleshooter/troubleshooter-form.tsx`
- `components/tools/what-changed/change-form.tsx`
- `components/tools/compatibility-check/audit-form.tsx`
- `components/tools/connection-health-check/checker-form.tsx`
- `components/tools/upgrade-assistant/assistant-form.tsx`
- `components/tools/unit-test-generator/generator-form.tsx`

**Step 2: Commit**

```bash
git add components/tools/
git commit -m "feat: integrate 5th-use feedback card into all 18 tool forms"
```

---

## Task 14: Persistent Feedback Button in Sidebar

**Files:**
- Create: `components/feedback/feedback-button.tsx`
- Modify: `components/dashboard/sidebar.tsx:123-141`

**Step 1: Build the persistent feedback button component**

Create a client component:

1. Internal state: `open` (boolean), `text` (string), `loading` (boolean)
2. When closed: render a small "Feedback" button styled to match sidebar links
3. When open: render a slide-out panel (absolute positioned from the sidebar) or a modal with:
   - Title: "How can we improve?"
   - Text input (textarea, max 2000 chars)
   - "Send" button + "Cancel" button
4. On send: POST to `/api/feedback` with `{ text, trigger_type: "manual" }`. Show toast "Thanks for the feedback!", close panel, reset text
5. On cancel: close panel, reset text

Style the button to match sidebar footer items (lines 123-141): `text-muted-400 hover:bg-surface-800 hover:text-white` text style, same padding.

For the panel/modal: use a fixed overlay with `bg-surface-900 border border-surface-700 rounded-lg p-5` styling, positioned above or beside the sidebar.

**Step 2: Add feedback button to sidebar**

In `components/dashboard/sidebar.tsx`, import `FeedbackButton` and add it in the bottom section (between "Manage cookies" button and `SignOutButton`, around line 139):

```tsx
<FeedbackButton />
```

**Step 3: Commit**

```bash
git add components/feedback/feedback-button.tsx components/dashboard/sidebar.tsx
git commit -m "feat: add persistent feedback button to sidebar"
```

---

## Task 15: Cancellation Feedback — Webhook Flag

**Files:**
- Modify: `app/api/stripe/webhook/route.ts:174-208`

**Step 1: Set cancellation feedback flag in webhook**

In the `handleSubscriptionUpdated` function (line 174), after the existing `.update()` call (lines 194-203), add a check: if `verified.cancel_at_period_end` is `true`, set `show_cancellation_feedback` to `true` in the same update (add it to the update object).

Update the `.update()` call to include:

```typescript
const { error } = await supabase
  .from("subscriptions")
  .update({
    status,
    ...(plan && { plan }),
    ...(priceId && { stripe_price_id: priceId }),
    current_period_end: new Date(verified.items.data[0].current_period_end * 1000).toISOString(),
    cancel_at_period_end: verified.cancel_at_period_end,
    ...(verified.cancel_at_period_end && { show_cancellation_feedback: true }),
  })
  .eq("user_id", userId);
```

**Step 2: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat: set cancellation feedback flag in Stripe webhook handler"
```

---

## Task 16: Cancellation Feedback Page

**Files:**
- Create: `app/(dashboard)/cancelled/page.tsx`
- Create: `components/feedback/cancellation-feedback.tsx`

**Step 1: Build the cancellation feedback form component**

Create `components/feedback/cancellation-feedback.tsx` — a client component:

1. Accepts `periodEnd: string | null` prop (to display when access ends)
2. State: `text` (string), `loading` (boolean), `submitted` (boolean)
3. Renders:
   - Heading: "Sorry to see you go"
   - Subtitle: "Your access continues until {formatted periodEnd date}." (if periodEnd provided)
   - Optional feedback textarea: "What could we have done better?" (max 2000 chars)
   - "Send feedback" button — POSTs to `/api/feedback` with `trigger_type: "cancellation"`
   - "Skip" link — navigates to `/dashboard`
4. On submit success: POST to clear the flag via a new endpoint or inline — redirect to `/dashboard`
5. On skip: call API to clear the flag, redirect to `/dashboard`

For clearing the flag, add a `POST /api/feedback/clear-cancellation` route (or do it inline in the submit handler by calling a dedicated endpoint).

**Step 2: Build the cancellation page**

Create `app/(dashboard)/cancelled/page.tsx` — a server component:

1. Authenticate user, redirect to login if not authenticated
2. Query subscription for `show_cancellation_feedback` and `current_period_end`
3. If `show_cancellation_feedback` is not `true`, redirect to `/dashboard`
4. Render the `CancellationFeedback` component with `periodEnd`

**Step 3: Create clear-cancellation-flag API route**

Create `app/api/feedback/clear-cancellation/route.ts`:

- `POST` handler: authenticate user, update subscription to set `show_cancellation_feedback = false`, return `{ success: true }`

**Step 4: Commit**

```bash
git add app/(dashboard)/cancelled/page.tsx components/feedback/cancellation-feedback.tsx app/api/feedback/clear-cancellation/route.ts
git commit -m "feat: add post-cancellation feedback page with webhook-triggered flag"
```

---

## Task 17: Dashboard Cancellation Redirect

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx`

**Step 1: Add cancellation feedback redirect**

In the dashboard page (after fetching the plan on line 23), check if the subscription has `show_cancellation_feedback = true`:

1. Query the subscriptions table for the user to check `show_cancellation_feedback`
2. If `true`, redirect to `/cancelled`

```typescript
// Check for pending cancellation feedback
const { data: subData } = await supabase
  .from("subscriptions")
  .select("show_cancellation_feedback")
  .eq("user_id", user.id)
  .single();

if (subData?.show_cancellation_feedback) {
  redirect("/cancelled");
}
```

Add this check after the user auth check but before the rest of the data fetching.

**Step 2: Commit**

```bash
git add app/(dashboard)/dashboard/page.tsx
git commit -m "feat: redirect to cancellation feedback page when flag is set"
```

---

## Task 18: Credits Terminology — Billing Components

**Files:**
- Modify: `components/billing/usage-counter.tsx:14` — "uses" → "credits"
- Modify: `components/billing/usage-card.tsx:52` — "Lookups used this month" → "Credits used this month"
- Modify: `components/billing/feature-comparison.tsx:4` — "Tool uses" → "Monthly credits"

**Step 1: Update usage counter**

In `components/billing/usage-counter.tsx` line 14, change:
```
{usageCount}/{limit} uses
```
to:
```
{usageCount}/{limit} credits
```

**Step 2: Update usage card**

In `components/billing/usage-card.tsx` line 52, change:
```
Lookups used this month
```
to:
```
Credits used this month
```

**Step 3: Update feature comparison**

In `components/billing/feature-comparison.tsx` line 4, change:
```
{ name: "Tool uses", ...
```
to:
```
{ name: "Monthly credits", ...
```

**Step 4: Commit**

```bash
git add components/billing/usage-counter.tsx components/billing/usage-card.tsx components/billing/feature-comparison.tsx
git commit -m "feat: rename 'uses' to 'credits' in billing components"
```

---

## Task 19: Credits Terminology — Pricing Pages

**Files:**
- Modify: `app/(dashboard)/upgrade/upgrade-content.tsx:75,85,103` — "tool uses" → "credits"
- Modify: `components/landing/pricing-section.tsx:46,56,67` — "tool uses" → "credits"

**Step 1: Update upgrade page**

In `upgrade-content.tsx`, update all three PricingCard feature arrays. Change every occurrence of `tool uses per month` to `credits per month`:
- Line 75: `` `${FREE_MONTHLY_LIMIT} tool uses per month` `` → `` `${FREE_MONTHLY_LIMIT} credits per month` ``
- Line 85: `` `${ESSENTIALS_MONTHLY_LIMIT} tool uses per month` `` → `` `${ESSENTIALS_MONTHLY_LIMIT} credits per month` ``
- Line 103: `` `${PRO_MONTHLY_LIMIT} tool uses per month` `` → `` `${PRO_MONTHLY_LIMIT} credits per month` ``

**Step 2: Update landing page pricing**

In `pricing-section.tsx`, same change:
- Line 46: `tool uses per month` → `credits per month`
- Line 56: `tool uses per month` → `credits per month`
- Line 67: `tool uses per month` → `credits per month`

**Step 3: Commit**

```bash
git add app/(dashboard)/upgrade/upgrade-content.tsx components/landing/pricing-section.tsx
git commit -m "feat: rename 'tool uses' to 'credits' on pricing pages"
```

---

## Task 20: Credits Terminology — Tool Forms & Shared Components

**Files:**
- Modify: `components/shared/limit-reached-card.tsx:5` — update limit message
- Modify: All 18 tool form components — update usage display text

**Step 1: Update limit reached card**

In `components/shared/limit-reached-card.tsx` line 5, change:
```
You&apos;ve reached your monthly usage limit.
```
to:
```
You&apos;ve used all your credits for this month.
```

**Step 2: Update tool form usage text**

Each tool form has a line like (e.g. `advisor-form.tsx` line 132):
```
{currentUsage} of {limit} lookups used this month
```

Update all 18 forms to use:
```
{currentUsage} of {limit} credits used this month
```

The exact text varies slightly per form ("lookups", "uses", etc.) — search for the pattern and standardise to "credits used this month".

**Step 3: Commit**

```bash
git add components/shared/limit-reached-card.tsx components/tools/
git commit -m "feat: rename usage terminology to 'credits' across tool forms"
```

---

## Task 21: Enterprise Callout on Upgrade Page

**Files:**
- Create: `components/billing/enterprise-callout.tsx`
- Modify: `app/(dashboard)/upgrade/upgrade-content.tsx`

**Step 1: Build the Enterprise callout component**

Create `components/billing/enterprise-callout.tsx`:

```tsx
export function EnterpriseCallout() {
  return (
    <div className="rounded-lg border border-surface-700 bg-surface-900/50 p-6 text-center">
      <h3 className="font-heading text-lg font-semibold text-white">Need more?</h3>
      <p className="mt-2 text-sm text-muted-400">
        Enterprise plans offer custom credit limits, team accounts, and dedicated support.
      </p>
      <a
        href="mailto:hello@plexease.io"
        className="mt-4 inline-block rounded-lg border border-brand-500 px-5 py-2.5 text-sm font-medium text-brand-400 hover:bg-brand-500/10 transition-colors"
      >
        Contact us
      </a>
    </div>
  );
}
```

**Step 2: Add to upgrade page**

In `upgrade-content.tsx`, import `EnterpriseCallout` and add it after the trust signal paragraph (after line 122):

```tsx
{/* Enterprise callout */}
<div className="mt-8">
  <EnterpriseCallout />
</div>
```

**Step 3: Commit**

```bash
git add components/billing/enterprise-callout.tsx app/(dashboard)/upgrade/upgrade-content.tsx
git commit -m "feat: add Enterprise callout banner to upgrade page"
```

---

## Task 22: Final Integration & Smoke Test

**Step 1: Run the dev server**

```bash
cd /home/deck/Projects/plexease && npm run dev
```

**Step 2: Manual verification checklist**

- [ ] Login creates a session (check `sessions` table in Supabase)
- [ ] Session cookie `plexease_session_id` is set after login
- [ ] Settings page shows "Active Sessions" section with current device
- [ ] "Sign out all other devices" button works
- [ ] Sidebar shows "Feedback" button
- [ ] Clicking "Feedback" opens a panel/modal
- [ ] Submitting feedback creates a row in `feedback` table
- [ ] Usage counter shows "credits" not "uses"
- [ ] Upgrade page shows Enterprise callout below pricing cards
- [ ] Feature comparison says "Monthly credits"
- [ ] Landing page pricing says "credits per month"
- [ ] Tool forms say "credits used this month"
- [ ] Limit reached card says "credits"

**Step 3: Run existing tests**

```bash
npm test
```

Verify all 125 existing tests still pass. Fix any text-matching assertions broken by the "uses" → "credits" rename.

**Step 4: Fix any broken test assertions**

Tests that assert on "uses" text will need updating to "credits". Search test files for "uses" and update matches. Key files to check:
- `playwright/tests/fast/usage-limits.spec.ts`
- `playwright/tests/fast/dashboard.spec.ts`
- Any test that checks pricing card text or usage counter text

**Step 5: Commit fixes**

```bash
git add .
git commit -m "fix: update test assertions for uses→credits rename"
```

---

## Task 23: Update PLEXEASE.md

**Files:**
- Modify: `PLEXEASE.md`

**Step 1: Update current status and phase tracking**

- Move Phase 10 to ✅ completed
- Update "Current Status" section with Phase 10 deliverables
- Update the database schema section to include `raw_user_agent` on sessions and `show_cancellation_feedback` on subscriptions
- Add Phase 10 to the completed phases list with summary
- Update "Next step" to Phase 11

**Step 2: Commit**

```bash
git add PLEXEASE.md
git commit -m "docs: update PLEXEASE.md for Phase 10 completion"
```
