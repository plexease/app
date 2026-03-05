# Plexease Plan Gap Analysis — Design

## Summary

Review of the existing build phases identified 15 missing items across auth completion, UX fundamentals, API hardening, billing management, CI/CD, and observability. All items are distributed into their natural phases using Approach A (Distributed Integration).

## Updated Build Phases

### Phase 1 — Foundation (Updated)

**Already done:**
- [x] Scaffold Next.js project with TypeScript + Tailwind
- [x] Connect Supabase (create project, add env vars)
- [x] Create database tables (users, subscriptions, usage)
- [x] Implement Supabase Auth (sign up, login, logout)

**Remaining (original):**
- [ ] Build landing page
- [ ] Build dashboard shell with route protection

**New additions:**
- [ ] Password reset flow (forgot password page, Supabase reset email, update password page)
- [ ] Email verification (confirmation page, redirect after verify, resend link)
- [ ] Error pages (custom 404 `not-found.tsx`, 500 `error.tsx`, global error boundary)
- [ ] Loading states (root `loading.tsx`, dashboard skeleton, tool loading spinner)
- [ ] Toast notification system (`sonner` or `react-hot-toast`)
- [ ] Cookie consent banner (accept/reject, store preference, GDPR required)

---

### Phase 2 — First Tool: NuGet Advisor (Updated)

**Original items:**
- [ ] Build NuGet Advisor UI
- [ ] Connect Claude API (`lib/claude.ts`)
- [ ] Implement usage tracking (5/day free limit)
- [ ] Add upgrade prompt when limit reached
- [ ] Test tool end-to-end

**New additions:**
- [ ] Streaming responses — Claude streaming API via server-sent events, real-time result display
- [ ] Response caching — Cache identical queries (package name + version) in Supabase to reduce API costs
- [ ] API rate limiting — Per-user rate limiting on `/api/tools/nuget-advisor` (e.g. `upstash/ratelimit` or sliding window)

---

### Phase 3 — Monetisation (Updated)

**Original items:**
- [ ] Create Stripe products (Free, Pro at 19 GBP/mo)
- [ ] Build checkout flow
- [ ] Handle Stripe webhooks
- [ ] Sync subscription status to Supabase
- [ ] Enforce access control based on plan

**New additions:**
- [ ] Stripe Customer Portal — Manage subscription, update payment, view invoices, cancel
- [ ] Cancellation/downgrade handling — Access until billing period ends, define rules for saved history
- [ ] Subscription edge cases — Handle expired cards, failed payments (`invoice.payment_failed`, `customer.subscription.updated`)

---

### Phase 4 — Testing & CI/CD (Updated)

**Original items:**
- [ ] Set up Playwright
- [ ] Auth flow tests
- [ ] Tool usage tests
- [ ] Stripe checkout tests
- [ ] Usage limit enforcement tests

**New additions:**
- [ ] CI/CD pipeline — GitHub Actions: lint, type-check, build, Playwright on every PR. Block merges on failure
- [ ] Unit/integration tests — Vitest for API routes, usage logic, rate limiting, webhook handlers
- [ ] Staging environment — Vercel preview deployments per PR, separate Supabase project, Stripe test mode keys

---

### Phase 4.5 — Observability (New)

- [ ] Analytics — Plausible or Vercel Analytics (page views, tool usage, conversion funnel)
- [ ] Error tracking — Sentry (client + server errors with context, alerting)
- [ ] Admin dashboard — Protected `/admin` route: user count, subscriptions, revenue, popular queries, error rates
- [ ] SEO basics — Meta tags, Open Graph images, sitemap.xml, robots.txt

---

### Phase 5+ — Additional Tools (Unchanged)

Build out remaining tools per the PLEXEASE.md roadmap.

## Decisions

- **Approach:** Distributed Integration (items added to their natural phase)
- **Toast library:** `sonner` or `react-hot-toast` (decide during implementation)
- **Rate limiting:** `upstash/ratelimit` or in-memory sliding window (decide during implementation)
- **Analytics:** Plausible (privacy-friendly, no cookie consent needed) or Vercel Analytics (decide during Phase 4.5)
- **Unit test framework:** Vitest (fastest, native ESM, works well with Next.js)
