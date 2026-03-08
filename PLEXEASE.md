# Plexease — AI Context File

> Paste this at the start of every Claude Code session to provide full project context.
> Keep this file updated as the project evolves.

---

## What Is Plexease?

Plexease is a SaaS integration toolkit for small businesses, tech support staff, and .NET developers. The tagline is **"complex integrations, with ease"**. It provides a suite of AI-powered tools under a single membership, helping users navigate package management, code generation, e-commerce integrations, and more — without needing deep technical expertise.

---

## Founder Background

- Former QA engineer at Hargreaves Lansdown (fintech)
- Wrote Playwright tests for web applications
- Knows TypeScript / JavaScript
- Previously worked at Shiptheory (shipping integration SaaS)
- UK sole trader (needs to notify HMRC of resumed trading)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (TypeScript) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth |
| Payments | Stripe |
| AI | Anthropic Claude API |
| Testing | Playwright |
| Deployment | Vercel |
| VCS | GitHub (business account) |

---

## Membership Tiers

| Tier | Price | Limits |
|---|---|---|
| Free | £0 | 20 tool uses/month |
| Pro | £19/month | Unlimited, saved history, priority AI |

---

## Database Schema (Supabase)

```sql
users           (id, email, created_at, stripe_customer_id)
subscriptions   (id, user_id, plan, status, stripe_subscription_id)
usage           (id, user_id, tool_name, month, count)
              -- unique constraint on (user_id, tool_name, month)
              -- increment_usage() RPC for atomic upserts
```

---

## Project Structure

```
plexease/
├── app/
│   ├── (auth)/                         # login, signup
│   ├── (dashboard)/                    # main dashboard
│   │   └── tools/                      # all 10 workflow tools + nuget-advisor redirect
│   ├── api/
│   │   ├── auth/                       # Supabase endpoints
│   │   ├── stripe/                     # webhooks & checkout
│   │   └── tools/                      # Claude API routes per tool
│   └── page.tsx                        # landing page
├── components/
│   ├── brand/                         # Logo components (icon, wordmark, combined)
│   ├── auth/                          # Auth forms and headers
│   ├── billing/                       # Pricing, usage, tier badges
│   ├── dashboard/                     # Sidebar, content, sign-out
│   ├── landing/                       # Nav, Footer, HowItWorks, Attribution, Pricing
│   ├── shared/                        # StackSelector, WorkflowNext, CharLimitedInput, CopyButton
│   ├── tools/                         # Per-tool form/results (nuget-advisor, code-explainer, etc.)
│   └── ui/                            # Spinner, cookie consent
├── lib/                                # supabase, stripe, claude clients
├── types/                              # TypeScript interfaces
├── proxy.ts                           # route protection (Next.js 16)
├── .env.local                          # API keys (never committed)
├── playwright/                         # tests
└── PLEXEASE.md                         # this file
```

---

## Tools (10 total, all complete)

### Understand
- **Code Explainer** — paste code, get plain English explanation + detected packages/patterns
- **Error Explainer** — paste error/stack trace, get root cause + fix suggestions + related docs

### Decide
- **Package Advisor** — multi-language package recommendations (replaces NuGet Advisor)
- **Integration Planner** — describe integration, get approach + packages + architecture

### Build
- **Code Generator** — describe spec, get generated files with copy button + setup instructions
- **API Wrapper Generator** — describe API, get typed wrapper with auth setup + usage example
- **Unit Test Generator** — paste code, get test files with framework info + mocking approach

### Maintain
- **Dependency Audit** — paste dependency file, get audit table with status badges
- **Health Checker** — paste config, get health assessment with severity badges
- **Migration Assistant** — specify from/to versions, get migration steps + breaking changes

### Future Tools
- E-Commerce integrations (shipping, payments, inventory, CRM, accounting)
- Platform-specific tools (Shopify, WooCommerce, Magento)

---

## Build Phases

### ✅ Phase 0 — Planning (complete)
Business model, brand name, tech stack, roadmap, legal requirements.

### ✅ Phase 1 — Foundation (complete)
- [x] Scaffold Next.js project with TypeScript + Tailwind
- [x] Connect Supabase (create project, add env vars)
- [x] Create database tables (users, subscriptions, usage)
- [x] Build landing page
- [x] Implement Supabase Auth (sign up, login, logout)
- [x] Build dashboard shell with route protection (middleware.ts)

### ✅ Phase 2 — First Tool (NuGet Advisor) (complete)
- [x] Add unique constraint migration on usage table (user_id, tool_name, month)
- [x] Build lib/claude.ts (Anthropic client + structured prompt)
- [x] Build POST /api/tools/nuget-advisor (usage check, Claude call, upsert)
- [x] Build NuGet Advisor page + form + result cards UI
- [x] Add NuGet Advisor to sidebar and dashboard
- [x] Implement usage tracking (20/month free limit, unlimited Pro)
- [x] Add upgrade prompt when limit reached
- [x] Test tool end-to-end

### ✅ Phase 3 — Monetisation (complete)
- [x] Install Stripe SDK with env validation and mode safeguard
- [x] Add billing/usage threshold constants and Stripe price IDs
- [x] Database migrations: billing columns, unique index, processed_events table
- [x] Shared subscription module (getUserPlan, isProUser, reconcileSubscription)
- [x] Stripe checkout API route with CSRF protection
- [x] Stripe webhook handler with signature verification and deduplication
- [x] Customer Portal API route
- [x] Resubscribe API route (un-cancel active subscriptions)
- [x] Billing UI components: TierBadge, UsageCounter, UsageCard, CancellationBanner, PaymentFailedBanner, PricingToggle, PricingCard, FeatureComparison, FaqSection
- [x] Upgrade page with monthly/annual toggle
- [x] Checkout success page with polling
- [x] Dashboard with subscription card, usage card, and billing banners
- [x] Sidebar updated with tier badge, usage counter, upgrade link
- [x] Landing page pricing section updated with toggle and smart CTAs
- [x] /upgrade added to protected routes

### ✅ Phase 4 — Foundation Revisit (complete)
- [x] Auth page UX — branded AuthHeader, friendly error messages, autoComplete, Suspense boundary, OAuth error handling
- [x] Responsive landing page nav with clickable Plexease link
- [x] Error pages — 404/500 with dashboard + home links, dev error details, inline styles for global-error
- [x] Cookie consent — 12-month expiry, GDPR copy, manage cookies in sidebar + footer, accessibility
- [x] Security hardening — response headers, stricter CSRF, error log sanitization, email validation, cookie secure flag fix
- [x] Auth routes updated in middleware (check-email, reset-password)
- [x] .env.local.example updated with Stripe price ID vars

### ✅ Phase 4.5 — Smoke Tests (complete)
- [x] Create `plexease-test` Supabase project (same org), apply schema + RPC
- [x] Install Playwright, configure `.env.test`
- [x] Global setup: auto-create test users via Supabase admin API, seed pro subscription, save storageState
- [x] Global teardown: reset usage counts, clean mutable state
- [x] Page Object Model: login, signup, dashboard, nuget-advisor, upgrade, error pages
- [x] Custom fixtures: freeUserPage, proUserPage, anonPage, supabaseAdmin
- [x] Test: auth flows (signup form, login, logout with session intercept, forgot password)
- [x] Test: dashboard rendering (free vs pro)
- [x] Test: NuGet Advisor (free + pro)
- [x] Test: usage limits (DB seed to 19/20, boundary test)
- [x] Test: Stripe checkout (redirect + soft-assert full flow) + manage billing portal
- [x] Test: protected routes (anon redirect, pro access)
- [x] Test: error pages (404)
- 18 tests total, all passing (54.7s, single worker, serial execution)
- Design doc: `docs/plans/2026-03-06-phase4.5-smoke-tests-design.md`

### ✅ Phase 5 — Branding (complete)
- [x] Visual identity — purple colour system (brand/surface/muted tokens via Tailwind v4 @theme)
- [x] Typography — Plus Jakarta Sans (headings) + Inter (body) via next/font/google
- [x] Logo — organic cluster icon (4 purple nodes), "Plex" white + "ease" purple wordmark
- [x] Favicon — SVG icon + web manifest with branded theme_color
- [x] Colour migration — all 26+ files migrated from blue/gray to brand/surface/muted tokens
- [x] Visual polish — button glow, card hover lift, hero gradient, shimmer tagline animation
- [x] Accessibility — skip-to-content link, focus rings on all interactive elements, touch targets (44px), reduced motion support
- [x] OG image — 1200x630 with logo, wordmark, tagline, bundled fonts
- [x] Sonner toast theming — branded dark toasts
- Design doc: `docs/plans/2026-03-07-phase5-branding-design.md`
- Implementation plan: `docs/plans/2026-03-07-phase5-branding-implementation.md` (21 tasks)

### ✅ Phase 6 — Marketing & Trust (complete)
- [x] Landing page refresh (How It Works, Attribution strip, enhanced footer)
- [x] Legal pages (Terms of Service, Privacy Policy)
- [x] Trust signals ("Powered by Claude AI" attribution)
- [x] SEO fundamentals (meta tags, JSON-LD, sitemap.xml, robots.txt)
- [x] Social card metadata (OG + Twitter cards)
- [x] Apple touch icon

### ✅ Phase 7 — Testing & CI (complete)
- [x] GitHub Actions CI: fast tests on push, slow tests on PR, cleanup job
- [x] Fast/slow test split with Playwright projects (20 fast / 4 slow)
- [x] Route intercept mocking for NuGet Advisor API (`mockApi` fixture)
- [x] Base tool page object pattern for future tools (`ToolPageBase`)
- [x] Validation tests: landing page, legal pages, mocked NuGet Advisor
- [x] NuGet Advisor canary test (real Claude API, slow suite)
- [x] Test user cleanup in teardown + CI
- [x] Automated test env setup (`npm run test:setup` generates `.env.test` from `.env.local`)
- [x] Session-safe `findTestUser` lookup (no password sync during tests)
- Deferred: wider test scope (Phase 7.5), staging environment (future), MSW migration (when second API added)
- Design doc: `docs/plans/2026-03-07-phase7-testing-ci-design.md`
- Implementation plan: `docs/plans/2026-03-07-phase7-testing-ci-implementation.md`

### ⬜ Phase 7.5 — Test Backlog (complete)
- [x] 30 new fast Playwright tests: landing sections, cookie consent, auth pages, upgrade page, billing banners, checkout success
- [x] New fixtures: `freshAnonPage`, `mockApi.checkoutStatus`, `supabaseAdmin.setSubscriptionState/resetSubscription`
- [x] New page object: `LandingPage`
- [x] CI fix: sequential job execution, billing-banners isolation (`fast-serial` project), removed session-invalidating password sync
- [x] Repo made public, branch protection enabled on main
- Total: 51 fast tests, 4 slow tests (55 total)
- Design doc: `docs/plans/2026-03-08-phase7.5-test-backlog-design.md`

### ✅ Phase 8a — Workflow Tools (complete)
- [x] Shared infrastructure: workflow context (localStorage), StackSelector, WorkflowNext, CharLimitedInput, API auth helpers
- [x] Sidebar updated with grouped navigation (Understand / Decide / Build / Maintain)
- [x] Dashboard updated with workflow hub (4 stage cards)
- [x] Code Explainer (Understand) — paste code, get plain English explanation + detected packages/patterns
- [x] Integration Planner (Decide) — describe integration, get approach + packages + architecture + considerations
- [x] Code Generator (Build) — describe spec, get generated files with copy button + setup instructions
- [x] Dependency Audit (Maintain) — paste dependency file, get audit table with status badges + recommendations
- [x] Workflow hand-off between tools via localStorage context
- [x] 23 new fast Playwright tests (5 per tool + 3 shared component tests)
- Total: 70 fast tests, 4 slow tests (74 total)
- Design doc: `docs/plans/2026-03-08-phase8a-design.md`
- Implementation plan: `docs/plans/2026-03-08-phase8a-implementation.md`

### ✅ Phase 8b — Remaining Workflow Tools (complete)
- [x] Error Explainer (Understand) — paste error/stack trace, get root cause + fix suggestions + related docs
- [x] Package Advisor (Decide) — multi-language replacement for NuGet Advisor, recommendations + alternatives table + compatibility + version advice
- [x] NuGet Advisor migration — page redirects to Package Advisor with `?language=csharp`, old API route preserved for usage data
- [x] API Wrapper Generator (Build) — describe API, get typed wrapper files with copy button + auth setup + usage example
- [x] Unit Test Generator (Build) — paste code, get test files with copy button + framework info + mocking approach
- [x] Health Checker (Maintain) — paste config, get health assessment with severity badges (critical/warning/info) + recommendations
- [x] Migration Assistant (Maintain) — specify from/to versions, get numbered migration steps with code changes + breaking changes (red-tinted) + effort estimate
- [x] Shared CopyButton component extracted to `components/shared/copy-button.tsx` (used by Code Generator, API Wrapper, Unit Test Generator)
- [x] 37 new Playwright tests + 3 updated existing tests
- Total: 107 fast + 4 slow + 2 fast-serial (113 total)
- Design doc: `docs/plans/2026-03-08-phase8-tool-workflow-platform-design.md`
- Implementation plan: `docs/plans/2026-03-08-phase8b-implementation.md`

---

## Workflow

- **Claude.ai** = Project manager / architect (planning, decisions, strategy)
- **Claude Code** = Developer (writing code, debugging, running tests)
- **Superpowers plugin** = Enforces TDD workflow in Claude Code
- **This file** = Shared context between both

Update this file at the end of each Claude Code session:
> "Update PLEXEASE.md to reflect what we just built"

### Code Delivery

| Tier | When | Path |
|------|------|------|
| **PR (default)** | Any change that affects behaviour | Branch → push → CI → open PR → CI fast+slow pass → Claude Code review → squash merge |
| **Direct-to-main (exception)** | Emergency hotfix or purely cosmetic | Temporarily disable branch protection → push → re-enable |

**Branch naming:** `feature/description`, `fix/description`, `refactor/description`

**CI gates:**
- Push to any branch: fast tests run
- PR to main: fast + slow tests must both pass
- Merge: requires passing CI + branch protection

**Repo settings:** squash merge only, auto-delete branches after merge, branch protection on main (requires public repo — see design doc)

**Design doc:** `docs/plans/2026-03-07-code-delivery-workflow-design.md`

### Session & Model Strategy

All sessions use **Opus** (Max plan). Each phase uses **3 focused sessions** for fresh context:

| Session | Purpose | Output |
|---------|---------|--------|
| 1. Design | Brainstorm, architecture, edge cases, write plan | `docs/plans/YYYY-MM-DD-<feature>-design.md` |
| 2. Build | Implement plan on feature branch, open PR | Branch pushed, PR open, CI running |
| 3. Review | Claude Code reviews PR diff, fixes issues, iterates until CI green | Squash merged to main via PR |

**How to run this:**
1. Start session → brainstorm & write plan → end session
2. Start session → say "implement `docs/plans/<plan>.md`" → end session
3. Start session → say "code review phase N" → Claude Code reviews PR, merges when green

**Why separate sessions:** each starts with a fresh context window. The plan files and `PLEXEASE.md` carry all context between sessions via the memory file at `~/.claude/projects/-home-deck/memory/plexease.md`.

**When to stay in one session:** small fixes, hotfixes, or tasks that take < 10 minutes total.

---

## Key Decisions & Constraints

- No limited company needed initially — sole trader is fine
- VAT registration only required above £90k/year
- Need Terms of Service + Privacy Policy before launch (termly.io or getterms.io)
- GDPR compliance required for user data
- Domain to purchase: `plexease.io` and `plexease.dev`
- Formal trademark check needed at: trademarks.ipo.gov.uk
- `.env.local` must never be committed to Git

---

## Current Status

> **Update this section each session.**

- Phase: 8b complete (on feature/phase8b branch)
- Last action: Phase 8b — 6 new workflow tools + NuGet migration + shared CopyButton, 37 new tests (113 total)
- Next step: PR review, merge, then Phase 9 planning
- Test setup: run `npm run test:setup` to generate `playwright/.env.test` from `.env.local`, then `npm test` for full Playwright suite
- CI: fast tests on every push, fast + slow on PRs to main, branch protection requires both to pass
- Repo: public, squash merge only, auto-delete branches, PRs required for main
- Brand guide: `docs/brand-style-guide.md` — reference for all future UI work
