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
| Free | £0 | 5 tool uses/day |
| Pro | £19/month | Unlimited, saved history, priority AI |

---

## Database Schema (Supabase)

```sql
users           (id, email, created_at, stripe_customer_id)
subscriptions   (id, user_id, plan, status, stripe_subscription_id)
usage           (id, user_id, tool_name, date, count)
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
├── middleware.ts                       # route protection
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

### ⬜ Phase 3 — Monetisation
- [ ] Create Stripe products (Free, Pro £19/mo)
- [ ] Build checkout flow
- [ ] Handle Stripe webhooks
- [ ] Sync subscription status to Supabase
- [ ] Enforce access control based on plan

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

- Phase: 3 (Phases 1 & 2 complete, Phase 3 not yet started)
- Last action: NuGet Advisor live and tested — 4 result cards, 20/month usage tracking, upgrade prompt
- Next step: Phase 3 — Monetisation (Stripe integration)
