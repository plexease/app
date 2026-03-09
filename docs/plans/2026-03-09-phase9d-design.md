# Phase 9d — Tool Expansion & Rebranding

> Design document for Plexease Phase 9d
> Date: 2026-03-09

---

## Overview

Phase 9d expands the platform from 10 developer-focused tools to 18 integration-focused tools serving users across all domains — e-commerce, SaaS workflows, DevOps, collaboration, and beyond. The phase introduces 8 new tools, rebrands 7 existing tools for broader appeal, and keeps 3 explicitly technical tools unchanged.

This phase is cosmetic for rebrands (labels, URLs, descriptions only — prompt reworks deferred to Phase 10). New tools are persona-aware from day one using Phase 9c infrastructure.

### Vision Shift

Plexease is evolving from a developer-focused tool suite into a universal integration platform. The goal: **simplify the confusing world of APIs** and help anyone — business owners, support teams, implementers — get their apps connected and working together.

The brand name stays for now (Phase 10+ consideration). "Plex" can be read as "complex" — simplifying complexity.

### Key Principles

- **Domain-agnostic** — tools work for any integration, not just specific platforms
- **Persona-driven signposting** — business owners never see a wall of 24 tools; the router and hero input guide them
- **Cosmetic rebrands only** — existing tool prompts stay as-is; prompt reworks are Phase 10
- **Existing patterns** — all new tools follow the established route/Claude function/tool catalog pattern from 9c

---

## 1. Tool Rebrands (Cosmetic)

7 existing tools get new names, URLs, and descriptions. The underlying Claude prompts and Zod schemas remain unchanged.

| Current Name | New Name | Current Slug | New Slug | Category |
|---|---|---|---|---|
| Code Explainer | How It Works | `code-explainer` | `how-it-works` | Troubleshoot |
| Error Explainer | Error Resolver | `error-explainer` | `error-resolver` | Troubleshoot |
| Package Advisor | Tool Finder | `package-advisor` | `tool-finder` | Explore |
| Integration Planner | Integration Blueprint | `integration-planner` | `integration-blueprint` | Explore |
| Health Checker | Connection Health Check | `health-checker` | `connection-health-check` | Maintain |
| Dependency Audit | Compatibility Check | `dependency-audit` | `compatibility-check` | Maintain |
| Migration Assistant | Upgrade Assistant | `migration-assistant` | `upgrade-assistant` | Maintain |

### Rebrand scope per tool

Each rebrand involves:
- **Tool catalog** (`lib/tool-descriptions.ts`): update `ToolId`, label, href, and all 3 persona descriptions
- **API route**: rename directory (e.g. `app/api/tools/code-explainer/` → `app/api/tools/how-it-works/`)
- **Tool page**: rename directory (e.g. `app/tools/code-explainer/` → `app/tools/how-it-works/`)
- **Constants** (`lib/constants.ts`): update `TOOL_NAME_*` constant
- **Claude function** (`lib/claude.ts`): no changes (prompt stays the same)
- **Router** (`lib/tool-router.ts`): update any references to old tool IDs
- **Tests**: update any references to old URLs/names

### URL Redirects

Old URLs should redirect to new ones to avoid breaking bookmarks and shared links. Implement via Next.js `redirects` in `next.config.ts`:

```typescript
async redirects() {
  return [
    { source: '/tools/code-explainer', destination: '/tools/how-it-works', permanent: true },
    { source: '/tools/error-explainer', destination: '/tools/error-resolver', permanent: true },
    { source: '/tools/package-advisor', destination: '/tools/tool-finder', permanent: true },
    { source: '/tools/integration-planner', destination: '/tools/integration-blueprint', permanent: true },
    { source: '/tools/health-checker', destination: '/tools/connection-health-check', permanent: true },
    { source: '/tools/dependency-audit', destination: '/tools/compatibility-check', permanent: true },
    { source: '/tools/migration-assistant', destination: '/tools/upgrade-assistant', permanent: true },
  ];
}
```

API route redirects are not needed — API consumers use the tool via the frontend, which will use the new routes.

### 3 Unchanged Tools

These keep their current names — they are explicitly technical and users are signposted to them by the router:
- **Code Generator** (`code-generator`)
- **API Wrapper Generator** (`api-wrapper-generator`)
- **Unit Test Generator** (`unit-test-generator`)

---

## 2. New Tools

8 new tools, all persona-aware from day one.

### Explore — Tool Planner

**Purpose:** Recommend compatible tools and platforms based on business needs.

**Input:**
- `description` (required, string, max 2000 chars) — user describes their business needs (e.g. "I sell online, need shipping + accounting + payments")
- `persona` (optional) — resolved via standard 3-tier fallback

**Output:**
- Recommended tool stack with rationale
- Cost estimates where available
- Integration complexity rating per combination
- Priority order for implementation

**Persona adaptation:**
| Persona | Output style |
|---|---|
| Business Owner (★★★) | Plain English comparison table, cost focus, "best for small business" framing |
| Support/Ops (★★) | Technical compatibility notes, support quality assessment |
| Implementer (★) | API quality assessment, SDK availability, architecture recommendations |

**Route:** `POST /api/tools/tool-planner`
**Page:** `/tools/tool-planner`
**Slug:** `tool-planner`
**Category:** `explore`

---

### Explore — Connection Map

**Purpose:** Visualise the user's current integration landscape and identify weak points.

**Input:**
- `platforms` (required, string, max 2000 chars) — user describes or lists their current tools and how they're connected (e.g. "Shopify for sales, Xero for accounting, Stripe for payments, Royal Mail for shipping")
- `concerns` (optional, string, max 1000 chars) — specific worries or areas to focus on
- `persona` (optional)

**Output:**
- Text-based map of connections between platforms (structured, not an image)
- Data flow description (what moves between each pair)
- Identified weak points (single points of failure, manual steps, missing connections)
- Recommendations for strengthening the setup

**Persona adaptation:**
| Persona | Output style |
|---|---|
| Business Owner (★★★) | Simple flow diagram in plain English, "your data goes from X to Y" |
| Support/Ops (★★★) | Connection inventory with health indicators, "check these when troubleshooting" |
| Implementer (★★) | Architecture overview, API dependency chain, failure modes |

**Route:** `POST /api/tools/connection-map`
**Page:** `/tools/connection-map`
**Slug:** `connection-map`
**Category:** `explore`

---

### Set Up — Integration Setup

**Purpose:** Guide users through connecting two platforms together.

**Input:**
- `platformA` (required, string) — first platform
- `platformB` (required, string) — second platform
- `goal` (optional, string, max 1000 chars) — what the user wants the integration to achieve (e.g. "sync orders from Shopify to Xero automatically")
- `persona` (optional)

**Output:**
- Step-by-step connection guide
- Prerequisites (accounts, API keys, permissions needed)
- Configuration steps for both platforms
- Verification steps to confirm the integration works
- Common pitfalls and how to avoid them

**Persona adaptation:**
| Persona | Output style |
|---|---|
| Business Owner (★★★) | Dashboard-level instructions, "click here, then here", screenshot-level clarity |
| Support/Ops (★★★) | Configuration steps with webhook setup, common gotchas, troubleshooting tips |
| Implementer (★★) | API endpoints, auth flows, code snippets, architecture considerations |

**Route:** `POST /api/tools/integration-setup`
**Page:** `/tools/integration-setup`
**Slug:** `integration-setup`
**Category:** `setup`

---

### Set Up — Webhook Builder

**Purpose:** Guide webhook setup between two apps — the most common integration pattern and a frequent pain point.

**Input:**
- `sourceApp` (required, string) — the app sending events
- `targetApp` (required, string) — the app receiving events
- `events` (optional, string, max 1000 chars) — what events to listen for (e.g. "new order, payment received, shipping update")
- `persona` (optional)

**Output:**
- Webhook configuration steps for the source app
- Endpoint setup for the target app
- Payload format and key fields
- Authentication/verification setup (signatures, secrets)
- Testing and debugging guidance

**Persona adaptation:**
| Persona | Output style |
|---|---|
| Business Owner (★★) | "Go to Settings → Webhooks → Add new", plain English event descriptions |
| Support/Ops (★★★) | Endpoint configuration, payload inspection, log checking procedures |
| Implementer (★★★) | Code snippets for endpoint handler, signature verification, retry logic |

**Route:** `POST /api/tools/webhook-builder`
**Page:** `/tools/webhook-builder`
**Slug:** `webhook-builder`
**Category:** `setup`

---

### Set Up — Auth Guide

**Purpose:** Help users get authenticated with any service — API keys, OAuth, tokens. Auth is the #1 blocker for non-technical users.

**Input:**
- `service` (required, string) — the service to authenticate with (e.g. "Stripe", "Google Sheets API", "Xero")
- `purpose` (optional, string, max 1000 chars) — what the user wants to do once authenticated
- `persona` (optional)

**Output:**
- Auth method used by this service (API key, OAuth 2.0, JWT, etc.)
- Step-by-step guide to obtain credentials
- Where to store credentials safely
- How to test the authentication works
- Common auth errors and fixes

**Persona adaptation:**
| Persona | Output style |
|---|---|
| Business Owner (★★★) | "Log into your dashboard, go to Settings → API → Create key", security in plain terms |
| Support/Ops (★★★) | Credential management, scopes/permissions needed, rotation guidance |
| Implementer (★★) | Auth flow diagrams, token refresh logic, code snippets for auth setup |

**Route:** `POST /api/tools/auth-guide`
**Page:** `/tools/auth-guide`
**Slug:** `auth-guide`
**Category:** `setup`

---

### Set Up — Workflow Builder

**Purpose:** Design multi-step automation workflows — "When X happens in app A, do Y in app B, then Z in app C."

**Input:**
- `description` (required, string, max 2000 chars) — what the user wants to automate (e.g. "When a new order comes in on Shopify, create an invoice in Xero and notify the team on Slack")
- `platforms` (optional, string, max 1000 chars) — specific platforms involved
- `persona` (optional)

**Output:**
- Workflow steps in logical order
- Trigger event and conditions
- Actions at each step with platform-specific details
- Error handling (what happens if a step fails)
- Implementation options (Zapier/Make/n8n vs custom code)
- Estimated setup time

**Persona adaptation:**
| Persona | Output style |
|---|---|
| Business Owner (★★★) | Visual flow description, Zapier/Make recommendations, "set and forget" focus |
| Support/Ops (★★★) | Step-by-step with monitoring points, "what to check if it stops working" |
| Implementer (★★) | Code-first approach, queue/retry patterns, architecture for reliability |

**Route:** `POST /api/tools/workflow-builder`
**Page:** `/tools/workflow-builder`
**Slug:** `workflow-builder`
**Category:** `setup`

---

### Troubleshoot — Troubleshooter

**Purpose:** Diagnose and fix integration connection issues through guided analysis.

**Input:**
- `problem` (required, string, max 2000 chars) — description of the issue (e.g. "Orders aren't syncing from Shopify to Xero since yesterday")
- `platforms` (optional, string, max 1000 chars) — platforms involved
- `recentChanges` (optional, string, max 1000 chars) — anything that changed recently
- `persona` (optional)

**Output:**
- Guided diagnostic flow narrowing down root cause categories (auth, webhook, mapping, rate limit, service outage)
- Most likely cause with explanation
- Step-by-step fix instructions
- Verification steps to confirm the fix
- Prevention tips

**Persona adaptation:**
| Persona | Output style |
|---|---|
| Business Owner (★★★) | "Check your dashboard for a red warning icon", plain English diagnosis |
| Support/Ops (★★★) | "Verify the webhook endpoint returns 200, check logs for 4xx/5xx" |
| Implementer (★★) | Code snippets to replay failed events, log analysis, API response inspection |

**Route:** `POST /api/tools/troubleshooter`
**Page:** `/tools/troubleshooter`
**Slug:** `troubleshooter`
**Category:** `troubleshoot`

---

### Troubleshoot — What Changed?

**Purpose:** Analyse the impact of external changes on existing integrations — API updates, regulation changes, platform deprecations.

**Input:**
- `change` (required, string, max 2000 chars) — description of the change (e.g. "Stripe deprecated API version 2024-12-18" or "Royal Mail updated their shipping API")
- `currentSetup` (optional, string, max 1000 chars) — description of the user's current integration setup
- `persona` (optional)

**Output:**
- Which integrations are affected
- What specifically breaks or changes
- Priority order for addressing changes
- Effort estimate per fix
- Migration steps or workarounds

**Persona adaptation:**
| Persona | Output style |
|---|---|
| Business Owner (★★) | Action items ("call your provider", "your developer needs to update X"), business impact |
| Support/Ops (★★★) | Technical checklist, customer-facing impact, "what to tell affected users" |
| Implementer (★★★) | Migration code, API diff, deprecation timeline, version pinning advice |

**Note on display name:** The tool's display label is "What Changed?" but the slug uses `what-changed` (no question mark). The `ToolId` type uses `what-changed`.

**Route:** `POST /api/tools/what-changed`
**Page:** `/tools/what-changed`
**Slug:** `what-changed`
**Category:** `troubleshoot`

---

## 3. Updated Tool Catalog

### Full tool list (18 tools)

**Explore** — "I'm figuring out what I need"
| Tool | Slug | Status |
|---|---|---|
| Tool Planner | `tool-planner` | New |
| Tool Finder | `tool-finder` | Rebrand (was Package Advisor) |
| Integration Blueprint | `integration-blueprint` | Rebrand (was Integration Planner) |
| Connection Map | `connection-map` | New |

**Set Up** — "I'm building or connecting something"
| Tool | Slug | Status |
|---|---|---|
| Integration Setup | `integration-setup` | New |
| Webhook Builder | `webhook-builder` | New |
| Auth Guide | `auth-guide` | New |
| Workflow Builder | `workflow-builder` | New |
| Code Generator | `code-generator` | Unchanged |
| API Wrapper Generator | `api-wrapper-generator` | Unchanged |

**Troubleshoot** — "Something's wrong or changing"
| Tool | Slug | Status |
|---|---|---|
| Troubleshooter | `troubleshooter` | New |
| What Changed? | `what-changed` | New |
| Error Resolver | `error-resolver` | Rebrand (was Error Explainer) |
| How It Works | `how-it-works` | Rebrand (was Code Explainer) |

**Maintain** — "I want to keep things healthy"
| Tool | Slug | Status |
|---|---|---|
| Connection Health Check | `connection-health-check` | Rebrand (was Health Checker) |
| Compatibility Check | `compatibility-check` | Rebrand (was Dependency Audit) |
| Upgrade Assistant | `upgrade-assistant` | Rebrand (was Migration Assistant) |
| Unit Test Generator | `unit-test-generator` | Unchanged |

### Updated persona descriptions

All tool catalog entries need updated persona descriptions that reflect the broader integration focus. Rebranded tools get new descriptions aligned with their new names. Unchanged tools keep their current descriptions.

### Updated stage descriptions

Stage descriptions in `getStageDescription()` should be updated to reflect the broader platform:

| Stage | Business Owner | Support/Ops | Implementer |
|---|---|---|---|
| Explore | "Figure out what tools and connections you need" | "Research platforms and plan integrations" | "Evaluate tools, APIs, and architecture options" |
| Set Up | "Connect your apps and set up automations" | "Configure integrations and workflows" | "Build connections, webhooks, and automation code" |
| Troubleshoot | "Find and fix connection problems" | "Diagnose integration issues and changes" | "Debug connections, analyse changes and errors" |
| Maintain | "Keep your integrations running smoothly" | "Monitor health and manage updates" | "Audit, test, migrate, and verify integrations" |

---

## 4. Persona Affinity Matrix

All tools are accessible to all personas. This matrix guides router recommendations and dashboard signposting.

| Tool | Business Owner | Support/Ops | Implementer |
|---|---|---|---|
| **Explore** | | | |
| Tool Planner | ★★★ | ★★ | ★ |
| Tool Finder | ★★ | ★★ | ★★★ |
| Integration Blueprint | ★★ | ★★★ | ★★★ |
| Connection Map | ★★★ | ★★★ | ★★ |
| **Set Up** | | | |
| Integration Setup | ★★★ | ★★★ | ★★ |
| Webhook Builder | ★★ | ★★★ | ★★★ |
| Auth Guide | ★★★ | ★★★ | ★★ |
| Workflow Builder | ★★★ | ★★★ | ★★ |
| Code Generator | ★ | ★ | ★★★ |
| API Wrapper Generator | ★ | ★ | ★★★ |
| **Troubleshoot** | | | |
| Troubleshooter | ★★★ | ★★★ | ★★ |
| What Changed? | ★★ | ★★★ | ★★★ |
| Error Resolver | ★★ | ★★★ | ★★★ |
| How It Works | ★ | ★★ | ★★★ |
| **Maintain** | | | |
| Connection Health Check | ★★★ | ★★★ | ★★ |
| Compatibility Check | ★ | ★★ | ★★★ |
| Upgrade Assistant | ★★ | ★★★ | ★★★ |
| Unit Test Generator | ★ | ★ | ★★★ |

The router (`lib/tool-router.ts`) and recommendation engine (`lib/tool-recommendations.ts`) use this affinity to:
- Surface high-affinity tools first in each persona's dashboard view
- Power hero input suggestions per persona
- Rank tool recommendations when the user describes a problem

---

## 5. Implementation Pattern

All new tools follow the established pattern from Phase 9c.

### Per new tool, create:

1. **Claude function** (`lib/claude.ts`) — new async function with Zod schema validation, `personaInstruction` parameter
2. **API route** (`app/api/tools/<slug>/route.ts`) — auth check, body parsing, persona resolution, Claude call, usage increment
3. **Tool page** (`app/tools/<slug>/page.tsx`) — form UI matching existing tool page pattern
4. **Tool catalog entry** (`lib/tool-descriptions.ts`) — add to `ToolId` union, add to `TOOL_CATALOG`
5. **Constant** (`lib/constants.ts`) — add `TOOL_NAME_*` constant
6. **Router update** (`lib/tool-router.ts`) — add routing logic for new tool

### Per rebrand, update:

1. **Tool catalog** (`lib/tool-descriptions.ts`) — update `ToolId`, label, href, descriptions
2. **API route** — rename directory
3. **Tool page** — rename directory
4. **Constant** (`lib/constants.ts`) — update `TOOL_NAME_*`
5. **Router** (`lib/tool-router.ts`) — update references
6. **Redirects** (`next.config.ts`) — add permanent redirect from old URL
7. **Tests** — update references to old names/URLs

---

## 6. Model & Token Strategy

All new tools use `claude-haiku-4-5-20251001` (same as existing tools) with `max_tokens: 1024`. This keeps costs low and response times fast.

Tools with potentially longer outputs (Workflow Builder, Connection Map, Integration Setup) may need `max_tokens: 2048` — determined during implementation based on output quality.

---

## 7. Testing Strategy

Phase 9d tests follow the existing Playwright test patterns:

- **Fast tests** (mocked Claude responses): verify form validation, API route behavior, persona resolution, tool catalog correctness, URL redirects
- **Slow tests** (real Claude API): 1-2 canary tests for new tools to verify prompt quality
- **Rebrand tests**: verify old URLs redirect correctly, new URLs load, tool catalog entries correct

Test count will increase significantly with 8 new tools + 7 rebrands. Exact count determined during implementation planning.

---

## 8. Phase 10 (Deferred)

The following are explicitly out of scope for Phase 9d:

- **Prompt reworks** for rebranded tools (cosmetic rebrands only in 9d)
- **Plain English API Docs** tool (learning category)
- **Glossary / Jargon Buster** tool (learning category)
- **Brand rename** consideration (product-first, brand later)

---

## 9. Success Criteria

- All 18 tools accessible and functional
- Old URLs redirect to new URLs (7 redirects)
- Router correctly recommends new tools based on user input and persona
- Tool catalog displays correct persona-adapted descriptions for all 18 tools
- Business owner dashboard view surfaces high-affinity tools without overwhelming
- All existing tests pass with updated URLs/names
- New tools have fast test coverage for form validation and API routes
