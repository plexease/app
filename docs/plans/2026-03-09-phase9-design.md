# Phase 9 — Persona-Driven UX, Pricing Restructure & Integration Tools

> Design document for Plexease Phase 9
> Date: 2026-03-09

---

## Overview

Phase 9 transforms Plexease from a developer-focused tool suite into a persona-driven platform serving users of all technical levels. The phase introduces user personas with tailored UI experiences, restructures pricing to three tiers (plus an enterprise placeholder), adds four new integration-focused tools, and lays groundwork for future CRM capabilities through a user-traceable data model.

### Key Principles

- **Persona shapes experience, not feature access** — all tiers access the same tools; pricing is volume-based
- **CRM-ready data model** — every piece of user-generated data ties back to `user_id` for future client relationship management
- **Progressive disclosure** — show less by default, let users dig deeper when they want to
- **No patronising, no alienating** — users self-select their experience level; they can change it anytime

---

## 1. User Personas

Three user groups, each receiving a tailored default experience:

| Persona | Description | Technical level |
|---------|-------------|-----------------|
| **Business Owner** | Runs their own business, manages tools like Shopify/Xero, no code knowledge | Non-technical |
| **Support / Operations** | Tech support agents, IT admins, ops staff — diagnoses and fixes integration issues | Semi-technical |
| **Implementer** | Freelancers, agencies, consultants, developers — builds and configures integrations for clients | Technical |

### Why not a dedicated "Developer" persona?

AI coding agents (Cursor, Claude Code, Copilot) already handle code generation, debugging, and dependency management inside the editor. Developers are unlikely to context-switch to a web app for tasks their IDE already does. The Implementer persona covers developers who work on integrations specifically, while the real market opportunity is users who *can't* use coding agents — business owners, support staff, and operational roles.

---

## 2. Onboarding Flow

### Questionnaire

Triggered on first login. Replaces the current direct-to-dashboard flow.

1. Brief intro: *"We'll ask a few questions to tailor your experience. You can change these anytime in settings."*
2. **Q1: "What best describes your role?"** — Business Owner / Support & Operations / Implementer
   - Below Q1: *"I know what I'm doing — skip setup"* link. Sets defaults based on role selection only, skips Q2–Q4, goes straight to dashboard.
3. **Q2: "How comfortable are you with technical concepts?"** — Guide me step by step / I can follow docs and configs / I write code
   - If "I write code" → *"That's all we need — you're set up"* → skip to dashboard with their Q1 role as persona, high comfort level defaults
4. **Q3: "What platforms do you use?"** — Multi-select: Shopify, WooCommerce, Xero, Stripe, Royal Mail, QuickBooks, Magento, other (free text)
5. **Q4: "What brings you here today?"** — Setting up integrations / Fixing a problem / Evaluating options / Just exploring
6. → Dashboard with persona-appropriate view

### Data model

Stored in `user_profiles` table:

```sql
user_profiles (
  id uuid PRIMARY KEY REFERENCES users(id),
  persona TEXT NOT NULL DEFAULT 'business_owner',  -- business_owner | support_ops | implementer
  comfort_level TEXT,                               -- guided | docs_configs | writes_code
  platforms TEXT[],                                  -- array of platform identifiers
  primary_goal TEXT,                                 -- setup | fixing | evaluating | exploring
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

All fields editable in account settings. Persona changes could be logged for future CRM analytics.

---

## 3. Persona-Driven UI

Each persona gets a different default dashboard view. Users can switch between views via a toggle in the header or account settings.

### Business Owner View

- **Hero element:** Unified input — *"What do you need help with?"* with suggested prompts mapping to the 4 lifecycle stages ("Something's broken" → Troubleshoot, "I need to connect two services" → Set Up, "Help me choose tools" → Explore, "Check my setup" → Maintain)
- **Below input:** 3–4 recommended tools based on platforms selected during onboarding
- **Sidebar:** Minimal — recent tools, favourites, account. No category taxonomy
- **Language:** Plain English, no jargon, step-by-step guidance in results
- **Tool results:** Verbose explanations, "do this in your dashboard" style instructions

### Support / Operations View

- **Dashboard:** Grouped tool categories with recent tools and favourites pinned at top
- **Sidebar:** Collapsible categories (Explore / Set Up / Troubleshoot / Maintain), progressive disclosure
- **Language:** Technical but accessible — assumes familiarity with APIs, webhooks, logs but doesn't assume coding ability
- **Tool results:** Structured with clear sections, actionable diagnostic steps

### Implementer View

- **Dashboard:** Full tool grid — everything visible, dense layout, documentation-style descriptions
- **Sidebar:** All categories expanded by default, full tool list visible
- **Language:** Technical, concise — code snippets, API references, architecture patterns
- **Tool results:** Compact, code-heavy, minimal hand-holding

### View switching

- Simple control in header: **"View: Business / Support / Implementer"**
- Allows anyone to switch contexts (e.g., implementer checking what a client's Business Owner view looks like)
- **Separation of persona vs viewing mode:**
  - `user_profiles.persona` — the user's actual persona, set during onboarding, changeable in account settings
  - `viewing_as` — ephemeral, session-level only (stored in cookie or session state), defaults to their persona
  - The header toggle changes `viewing_as`, not `persona` — switching view to check another persona's experience doesn't permanently alter your profile
  - Account settings is the only place where the actual `persona` field is changed

---

## 4. Pricing Restructure

### New tier structure

| Tier | Price | Uses/month | Enforcement | Target |
|------|-------|------------|-------------|--------|
| **Free** | £0 | 10 | Hard cap | Evaluation, occasional use |
| **Essentials** | £5/month | 100 | Hard cap | Business owners, support teams trialling |
| **Pro** | £19/month | 1,000 | Hard cap | Support/ops teams, implementers |
| **Enterprise** | Contact us | Token-based (pay-as-you-go) | Per agreement | Teams, agencies, automation |

### Key changes from current model

- Free tier reduced from 20 → 10 uses/month (better conversion funnel)
- New Essentials tier at £5/month (10x uses for £5 — marketable ratio)
- Pro changes from "unlimited" to 1,000/month hard cap (prevents account sharing; genuinely generous for single users). No existing paying subscribers to migrate.
- Enterprise placeholder added (no implementation required yet)

### Annual pricing

Retained for Essentials and Pro with discount:
- Essentials: £50/year (save ~£10)
- Pro: £190/year (save ~£38)

### Stripe changes

- New Essentials monthly and annual price IDs
- Update checkout flow to offer two paid options (Essentials and Pro)
- Update upgrade page with four-tier comparison (Free / Essentials / Pro / Enterprise)
- Enterprise card is a static placeholder — bullet points + "Contact us" button (mailto or simple contact form). Enterprise pricing and checkout will be implemented in a future phase.
- Update usage constants and limit enforcement

### Marketing for Enterprise

Enterprise pricing card includes:
- Custom usage limits
- API access (future)
- Team accounts (future)
- Dedicated support
- "Contact us to discuss pricing" CTA

---

## 5. New Integration Tools

Four new tools serving the integration-focused use cases. All adapt their output based on the user's persona.

### Set Up — Integration Hub

- **Input:** User selects two platforms (e.g., Shopify + Xero) or describes what they want to connect
- **Output (Business Owner):** Step-by-step guide with screenshots-level clarity, platform-specific dashboard instructions
- **Output (Support/Ops):** Configuration steps, webhook setup, common gotchas, troubleshooting tips
- **Output (Implementer):** API endpoints, code snippets, authentication flows, architecture diagram description
- **Persona adaptation:** Uses `platforms` from user profile to contextualise recommendations

### Troubleshoot — Troubleshooter

- **Input:** User describes the problem ("Orders aren't syncing to Xero") or selects from common issues
- **Output:** Guided diagnostic flow that narrows down the root cause (auth? webhook? mapping? rate limit?)
- **Business Owner:** "Check your Shopify admin → Settings → Notifications → Webhooks. Is there a red warning icon?"
- **Support/Ops:** "Verify the webhook endpoint returns 200. Check for recent 4xx/5xx in your logs"
- **Implementer:** "Inspect webhook payload signature validation. Here's a code snippet to replay the failed event"

### Troubleshoot — Change Impact Advisor

- **Input:** User describes a change ("Royal Mail updated their API" / "US changed de minimis rules" / "Stripe deprecated API version X")
- **Output:** Analysis of which integrations are affected, what needs updating, priority order, effort estimate
- **Persona adaptation:** Business Owner gets action items ("Call your shipping provider"), Support gets technical checklist, Implementer gets migration code
- **Note:** Tool name "Adapt" was considered as a category but the tool sits within the Troubleshoot lifecycle stage alongside Error Explainer and Code Explainer

### Explore — Stack Planner

- **Input:** User describes their business needs ("I sell online, need shipping + accounting + payments")
- **Output:** Recommended compatible tool stack with rationale, cost estimates, integration complexity rating
- **Persona adaptation:** Business Owner gets plain English comparison table, Implementer gets architecture recommendations and API quality assessment

### Navigation grouping (updated)

Lifecycle-based categories — 4 stages mapping to where the user is in their integration journey:

| Stage | Meaning | Tools |
|-------|---------|-------|
| **Explore** | "I'm figuring out what I need" | Stack Planner, Package Advisor, Integration Planner |
| **Set Up** | "I'm building or connecting something" | Integration Hub, Code Generator, API Wrapper Generator |
| **Troubleshoot** | "Something's wrong or changing" | Troubleshooter, Error Explainer, Change Impact Advisor, Code Explainer |
| **Maintain** | "I want to keep things healthy" | Health Checker, Dependency Audit, Migration Assistant, Unit Test Generator |

**Why these 4:**
- Every user intuitively knows where they are — "something broke" → Troubleshoot, "I'm starting fresh" → Explore
- Maps naturally to task-first navigation ("What do you need help with?" → these 4 options)
- 3–4 tools per category — balanced, no single-tool sections
- Future-proof — all planned features (e-commerce integrations, platform-specific tools, health monitoring) fit within these 4 categories without needing a 5th

**Persona visibility:**
- Business Owner view shows all 4 stages but uses plain English labels and descriptions
- Support/Ops view shows all 4 with technical descriptions, Troubleshoot prioritised
- Implementer view shows all 4 equally with full technical detail

---

## 6. Session Enforcement

### Concurrent session management

- Maximum 3 concurrent sessions per account
- On 4th login, the oldest session is silently invalidated
- User on the invalidated session gets redirected to login on their next interaction
- No blocking prompts or forced choices

### Data model

```sql
sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  device_info TEXT,
  ip_hash TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Account settings

- "Active sessions" section showing device info, last active time, location (from IP)
- Manual "Log out" button per session
- "Log out all other devices" option

### Fair usage

- All tiers use hard caps (10 / 100 / 1,000) enforced by the same usage tracking logic already in place
- Usage counter in sidebar shows remaining uses for the month
- At limit: clear message with upgrade CTA and reset date

---

## 7. Feedback Framework

### Design principles

- Unobtrusive — never blocks the user's next action
- Dismissible — one tap to dismiss, never shows that trigger again
- CRM-ready — all feedback tied to user record for future client relationship management

### Trigger points

| Trigger | Placement | Frequency |
|---------|-----------|-----------|
| 5th tool use | Inline card below tool result | Once, dismissible |
| Cancellation | Optional field on confirmation page | Once |

### Persistent feedback button

A small, always-available "Feedback" button in the sidebar or footer. Opens a simple form (text field + send). Available on every page, never intrusive. This replaces the need for milestone-based triggers beyond the initial 5th-use prompt — users who want to give feedback always can.

### UI pattern

Inline card (for 5th-use trigger):
> *"Quick thought? Help us improve — totally optional"*
> [text field] [Send] [Dismiss ×]

Feedback button form (persistent):
> *"How can we improve?"*
> [text field] [Send] [Cancel]

- No modals, no blocking, no required fields
- Dismiss state for inline card tracked per user in Supabase (persists across devices)

### Data model

```sql
feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  text TEXT NOT NULL,
  trigger_type TEXT NOT NULL,    -- fifth_use | cancellation | manual (from persistent button)
  tool_name TEXT,                -- nullable, set when triggered from a tool
  persona TEXT,                  -- user's persona at time of feedback
  tier TEXT,                     -- user's tier at time of feedback
  status TEXT DEFAULT 'new',     -- new | acknowledged | resolved
  resolution TEXT,               -- nullable, what was done about it (future CRM use)
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Dismiss tracking

```sql
feedback_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  trigger_type TEXT NOT NULL,    -- fifth_use | cancellation
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trigger_type)
)
```

The persistent feedback button has no dismiss tracking — it's always available.

### Future CRM integration

The `status` and `resolution` fields enable a future workflow:
1. User submits feedback → status = `new`
2. Team reviews → status = `acknowledged`
3. Issue resolved → status = `resolved`, `resolution` describes what was done
4. Optional: notify user that their feedback led to a change

All feedback includes `persona`, `tier`, and `tool_name` context — enabling future analysis by user segment.

---

## 8. Database Changes Summary

All new tables follow the CRM-ready principle: every record ties back to `user_id`.

### New tables

```sql
-- User profile and persona settings
user_profiles (
  id uuid PRIMARY KEY REFERENCES users(id),
  persona TEXT NOT NULL DEFAULT 'business_owner',
  comfort_level TEXT,
  platforms TEXT[],
  primary_goal TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Session management
sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  device_info TEXT,
  ip_hash TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Feedback collection
feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  text TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  tool_name TEXT,
  persona TEXT,
  tier TEXT,
  status TEXT DEFAULT 'new',
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Feedback dismissal tracking
feedback_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  trigger_type TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trigger_type)
)
```

### Modified tables/constants

- `usage` table: no schema changes, but free tier constant changes from 20 → 10
- New constants: `ESSENTIALS_MONTHLY_LIMIT = 100`, `PRO_MONTHLY_LIMIT = 1000`
- New Stripe price IDs: essentials monthly, essentials annual

---

## 9. Testing Strategy

### Manual testing first

The onboarding flow and persona-driven UI should be manually tested before writing automated tests. Key areas to evaluate by feel:

- Onboarding questionnaire flow and skip paths
- Persona switching and how the UI adapts
- Tool result language differences across personas
- Feedback card placement and dismissal behaviour
- Session enforcement (login on 4+ devices)

### Automated tests (follow-up phase)

Once UX is settled through manual testing:
- Onboarding flow (complete, skip at Q1, skip at Q2)
- Persona switching and dashboard view changes
- Pricing tier enforcement (10 / 100 / 1,000 limits)
- Feedback submission and dismissal persistence
- Session limit enforcement

---

## 10. Scope & Phasing

Phase 9 is large. Recommended sub-phases:

### Phase 9a — Foundation
- Database migrations (user_profiles, sessions, feedback tables)
- Onboarding questionnaire flow
- Persona storage and account settings
- Pricing backend (new Stripe price IDs, updated usage constants, checkout flow logic for 3 paid tiers)

### Phase 9b — Persona-Driven UI
- Three dashboard views (Business Owner / Support / Implementer)
- View switching toggle
- Persona-adapted sidebar and navigation
- Task-first navigation for Business Owner view
- Unified input hero element

### Phase 9c — Persona Adaptation for Existing Tools
- Retrofit all 10 existing tool API routes to accept persona context
- Update Claude prompts to adapt language/detail level based on persona
- Update tool result components to render persona-appropriate output
- Test each tool across all three persona modes

### Phase 9d — New Integration Tools
- Integration Hub (Set Up stage)
- Troubleshooter (Troubleshoot stage)
- Change Impact Advisor (Troubleshoot stage)
- Stack Planner (Explore stage)
- Persona-adapted output for all four tools (built-in from the start)

### Phase 9e — Session & Feedback
- Session enforcement (3 concurrent, silent oldest-drop)
- Active sessions in account settings
- Feedback framework (5th-use inline card, persistent feedback button, cancellation field, dismissal tracking)

### Phase 9f — Billing UI Updates
- Update TierBadge, UsageCounter, PricingCard, PricingToggle, FeatureComparison for three tiers + Enterprise placeholder
- Update landing page pricing section
- Update upgrade page with four-tier comparison
- Update sidebar usage counter for new limits

### Phase 9g — Landing Page Repositioning
- Problem-led hero: lead with pain points ("Integrations breaking? Apps not talking to each other?"), not personas or technical jargon
- Lifecycle stages section: show the 4 stages (Explore / Set Up / Troubleshoot / Maintain) as the product's value proposition
- "Built for everyone" section: brief persona descriptions (business owners, support teams, implementers) — reassurance, not a gate
- Updated pricing section: 4-tier comparison (Free / Essentials / Pro / Enterprise)
- Updated CTAs: "Start for free" → sign up → onboarding handles personalisation
- Trust signals retained (Claude AI attribution, etc.)

### Phase 9h — Testing & Polish
- Manual testing and UX iteration
- Automated test suite for new features

---

## 11. Future Considerations (Not In Scope)

Noted for future phases — designed to be compatible with Phase 9 foundations:

- **Saved history** (Pro feature) — tool results persisted and searchable
- **Enterprise tier implementation** — API keys, token-based billing, team accounts, usage dashboards
- **API / Automation tier** — programmatic access to tools with ~47% markup on token costs
- **CRM dashboard** — internal view of user feedback, usage patterns, client timelines
- **Integration Health Monitor** — persistent dashboard showing status of user's registered integrations
- **Feedback categorisation** — tagging system for feedback once patterns emerge from raw text data
- **Persona analytics** — track persona changes, correlate with usage and conversion

---

## 12. Success Criteria

- Users complete onboarding in under 60 seconds
- Business owners can find and use a tool without consulting documentation
- Implementers don't feel slowed down by the UI
- Essentials tier converts at a higher rate than the current Free → Pro jump
- Feedback submission rate > 10% of trigger events (indicating non-intrusive placement)
