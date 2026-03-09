# Phase 9b — Persona-Driven UI

> Design document for Plexease Phase 9b
> Date: 2026-03-09

---

## Overview

Phase 9b transforms the dashboard from a one-size-fits-all tool list into a persona-driven experience. Business Owners get a guided, task-first interface with AI-powered routing. Support/Ops users get structured categories with quick access to recent tools. Implementers get a dense, documentation-style grid. All three views share the same sidebar — sidebar differentiation is deferred to a future polish pass.

### Scope

- Navigation category rename (Understand/Decide/Build/Maintain → Explore/Set Up/Troubleshoot/Maintain)
- View switching toggle (ephemeral, session-level)
- Three distinct dashboard content views
- AI-powered tool router for Business Owner hero input
- Persona-variant tool descriptions (3 per tool)
- Profile-based tool recommendations
- Sanity tests only (comprehensive testing in 9h)

### Out of scope

- Sidebar differentiation per persona (future polish)
- Persona-adapted tool results/Claude prompts (9c)
- New integration tools (9d)
- Favourites persistence (future feature)

---

## 1. Navigation Category Rename

Rename the 4 sidebar groups from developer-oriented to lifecycle-based:

| Old Category | New Category | Tools |
|-------------|-------------|-------|
| Understand | **Explore** | Package Advisor, Integration Planner |
| Decide | **Set Up** | Code Generator, API Wrapper Generator |
| Build | **Troubleshoot** | Error Explainer, Code Explainer |
| Maintain | **Maintain** | Dependency Audit, Health Checker, Migration Assistant, Unit Test Generator |

Some categories will be lighter until Phase 9d adds new tools:
- Explore gains Stack Planner
- Set Up gains Integration Hub
- Troubleshoot gains Troubleshooter and Change Impact Advisor

Update sidebar `navGroups` array, dashboard category cards, and any tests referencing the old names.

---

## 2. View Switching

### Mechanism

- Toggle placed at **top of sidebar**, below logo, above navigation
- Visible to **all users** regardless of persona
- Three options: Business / Support / Implementer
- Styled as a compact segmented control or dropdown

### State management

- `user_profiles.persona` — the user's actual persona, changed only in account settings
- `viewing_as` — ephemeral, stored in a cookie, defaults to the user's persona
- The toggle changes `viewing_as`, not `persona`
- Dashboard layout reads the `viewing_as` cookie and passes it to components
- Cookie cleared on logout; re-derived from profile on next login

### First load

If no `viewing_as` cookie exists, default to `user_profiles.persona`. If no profile exists (edge case — should be caught by onboarding middleware), default to `business_owner`.

---

## 3. Dashboard Content Views

Same sidebar for all three views. Only the main content area changes.

### Business Owner View

```
┌─────────────────────────────────────────┐
│  "What do you need help with?"          │
│  [____________________________________] │
│                                         │
│  [Something's broken] [Connect services]│
│  [Help me choose]     [Check my setup]  │
├─────────────────────────────────────────┤
│  Recommended for you                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Tool 1│ │Tool 2│ │Tool 3│ │Tool 4│   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
└─────────────────────────────────────────┘
```

- Hero input with AI-powered routing (see §4)
- 4 suggested prompt buttons mapping to lifecycle categories:
  - "Something's broken" → Troubleshoot
  - "Connect two services" → Set Up
  - "Help me choose tools" → Explore
  - "Check my setup" → Maintain
- Recommended tools section below (see §6)
- Plain English tool descriptions

### Support / Operations View

```
┌─────────────────────────────────────────┐
│  Recommended for you                    │
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │Tool 1│ │Tool 2│ │Tool 3│            │
│  └──────┘ └──────┘ └──────┘            │
├─────────────────────────────────────────┤
│  Explore          │  Set Up             │
│  ┌──────┐┌──────┐ │  ┌──────┐┌──────┐  │
│  │      ││      │ │  │      ││      │  │
│  └──────┘└──────┘ │  └──────┘└──────┘  │
│  Troubleshoot     │  Maintain           │
│  ┌──────┐┌──────┐ │  ┌──────┐┌──────┐  │
│  │      ││      │ │  │      ││      │  │
│  └──────┘└──────┘ │  └──────┘└──────┘  │
└─────────────────────────────────────────┘
```

- Recommended tools pinned at top (same logic as Business Owner, labelled "Recommended for you")
- Category cards grouped by lifecycle stage in a 2-column grid
- Technical but accessible descriptions

### Implementer View

```
┌─────────────────────────────────────────┐
│  All Tools                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │      │ │      │ │      │ │      │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │      │ │      │ │      │ │      │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│  ┌──────┐ ┌──────┐                      │
│  │      │ │      │                      │
│  └──────┘ └──────┘                      │
└─────────────────────────────────────────┘
```

- Flat grid — all 10 tools visible, no category grouping
- Compact cards with concise, technical descriptions
- Dense layout (3-4 columns on desktop)

### Mobile responsiveness

- Implementer grid degrades to single column on small screens
- Business Owner hero input is naturally mobile-friendly
- Support/Ops category groups stack vertically

---

## 4. AI-Powered Tool Router

### Purpose

Lets Business Owners describe their problem in plain English and get routed to the right tool without needing to understand the tool taxonomy.

### Endpoint

`POST /api/tools/router`

### Request

```json
{
  "query": "my shopify orders aren't syncing to xero"
}
```

### Response

```json
{
  "tool": "error-explainer",
  "reason": "This sounds like a sync issue — the Error Explainer can help diagnose what's going wrong.",
  "confidence": "high"
}
```

### Routing strategy (3 layers)

1. **Client-side keyword matching** — a map of ~30 common phrases to tools. If a confident match is found, route directly with no API call. Examples:
   - "broken", "not working", "error", "failed" → Error Explainer
   - "connect", "integrate", "set up", "link" → Integration Planner
   - "choose", "compare", "which", "recommend" → Package Advisor
   - "update", "upgrade", "migrate", "version" → Migration Assistant
   - "health", "check", "audit", "status" → Health Checker

2. **Claude Haiku fallback** — for ambiguous queries that don't match keywords. System prompt lists all 10 tools with descriptions, asks Claude to return the best match as JSON.

3. **Hard rate limit backstop** — 10 Claude routing calls per day per user (server-side, tracked in a lightweight counter — could use the existing `usage` table with a special `tool_name` like `_router`).

### Not counted as a tool use

Router calls are excluded from the user's monthly usage quota. They are navigation assistance, not tool execution.

### Rate limit exceeded behaviour

After 10 Claude routing calls in a day, the hero input is replaced with the 4 category buttons and a gentle message: *"Try browsing by category instead."* Client-side keyword matching continues to work (it's free).

### Loading state

While waiting for Claude response, show a brief spinner inside the input with *"Finding the right tool..."*. Typical response time: <1 second with Haiku.

### Error / low confidence fallback

If the router returns low confidence or errors, show all 4 lifecycle categories with the user's query displayed: *"Here are some options that might help."*

### Query logging

Log unmatched queries (those that missed the keyword map and hit Claude) for future keyword map expansion. Store in the `usage` table with `tool_name = '_router_miss'` or a similar convention. No PII — just the query text, user_id, and matched tool. Over time, analyse common patterns and add them to the client-side map.

---

## 5. Persona-Variant Tool Descriptions

Each tool gets 3 description strings — one per persona. Used on dashboard cards and sidebar tooltips. Tool result content adaptation is deferred to Phase 9c.

| Tool | Business Owner | Support/Ops | Implementer |
|------|---------------|-------------|-------------|
| Code Explainer | "Understand what a piece of code does in plain English" | "Break down code snippets to understand logic and dependencies" | "Parse code, identify patterns and packages" |
| Error Explainer | "Find out why something stopped working" | "Diagnose error messages and stack traces" | "Root cause analysis from errors and traces" |
| Package Advisor | "Get recommendations for the right tools" | "Compare packages and libraries for your stack" | "Package comparison with compatibility analysis" |
| Integration Planner | "Plan how to connect your services" | "Architecture and approach for integrations" | "Integration architecture, packages, patterns" |
| Code Generator | "Get ready-to-use code for your project" | "Generate boilerplate and implementation code" | "Scaffold files from spec with setup instructions" |
| API Wrapper Generator | "Create code to talk to an external service" | "Generate typed API client wrappers" | "Typed wrapper with auth setup and usage" |
| Unit Test Generator | "Make sure your code works correctly" | "Generate test files for existing code" | "Test scaffold with mocking approach" |
| Dependency Audit | "Check if your project's tools are up to date" | "Audit dependencies for updates and vulnerabilities" | "Dependency audit table with status badges" |
| Health Checker | "Get a health report for your setup" | "Assess configuration health and risks" | "Config health assessment with severity ratings" |
| Migration Assistant | "Get help upgrading to a new version" | "Step-by-step migration with breaking changes" | "Migration steps, breaking changes, effort estimate" |

These strings live in a shared constant file (e.g., `lib/tool-descriptions.ts`) so they're easy to update.

---

## 6. Recommended Tools Logic

### Inputs

- `platforms[]` from user profile
- `primary_goal` from user profile
- `comfort_level` from user profile

### Platform → tool mapping

```
shopify     → Integration Planner, Health Checker, Error Explainer
woocommerce → Integration Planner, Code Generator, Health Checker
xero        → Integration Planner, API Wrapper Generator, Error Explainer
stripe      → API Wrapper Generator, Integration Planner, Code Generator
royal_mail  → API Wrapper Generator, Integration Planner
quickbooks  → Integration Planner, API Wrapper Generator, Error Explainer
magento     → Integration Planner, Health Checker, Migration Assistant
```

### Goal → stage priority

```
setup      → Set Up tools first, then Explore
fixing     → Troubleshoot tools first, then Maintain
evaluating → Explore tools first, then Set Up
exploring  → even distribution across all stages
```

### Algorithm

1. Collect tools from platform mappings (union, deduplicated)
2. Sort by: goal-priority stage first, then frequency across platform mappings (more platforms mentioning a tool = higher rank)
3. Comfort level as tiebreaker: `guided` users see simpler tools first (Code Explainer > Code Generator), `writes_code` users see builder tools first
4. Return top 4

### Empty state

If no platforms selected (skipped onboarding or cleared settings), show the 4 lifecycle stage cards instead — same layout as the category prompt buttons but styled as tool entry points. Message: *"Tell us about your platforms in Settings to get personalised recommendations."*

---

## 7. Testing (Sanity Only)

Comprehensive test coverage deferred to Phase 9h. Phase 9b adds minimal sanity tests:

- View toggle changes dashboard content (mock profile, check render)
- Business Owner view shows hero input and recommended tools
- Support/Ops view shows category cards
- Implementer view shows dense grid
- Router endpoint responds with valid tool name (mocked Claude)
- Router rate limit returns fallback after limit exceeded
- Category rename reflected in sidebar (Explore/Set Up/Troubleshoot/Maintain)

All tests use mocked API calls — no real Claude calls for routing.

---

## 8. Future Polish (Deferred)

- **Sidebar differentiation per persona** — minimal sidebar for Business Owner (no category taxonomy, just recent + favourites), collapsible categories for Support/Ops, all expanded for Implementer
- **Favourites persistence** — let users pin tools, stored in `user_profiles` or a separate table
- **Keyword map expansion** — review router query logs periodically, promote frequent Claude-routed phrases to client-side map
- **View-specific loading skeletons** — skeleton UI matching each persona's layout during page load

---

## 9. Key Files to Modify

| File | Change |
|------|--------|
| `components/dashboard/sidebar.tsx` | Category rename, view toggle component |
| `components/dashboard/dashboard-content.tsx` | Three persona-based content views |
| `app/(dashboard)/layout.tsx` | Read `viewing_as` cookie, pass to components |
| `app/(dashboard)/dashboard/page.tsx` | Fetch user profile, pass persona data |
| `app/api/tools/router/route.ts` | New — AI routing endpoint |
| `lib/tool-descriptions.ts` | New — persona-variant descriptions |
| `lib/tool-recommendations.ts` | New — recommendation logic |
| `lib/tool-router.ts` | New — keyword map + Claude fallback logic |
| `lib/constants.ts` | Category rename, router rate limit constant |
| `lib/types/persona.ts` | Add ViewingAs type if needed |

---

## 10. Dependencies

- Phase 9a complete (user profiles, onboarding, 3-tier pricing) ✅
- Claude Haiku API access (same Anthropic key, different model param)
- No new database tables required — uses existing `user_profiles` and `usage` tables
