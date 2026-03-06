# Plexease — AI Context File

> Paste this at the start of every Claude Code session to provide full project context.
> Keep this file updated as the project evolves.

---

## What Is Plexease?

Plexease is a SaaS integration toolkit for small businesses, tech support staff, and .NET developers. The tagline is **"complex integrations, made easy"**. It provides a suite of AI-powered tools under a single membership, helping users navigate package management, code generation, e-commerce integrations, and more — without needing deep technical expertise.

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
│   │   └── tools/nuget-advisor/
│   ├── api/
│   │   ├── auth/                       # Supabase endpoints
│   │   ├── stripe/                     # webhooks & checkout
│   │   └── tools/nuget-advisor/        # Claude API calls
│   └── page.tsx                        # landing page
├── components/                         # UI, auth, dashboard, tools
├── lib/                                # supabase, stripe, claude clients
├── types/                              # TypeScript interfaces
├── proxy.ts                           # route protection (Next.js 16)
├── .env.local                          # API keys (never committed)
├── playwright/                         # tests
└── PLEXEASE.md                         # this file
```

---

## Tools Roadmap

### Phase 2 — Launch Tool
- **NuGet Package Advisor** ← *first tool to build*
  - User inputs a .NET package name
  - Claude returns: what it does, alternatives, compatibility notes, version advice

### Future .NET Tools
- Unit Test Generator
- Integration Code Generator
- API Wrapper Generator
- .NET Migration Assistant (.NET Framework → .NET 8/9)

### Future E-Commerce Tools
- Shipping & Logistics Integration Advisor (Shiptheory, Royal Mail, DPD)
- Payment Gateway Integration Assistant (Stripe, PayPal, Square)
- Inventory Management Connector (Linnworks, Brightpearl)
- E-Commerce Platform Integration (Shopify, WooCommerce, Magento)
- CRM Integration Assistant (HubSpot, Salesforce, Zoho)
- Accounting Software Connector (Xero, QuickBooks, Sage)

### Future Support & Maintenance Tools
- Error Log Explainer
- Integration Health Checker
- Dependency Audit Tool
- Plain English Code Explainer

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

### ⬜ Phase 4 — Testing
- [ ] Set up Playwright
- [ ] Auth flow tests
- [ ] Tool usage tests
- [ ] Stripe checkout tests
- [ ] Usage limit enforcement tests

### ⬜ Phase 5+ — Additional Tools
Build out remaining tools per the roadmap above.

---

## Workflow

- **Claude.ai** = Project manager / architect (planning, decisions, strategy)
- **Claude Code** = Developer (writing code, debugging, running tests)
- **Superpowers plugin** = Enforces TDD workflow in Claude Code
- **This file** = Shared context between both

Update this file at the end of each Claude Code session:
> "Update PLEXEASE.md to reflect what we just built"

### Session & Model Strategy

Each phase uses **3 focused sessions** to optimise token usage and quality:

| Session | Model | Purpose | Output |
|---------|-------|---------|--------|
| 1. Design | **Opus** | Brainstorm, architecture, edge cases, write plan | `docs/plans/YYYY-MM-DD-<feature>-design.md` |
| 2. Build | **Sonnet** | Implement the plan, commit code | Working feature, pushed to GitHub |
| 3. Review | **Opus** | Code review, fix issues, final push | Clean, reviewed code |

**How to run this:**
1. Start session → `/model claude-opus-4-6` → brainstorm & write plan → end session
2. Start session → `/model claude-sonnet-4-6` → say "implement `docs/plans/<plan>.md`" → end session
3. Start session → `/model claude-opus-4-6` → say "code review phase N" → end session

**Why separate sessions:** each starts with a fresh context window. Carrying implementation history into a review wastes tokens at Opus rates. The plan files and `PLEXEASE.md` carry all context between sessions via the memory file at `~/.claude/projects/-home-deck/memory/plexease.md`.

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

- Phase: 3 complete, merged to main, pushed to GitHub
- Last action: Phase 3 code review (Opus) — fixed all issues (C1: past_due Pro access, I1: reconciliation frequency, I2: webhook rate limiting, I4: server-side Pro redirect on upgrade page, I5: useEffect for toast, M1-M5: service client extraction, body size check, shared isProUser, feature parity, price animation)
- Next step: Phase 4 — Testing (Playwright for auth, tools, billing flows)
