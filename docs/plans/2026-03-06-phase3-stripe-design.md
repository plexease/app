# Phase 3 — Stripe Monetisation Design

> Validated design for Plexease Phase 3. Source of truth for the build session.

---

## 1. Overview

**Approach:** Stripe-First. Stripe owns billing state, Supabase mirrors it via webhooks.

**Key Principle:** Never update the database optimistically. Only mark a user as Pro when webhook confirmation arrives from Stripe.

**Stripe Products (create in test mode, then live):**
- Product: "Plexease Pro"
- Price 1: GBP 19/month (monthly)
- Price 2: GBP 190/year (annual — save GBP 38)

**Hosted surfaces:**
- Stripe Checkout — payment collection
- Stripe Customer Portal — manage subscription, update card, view invoices, cancel

**No free trial.** The Free tier (20 uses/month) serves as the trial.

---

## 2. Database Changes

### 2.1 New columns on `subscriptions`

| Column | Type | Default | Purpose |
|---|---|---|---|
| `current_period_end` | timestamptz | null | When the current billing period ends |
| `cancel_at_period_end` | boolean | false | User has cancelled but access continues |
| `grace_period_end` | timestamptz | null | 1 day after `current_period_end` when cancelled |

### 2.2 Unique partial index

Prevents double active subscriptions at the database level:

```sql
CREATE UNIQUE INDEX one_active_sub_per_user
ON subscriptions (user_id)
WHERE status = 'active';
```

### 2.3 New table: `processed_events`

Deduplication for webhook events:

```sql
CREATE TABLE processed_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 No other schema changes

`users.stripe_customer_id` and `subscriptions.stripe_subscription_id` already exist.

---

## 3. Shared Modules

### 3.1 `lib/stripe.ts` — Stripe client

- Initialise Stripe client with `STRIPE_SECRET_KEY`
- Env var validation at startup: fail fast if `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are missing
- Test/live mode safeguard: verify key prefix matches environment (`sk_test_` in dev, `sk_live_` in prod)

### 3.2 `lib/subscription.ts` — Shared billing logic

Holistic module — all plan/billing queries go through here. Every tool route uses these instead of inline queries.

**Functions:**

- `getUserPlan(userId)` — Returns `{ plan, status, currentPeriodEnd, cancelAtPeriodEnd, gracePeriodEnd }`
- `isProUser(userId)` — Returns boolean. True if: plan=pro AND (status=active OR now < gracePeriodEnd)
- `getOrCreateStripeCustomer(userId, email)` — Checks `users.stripe_customer_id`. If exists, returns it. If not, creates Stripe Customer, saves ID to Supabase, then returns it. Customer creation and DB save happen before any Checkout session is created.
- `reconcileSubscription(userId, stripeCustomerId)` — Queries Stripe for active subscriptions, compares against Supabase, auto-corrects mismatches

### 3.3 `lib/constants.ts` — New constants

```typescript
export const STRIPE_PRICE_ID_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!
export const STRIPE_PRICE_ID_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!
export const GRACE_PERIOD_DAYS = 1
export const USAGE_WARNING_THRESHOLD = 15  // 75% — amber state
export const USAGE_DANGER_THRESHOLD = 19   // 95% — red state
export const CHECKOUT_POLL_INTERVAL_MS = 2000
```

---

## 4. Checkout Flow

### 4.1 Upgrade entry points (4 locations)

1. **`/upgrade` page** — Dedicated upgrade page for logged-in users
2. **Dashboard sidebar** — "Free Plan — Upgrade" link next to tier badge
3. **NuGet Advisor usage limit prompt** — Existing CTA, updated to point to `/upgrade`
4. **Landing page Pro card** — If logged in: link to `/upgrade`. If not: link to `/signup`

### 4.2 The flow

1. User visits `/upgrade` — sees monthly/annual toggle, pricing cards, feature comparison, FAQ
2. User clicks "Subscribe" — hits `POST /api/stripe/checkout`
3. API route:
   - Verifies auth (`getUser()`) — 401 if not logged in
   - Checks CSRF (Origin/Referer header matches domain)
   - Checks current plan (`getUserPlan()`) — returns `{ alreadyPro: true }` if already Pro
   - Calls `getOrCreateStripeCustomer()` — creates Stripe Customer if needed, saves ID to Supabase BEFORE creating session
   - Creates Stripe Checkout session with:
     - `metadata: { supabase_user_id: user.id }`
     - `subscription_data.metadata: { supabase_user_id: user.id }`
     - Selected price ID (monthly or annual)
     - `success_url: /upgrade/success?session_id={CHECKOUT_SESSION_ID}`
     - `cancel_url: /upgrade?cancelled=true`
   - Returns session URL
4. Frontend redirects to Stripe Checkout (button disables on click)
5. **If user completes payment** — Stripe redirects to `/upgrade/success?session_id=...`
   - Success page shows "Setting up your Pro account..."
   - Polls `getUserPlan()` every 2 seconds
   - Once confirmed Pro — auto-redirects to dashboard with celebratory toast
   - If not confirmed after ~30 seconds — shows "Contact support" message
6. **If user cancels/abandons** — Stripe redirects to `/upgrade?cancelled=true`
   - Toast: "No worries — you can upgrade anytime."
   - Checkout session expires after 24 hours, no database changes

### 4.3 Checkout failure scenarios

| # | Scenario | Recovery |
|---|---|---|
| 1 | Stripe API is down | Catch error, toast "Payment service temporarily unavailable. Please try again." |
| 2 | User's Supabase session expired | Redirect to `/login?next=/upgrade` |
| 3 | Stripe Customer created but Supabase save fails | No checkout session created. Next attempt: step 1 checks `users.stripe_customer_id` — finds it if previous save partially succeeded, or creates new one. Safe either way. |
| 4 | Checkout session created but user never pays | Session expires after 24 hours. No database changes. |
| 5 | Webhook arrives but Supabase update fails | Return non-200 from webhook handler. Stripe retries for up to 3 days. Handler is idempotent. |
| 6 | User double-clicks Subscribe | Button disables on click + server checks plan status + Stripe won't create duplicate subscription for same customer/price + DB unique index rejects second active subscription |

---

## 5. Webhook Handling

### 5.1 Single endpoint

`POST /api/stripe/webhook` — handles all Stripe events.

### 5.2 Security layers

- Signature verification via `stripe.webhooks.constructEvent()`
- HTTP method enforcement — reject non-POST
- Request body size limit (64KB)
- Basic rate limiting
- Verify subscription status against Stripe API before updating Supabase
- Log every event: event ID, type, outcome (no PII in logs)
- Check `processed_events` table before processing; insert after. Skip duplicates.

### 5.3 Events handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Look up user via `metadata.supabase_user_id`. Upsert subscription: plan=pro, status=active. Store `stripe_subscription_id` and `current_period_end`. |
| `customer.subscription.updated` | Update `status`, `current_period_end`, `cancel_at_period_end`. Handles renewals, plan switches (monthly/annual via portal), and cancellation scheduling. |
| `customer.subscription.deleted` | Subscription fully ended. Set `grace_period_end` to `current_period_end + 1 day`. |
| `invoice.payment_failed` | Update subscription status to `past_due`. User keeps Pro access while Stripe retries. |

### 5.4 Idempotency

All operations are upserts. The `processed_events` table provides guaranteed deduplication. Processing the same event twice produces the same result.

---

## 6. Cancellation & Grace Period

### 6.1 Cancellation flow

1. User clicks "Manage Subscription" — redirected to Stripe Customer Portal
2. User cancels in portal — Stripe sets `cancel_at_period_end = true`
3. Webhook `customer.subscription.updated` fires — we update Supabase: `cancel_at_period_end = true`
4. User keeps Pro access until `current_period_end`
5. At period end, Stripe fires `customer.subscription.deleted` — we set `grace_period_end = current_period_end + 1 day`
6. During grace period, `isProUser()` still returns true
7. After grace period, `isProUser()` returns false — user sees free tier

### 6.2 Resubscribe flow

- **During paid period (cancel_at_period_end = true, subscription still active):**
  - "Resubscribe" button hits `POST /api/stripe/resubscribe`
  - Calls `stripe.subscriptions.update(subId, { cancel_at_period_end: false })`
  - No re-entering card details, instant reactivation
  - Webhook updates Supabase: `cancel_at_period_end = false`

- **After grace period expired (subscription fully ended):**
  - "Resubscribe" button goes to `/upgrade` — full checkout flow, new subscription

### 6.3 Downgrade behaviour

Usage count is preserved. If a user has used 35 tools this month and downgrades, they are immediately over the 20 free limit.

### 6.4 Failed payment handling

- Stripe auto-retries (Smart Retries — typically 3 attempts over a few weeks, configurable in Stripe Dashboard)
- User keeps Pro access during retry period
- Non-dismissible red banner: "Payment failed. Please update your payment method." with link to Customer Portal
- If all retries fail, Stripe cancels the subscription — same cancellation + grace period flow applies

---

## 7. Dashboard UX

### 7.1 Tier badge (sidebar)

- Free users: subtle badge (`bg-gray-700 text-gray-300` — "Free") + "Upgrade" link
- Pro users: accent badge (`bg-blue-600 text-white` — "Pro")
- Badge shows "Pro" only — not "Pro (Monthly)" or "Pro (Annual)"

### 7.2 Usage counter

**Free users — sidebar:**
- Compact text: "3/20 uses" below tier badge

**Free users — dashboard card:**
- Progress bar with colour states:
  - Green (0-14 / 0-70%): plenty of room
  - Amber (15-18 / 75-90%): getting close, subtle upgrade nudge appears
  - Red (19-20 / 95-100%): nearly/fully used, prominent upgrade CTA

**Pro users:**
- Sidebar: "Unlimited"
- Dashboard card: "Unlimited" with Pro badge, no progress bar

### 7.3 Subscription status (Pro users)

- Dashboard card: "Pro — renews 6 April" (or "Pro (Annual) — renews 6 March 2027")
- "Manage Subscription" link — Stripe Customer Portal

### 7.4 Cancellation banners

| State | Style | Message | Dismissible? |
|---|---|---|---|
| Cancelled, in paid period | Amber | "Your Pro plan is cancelled. Access continues until [date]." + Resubscribe button | Yes (reappears each session) |
| In grace period (1 day) | Red | "Your Pro access expires tomorrow. Resubscribe to keep unlimited access." + Resubscribe button | Yes (reappears each session) |
| Grace expired | None | User sees free tier UI (badge, usage counter, limits) | N/A |

### 7.5 Failed payment banner

- Red, non-dismissible while `status = past_due`
- "Payment failed. Please update your payment method." + link to Customer Portal

### 7.6 Already-Pro toast

- If a Pro user somehow hits the checkout endpoint: toast "You're already on Pro!"

### 7.7 Reconciliation on login

- When user logs in and has a `stripe_customer_id`, query Stripe for active subscriptions
- Compare against Supabase record
- Auto-correct any mismatches (e.g. lost webhook)

---

## 8. Landing Page & Upgrade Page

### 8.1 Landing page pricing updates

- Monthly/annual toggle switch
- Monthly view: Free (GBP 0) and Pro (GBP 19/mo)
- Annual view: Free (GBP 0) and Pro (GBP 190/year) with "GBP 15.83/mo — save GBP 38" subtitle
- Pro CTA: if logged in — link to `/upgrade`. If not — link to `/signup`
- Update CTA text from "Start free trial" to "Upgrade to Pro"
- Mobile responsive — cards stack vertically, toggle works on touch

### 8.2 `/upgrade` page (new, authenticated only)

- Monthly/annual toggle (shared component with landing page)
- Pricing cards with feature comparison
- "Subscribe" button — hits `POST /api/stripe/checkout` with selected price
- Button disables on click
- If already Pro — redirect to dashboard with toast

**Feature comparison table:**

| Feature | Free | Pro |
|---|---|---|
| Tool uses | 20/month | Unlimited |
| All available tools | Yes | Yes |
| Saved history | No | Yes |
| Priority AI responses | No | Yes |

**Additional UX elements:**
- "Best value" badge on annual card
- Stripe trust badge: "Powered by Stripe — secure payments"
- Current usage reminder for free users: "You've used 17 of 20 free uses this month"
- Animated price transition on toggle (count up/down or fade)
- FAQ section (4 questions):
  1. "Can I cancel anytime?" — Yes, keep access until billing period ends + 1 day grace.
  2. "What happens to my usage if I downgrade?" — Existing count preserved, free limits apply.
  3. "Can I switch between monthly and annual?" — Yes, via Manage Subscription with proration.
  4. "Is my payment secure?" — Payments processed by Stripe. We never see your card details.

### 8.3 Logged-in user on landing page

- If Free — Pro CTA says "Upgrade to Pro" linking to `/upgrade`
- If Pro — Pro CTA says "Your current plan" (disabled/muted)

---

## 9. New Files & Modules

### API Routes
- `app/api/stripe/checkout/route.ts` — Create Checkout session (POST only)
- `app/api/stripe/portal/route.ts` — Create Customer Portal session (POST only)
- `app/api/stripe/webhook/route.ts` — Handle Stripe webhooks (POST only)
- `app/api/stripe/resubscribe/route.ts` — Un-cancel active subscription (POST only)

### Pages
- `app/(dashboard)/upgrade/page.tsx` — Upgrade page
- `app/(dashboard)/upgrade/success/page.tsx` — Post-checkout polling page

### Shared Modules
- `lib/stripe.ts` — Stripe client, env validation, mode safeguard
- `lib/subscription.ts` — `getUserPlan()`, `isProUser()`, `getOrCreateStripeCustomer()`, `reconcileSubscription()`

### Components
- `components/billing/pricing-toggle.tsx` — Monthly/annual switch (shared)
- `components/billing/pricing-card.tsx` — Reusable pricing card
- `components/billing/feature-comparison.tsx` — Side-by-side table
- `components/billing/faq-section.tsx` — Upgrade page FAQ
- `components/billing/cancellation-banner.tsx` — 3-state dismissible banner
- `components/billing/payment-failed-banner.tsx` — Non-dismissible past_due warning
- `components/billing/tier-badge.tsx` — Free/Pro badge for sidebar
- `components/billing/usage-counter.tsx` — Sidebar compact counter
- `components/billing/usage-card.tsx` — Dashboard card with progress bar

### Updated Files
- `app/page.tsx` — Landing page pricing (toggle, smart CTA)
- `components/dashboard/sidebar.tsx` — Tier badge, usage counter, upgrade link
- `lib/constants.ts` — Stripe price IDs, thresholds, grace period
- `app/(dashboard)/tools/nuget-advisor/page.tsx` — Updated upgrade prompt link

### Database Migrations
- Add `current_period_end`, `cancel_at_period_end`, `grace_period_end` to `subscriptions`
- Add unique partial index `one_active_sub_per_user`
- Create `processed_events` table

---

## 10. Security Summary

| # | Measure | Detail |
|---|---|---|
| 1 | Webhook signature verification | `stripe.webhooks.constructEvent()` on every webhook |
| 2 | Server-side plan checks only | `getUserPlan()` / `isProUser()` in `lib/subscription.ts`, never trust client |
| 3 | Checkout metadata | `supabase_user_id` on both session and subscription metadata |
| 4 | Idempotent webhooks + deduplication | Upserts + `processed_events` table with Stripe event ID |
| 5 | Authenticated checkout | `getUser()` check before creating any Stripe session |
| 6 | Plan verification before checkout | Reject checkout if already Pro |
| 7 | Double subscription prevention | Button disable + server check + Stripe protection + DB unique index |
| 8 | Customer portal auth | `stripe_customer_id` looked up server-side from authenticated user |
| 9 | Webhook endpoint rate limiting | Basic rate limiting on `/api/stripe/webhook` |
| 10 | Restricted Stripe API key | Only permissions: Checkout, Portal, Customers, Subscriptions, Webhooks |
| 11 | Webhook event logging | Event ID, type, outcome — no PII |
| 12 | Reconciliation on login | Compare Stripe vs Supabase, auto-correct mismatches |
| 13 | Verify before update | Webhook confirms subscription status with Stripe API before DB update |
| 14 | Never update optimistically | Only mark Pro on webhook confirmation |
| 15 | CSRF protection | Origin/Referer header check on billing endpoints |
| 16 | Env var validation | Fail fast if Stripe keys missing at startup |
| 17 | Test/live mode safeguard | Verify key prefix matches environment |
| 18 | HTTP method enforcement | Reject non-POST on all billing endpoints |
| 19 | Body size limit on webhook | 64KB max to prevent abuse |

---

## 11. Test Matrices (Phase 4 Reference)

### 11.1 Security Test Matrix

| # | Security Feature | Test |
|---|---|---|
| 1 | Webhook signature verification | Reject unsigned/tampered payloads |
| 2 | Server-side plan checks | Client cannot spoof Pro status |
| 3 | Authenticated checkout | 401 for unauthenticated requests |
| 4 | Already-Pro rejection | Cannot create checkout when already subscribed |
| 5 | Double subscription DB constraint | Unique index rejects second active sub |
| 6 | Portal auth | Cannot access another user's portal |
| 7 | CSRF on billing endpoints | Reject cross-origin requests |
| 8 | HTTP method enforcement | Reject non-POST on all billing endpoints |
| 9 | Body size limit on webhook | Reject oversized payloads |
| 10 | Env var validation | Fail fast if Stripe keys missing |
| 11 | Test/live mode safeguard | Reject mismatched key prefix for environment |
| 12 | Idempotent webhooks | Same event processed twice = same result |
| 13 | Reconciliation on login | Mismatch between Stripe and Supabase auto-corrects |
| 14 | Rate limiting on webhook | Excessive requests are throttled |

### 11.2 Payment Test Matrix

| # | Payment Scenario | Test |
|---|---|---|
| 1 | Successful monthly checkout | Free user checkout with webhook confirms Pro, usage unlimited |
| 2 | Successful annual checkout | Free user annual checkout confirms Pro, correct period end |
| 3 | Checkout cancelled/abandoned | User backs out, stays Free, no DB changes, toast shown |
| 4 | Subscription renewal | Monthly renewal webhook updates `current_period_end`, stays Pro |
| 5 | Failed payment | `invoice.payment_failed` sets `past_due`, user keeps Pro, banner shown |
| 6 | Failed payment recovery | Payment succeeds on retry, status back to `active`, banner gone |
| 7 | All retries fail | Subscription cancelled by Stripe, grace period, downgrade to Free |
| 8 | User cancels (in period) | `cancel_at_period_end = true`, Pro access continues, cancellation banner |
| 9 | User cancels (period ends) | Subscription deleted, grace period starts, grace banner shown |
| 10 | Grace period expires | 1 day after period end, `isProUser()` returns false, free tier enforced |
| 11 | Resubscribe during paid period | Un-cancel, `cancel_at_period_end = false`, banner gone, stays Pro |
| 12 | Resubscribe after grace expired | Full checkout flow, new subscription created |
| 13 | Plan switch monthly to annual | Via Customer Portal, webhook updates price/period, stays Pro |
| 14 | Plan switch annual to monthly | Via Customer Portal, webhook updates, proration by Stripe |
| 15 | Double checkout attempt | Second request rejected, "Already on Pro" toast |
| 16 | Success page polling | Page polls until webhook lands, then redirects to dashboard |
| 17 | Success page timeout | Webhook not received after ~30s, show "Contact support" |
| 18 | Downgrade usage preservation | User with 35 uses downgrades, immediately over free limit |
| 19 | Stripe Customer reuse | Returning user resubscribes, same `stripe_customer_id` reused |
| 20 | Webhook Stripe API verification | Handler confirms subscription with Stripe before updating DB |

---

## 12. Future Phases (Updated)

### Phase 5 — Branding
- Logo, colour palette, typography
- Consistent component styling
- Favicon, OG images

### Phase 6 — Marketing & Trust
- Security/trust page — aggregate all security features into a client-facing page
- Custom branded welcome email (Resend/SendGrid) — deferred from Phase 3
- Landing page polish, SEO basics

### Future action item
- Revisit Phase 1 with same in-depth design process (password reset, error pages, cookie consent, loading states)

---

## 13. Decisions Log

| Decision | Choice | Reasoning |
|---|---|---|
| Checkout type | Stripe Checkout (hosted) | Least code, PCI handled, battle-tested |
| Billing management | Stripe Customer Portal | No custom billing UI needed |
| Cancellation policy | Access until period end + 1 day grace | Fair, builds goodwill, bounded |
| Failed payment handling | Keep Pro during retries, banner warning | Industry standard, most failures auto-recover |
| Free trial | No — Free tier is the trial | 20 uses/month already lets users try the product |
| Billing frequency | Monthly (GBP 19) + Annual (GBP 190) | Annual provides upfront capital |
| Plan switching | Customer Portal only | Stripe handles proration, no custom code |
| Stripe Customer creation | Lazy (at first checkout) | Keeps Stripe account clean |
| Idempotency | Upserts + processed_events table | Belt and braces for billing |
| Invoice emails | Stripe only (custom emails as future enhancement) | Avoids email service dependency at launch |
| Architecture approach | Stripe-First (Approach A) | Stripe owns state, Supabase mirrors via webhooks |
