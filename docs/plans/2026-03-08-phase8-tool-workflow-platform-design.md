# Phase 8 — Tool Workflow Platform Design

## Vision

Transform Plexease from a single-tool utility into a guided workflow platform. 10 tools across 4 stages (Understand → Decide → Build → Maintain) that hand off to each other, creating a coherent user journey accessible to developers and non-developers alike. Language-agnostic with a stack selector.

## User Journey

```
UNDERSTAND          DECIDE                BUILD                      MAINTAIN
┌──────────────┐   ┌──────────────────┐   ┌─────────────────────┐   ┌──────────────────┐
│Code Explainer│──→│Integration       │──→│Integration Code     │──→│Dependency Audit  │
│              │   │Planner           │   │Generator            │   │                  │
│Error         │   │                  │   │                     │   │Health Checker    │
│Explainer     │   │Package Advisor   │   │API Wrapper Generator│   │                  │
│              │   │(inc. NuGet)      │   │                     │   │Migration         │
│              │   │                  │   │Unit Test Generator  │   │Assistant         │
└──────────────┘   └──────────────────┘   └─────────────────────┘   └──────────────────┘
      ↑                                                                     │
      └─────────────────────────────────────────────────────────────────────┘
                              (Maintain loops back to Understand)
```

### Hand-off Flows

```
Code Explainer ──→ Package Advisor / Integration Planner
Error Explainer ──→ Dependency Audit / Health Checker

Package Advisor ──→ Integration Code Generator
Integration Planner ──→ Integration Code Generator / API Wrapper Generator

Integration Code Generator ──→ Unit Test Generator
API Wrapper Generator ──→ Unit Test Generator
Unit Test Generator ──→ Dependency Audit

Dependency Audit ──→ Migration Assistant
Health Checker ──→ Error Explainer
Migration Assistant ──→ Integration Code Generator
```

## Core Persona

Broad audience — not just developers. Anyone working with integrations: agency devs, product teams, semi-technical business owners. Tools lower the barrier to understanding and building integrations.

## Phasing

### Phase 8a — Infrastructure + 1 Tool Per Stage

**Shared infrastructure:**
- `StackSelector` component (language + framework, persisted to localStorage)
- `WorkflowContext` system (localStorage, 24h TTL, schema validation, graceful fallback)
- `WorkflowNext` component (context-aware recommendations with Claude-generated copy)
- Dashboard hub (4 stages displayed visually, tools grouped under each, recent activity)
- Guided input UX (scoping questions before main query, character limits per tool)
- NuGet Advisor migration into Package Advisor (redirect `/tools/nuget-advisor` → `/tools/package-advisor?language=csharp`)

**Tools (one per stage):**
- Code Explainer (Understand) — 5,000 char limit
- Integration Planner (Decide) — 2,000 char limit
- Integration Code Generator (Build) — 2,000 char limit
- Dependency Audit (Maintain) — 5,000 char limit

**Testing:**
- Per-tool fast tests (mocked): form, results, usage, language selector, "What's next?"
- Per-tool slow canary: one real Claude call
- Shared component tests: StackSelector, WorkflowNext, WorkflowContext

### Phase 8b — Remaining Tools

- Error Explainer (Understand)
- Package Advisor (Decide) — NuGet Advisor folded in as C#/.NET mode
- API Wrapper Generator (Build)
- Unit Test Generator (Build)
- Health Checker (Maintain)
- Migration Assistant (Maintain)

Same per-tool test pattern as Phase 8a.

### Phase 8a-e2e — End-to-End Workflow Tests

- Full journey: Code Explainer → Integration Planner → Integration Code Generator → Dependency Audit
- Verify context passes correctly between each step
- Verify "What's next?" links navigate and pre-fill correctly
- All mocked APIs (testing hand-off UX, not Claude output)

### Phase 8c — UX Review

- Mobile responsiveness: dashboard hub, tool cards, workflow navigation
- First-time user guidance: onboarding prompt ("What are you trying to do?") routing to correct starting tool
- Tool output history: cache last result per tool in localStorage so users can navigate back
- Overall flow polish based on real usage patterns

### Phase 8d — Security Review

- localStorage data minimisation: audit what's stored, remove anything beyond pre-fill fields, never store full Claude responses
- Input sanitisation audit: ensure no tool renders Claude output as raw HTML, no `dangerouslySetInnerHTML`
- Per-minute rate limiting: max 5 requests/minute per user to prevent automated abuse
- Claude output rendering safety: verify all output goes through React's default escaping

### Phase 9 — Usage Strategy

- Review token costs per tool based on real data
- Free tier tuning (20 shared uses may need adjustment)
- Upgrade incentive strategy
- Consider per-tool or tiered limits

## Architecture

### Workflow Context System (localStorage)

```typescript
interface WorkflowContext {
  sourceToolId: string;          // e.g. "code-explainer"
  language: string;              // e.g. "csharp"
  framework: string;             // e.g. ".NET 8"
  payload: Record<string, unknown>; // tool-specific output for next tool
  timestamp: string;             // ISO 8601, TTL: 24h
}
```

- Each tool **writes** context on completion, **reads** on load
- If context exists from a compatible source tool, form pre-fills with banner: "Continuing from Code Explainer — C#, .NET 8"
- Each tool declares which source tools it accepts context from
- Context from unlisted sources is silently ignored (user navigated manually)

### Language/Stack Selector

Shared `StackSelector` component across all tools:
- Languages: C#, JavaScript/TypeScript, Python, PHP, Java, Go
- Frameworks (contextual per language): .NET 8, Node/Express, Django, Laravel, Spring etc.
- Persisted in localStorage, carries across tools without re-selection

### "What's Next?" Component

Shared `WorkflowNext` component rendered below every tool's results:
- Shows 1-2 recommended next tools based on current tool's stage and output
- Context-aware copy generated by Claude as part of the tool response (not static templates)
- Example: "Your code uses the Stripe.NET package for payment processing. The **Integration Planner** can help you map out a full integration strategy — covering webhook handling, error recovery, and testing approaches for your C# Stripe setup."
- Displays what context will be carried (e.g. "Language: C#, Package: Stripe.NET")
- On click: confirmation prompt "Pass this context to [Tool Name] and open it?"
- Yes → saves context to localStorage, navigates to next tool
- No → stays on current page

### Dashboard Hub

The dashboard becomes a workflow hub:
- 4 stages displayed visually with tools grouped under each
- Recent activity section showing where the user left off
- Replaces current simple sidebar list (sidebar still exists for quick nav)

### Guided Input UX

Instead of large code dumps, tools use scoping questions:
1. "What are you trying to understand?" (dropdown: how it works, specific function, why it's failing, dependencies)
2. "Paste the relevant section" with guidance: "Focus on the function or class, not the whole file"
3. If pasted code references external dependencies, Claude's response suggests: "I'd need to see the `PaymentService` class to fully explain this"

Iterative small queries that build understanding rather than one massive dump.

### Character Limits Per Tool

| Tool | Limit | Rationale |
|------|-------|-----------|
| Code Explainer | 5,000 chars | ~150 lines, enough for a class/module |
| Integration Planner | 2,000 chars | Description/spec, not raw code |
| Integration Code Generator | 2,000 chars | Takes a plan, not raw code |
| Dependency Audit | 5,000 chars | Dependency files can be long |
| Error Explainer | 3,000 chars | Stack traces + context |
| Package Advisor | 1,000 chars | Package names + requirements |
| API Wrapper Generator | 2,000 chars | API spec/description |
| Unit Test Generator | 5,000 chars | Code to test |
| Health Checker | 2,000 chars | Config/connection details |
| Migration Assistant | 5,000 chars | Project files can be long |

Live character counter shown in UI. Clear message when approaching limit.

## Tool Specifications

### Code Explainer (Understand)

**Input:** Code snippet + scoping question (what are you trying to understand?)
**Output:** Plain English explanation, detected packages/patterns, suggested next steps
**Hands off to:** Package Advisor, Integration Planner
**Accepts context from:** Error Explainer, Health Checker

### Error Explainer (Understand)

**Input:** Error log / stack trace + language context
**Output:** Root cause analysis, fix suggestions, related documentation
**Hands off to:** Dependency Audit, Health Checker
**Accepts context from:** Health Checker

### Integration Planner (Decide)

**Input:** "I need to connect System A to System B" + language/framework
**Output:** Recommended approach, packages, architecture overview, considerations
**Hands off to:** Integration Code Generator, API Wrapper Generator
**Accepts context from:** Code Explainer

### Package Advisor (Decide)

**Input:** Package name or requirement description + language
**Output:** Package recommendation, alternatives, compatibility, version advice
**Hands off to:** Integration Code Generator
**Accepts context from:** Code Explainer, Integration Planner
**Note:** NuGet Advisor folded in — C#/.NET mode of this tool

### Integration Code Generator (Build)

**Input:** Integration plan/spec + language/framework
**Output:** Boilerplate code (controllers, handlers, DTOs, config)
**Hands off to:** Unit Test Generator
**Accepts context from:** Integration Planner, Package Advisor, Migration Assistant

### API Wrapper Generator (Build)

**Input:** API description/spec + target language
**Output:** Typed client code, models, authentication setup
**Hands off to:** Unit Test Generator
**Accepts context from:** Integration Planner

### Unit Test Generator (Build)

**Input:** Code to test + framework preference
**Output:** Test file(s) with unit tests, mocking setup
**Hands off to:** Dependency Audit
**Accepts context from:** Integration Code Generator, API Wrapper Generator

### Dependency Audit (Maintain)

**Input:** Dependency file contents (package.json, .csproj, requirements.txt etc.)
**Output:** Outdated packages, known vulnerabilities, upgrade recommendations
**Hands off to:** Migration Assistant
**Accepts context from:** Unit Test Generator, Code Explainer

### Health Checker (Maintain)

**Input:** Config/connection details + integration description
**Output:** Configuration validation, common issues check, recommendations
**Hands off to:** Error Explainer
**Accepts context from:** Error Explainer

### Migration Assistant (Maintain)

**Input:** Current framework/version + target + relevant code
**Output:** Migration steps, breaking changes, code transformation suggestions
**Hands off to:** Integration Code Generator
**Accepts context from:** Dependency Audit

## Data & Storage

### localStorage Keys

- `plexease_stack` — selected language + framework
- `plexease_workflow_context` — current hand-off context (24h TTL)
- `plexease_tool_results_{toolId}` — cached last result per tool (for back-navigation)
- `plexease_onboarding_dismissed` — whether first-time prompt has been dismissed

### Supabase (unchanged)

- Auth, usage tracking (20/month shared across all tools), subscriptions
- `usage` table already supports per-tool tracking via `tool_name` column
- No new tables needed

## Security Considerations

- **localStorage minimisation:** Only store structured pre-fill fields, never full Claude responses or raw user code in workflow context
- **Input sanitisation:** All Claude output rendered via React JSX (default escaping). No `dangerouslySetInnerHTML` anywhere
- **Rate limiting:** Per-minute cap (5 req/min) in API routes alongside existing monthly limits
- **Code in transit:** User code sent to Claude API over HTTPS, not stored server-side beyond the request lifecycle

## Error Handling in Hand-offs

All failures fall back gracefully to an empty form. Hand-off context is **convenience, never dependency**.

| Scenario | Handling |
|----------|----------|
| Schema mismatch | Validate against expected schema, show "Couldn't load previous context" message |
| Expired context (>24h) | Clear stale key, show "Previous session expired" message |
| Incompatible source tool | Silently ignore, load empty form |
| Corrupted localStorage | try/catch on all reads, clear corrupted key, load empty form |

## NuGet Advisor Migration

- Package Advisor becomes the generalised tool
- When language is C#/.NET, it behaves identically to current NuGet Advisor
- `/tools/nuget-advisor` redirects to `/tools/package-advisor?language=csharp`
- Existing tests updated to target new route
- Usage history preserved (update `tool_name` in usage table or track both)
