# Phase 9c — Persona Prompt Adaptation

> Design document for Plexease Phase 9c
> Date: 2026-03-09

---

## Overview

Phase 9c makes all 10 tool API routes persona-aware. Claude prompts are adapted based on the active persona so that Business Owners get plain-English answers, Support/Ops users get procedural steps, and Implementers get technical detail. No UI changes — the adaptation happens entirely at the prompt level.

### Scope

- Central persona instruction module (`lib/persona-prompts.ts`)
- Persona resolution helper (`resolvePersona`) with 3-tier fallback
- Retrofit all 10 tool API routes to pass persona context to Claude
- Update tool router to use the active persona's descriptions (currently hardcoded to `business_owner`)
- Extend existing mock tests to assert persona flows through

### Out of scope (deferred to Phase 10)

- Per-tool UI label changes per persona
- Per-route persona instruction refinement (custom instructions per tool)
- Persona-specific result rendering / output structure changes

---

## 1. Persona Resolution

### New helper: `resolvePersona`

A reusable function that resolves the active persona from three sources in priority order:

1. **Request body** `persona` field (explicit client override)
2. **`viewing_as` cookie** (ephemeral session toggle)
3. **User profile** from Supabase (persistent default)

```
resolvePersona(requestBody, cookieStore, userProfile?) → Persona
```

**Default fallback:** If all three sources are empty (e.g., user skipped onboarding, no cookie, no body param), default to `"implementer"`. This is the safest failure mode — too much detail is better than too little.

**Profile parameter:** The helper accepts an optional pre-fetched profile to avoid an extra Supabase round-trip. Most routes already have auth context; the profile can be fetched alongside the existing `authenticateAndCheckUsage` call.

**Location:** `lib/utils.ts` alongside existing `resolveViewingAs()`.

---

## 2. Central Persona Instructions

### New module: `lib/persona-prompts.ts`

Exports a single function:

```
getPersonaInstruction(persona: Persona) → string
```

Returns a system prompt suffix that gets appended to each tool's existing Claude prompt. The instruction tells Claude how to adapt its response tone and emphasis.

### Persona instruction mapping

| Persona | Tone | Emphasis | Avoids |
|---------|------|----------|--------|
| Business Owner | Plain English, reassuring | Impact, cost, risk, next steps | Jargon, raw code blocks, version numbers |
| Support/Ops | Clear, procedural | Step-by-step fixes, what to tell the customer | Deep architecture, theory |
| Implementer | Direct, technical | Code snippets, exact commands, edge cases | Over-explaining basics |

### Example instruction (Business Owner)

```
Adapt your response for a business owner with limited technical background.
Use plain English. Avoid jargon and raw code blocks.
Focus on business impact, risk, cost, and clear next steps.
When technical detail is unavoidable, explain it in simple terms.
```

### Future refinement (Phase 10)

The central module may later accept a `toolName` parameter to provide per-tool tailored instructions. For 9c, the same instruction applies to all tools.

---

## 3. Tool API Route Changes

### Current pattern (all 10 routes)

```
1. authenticateAndCheckUsage(toolName) → { context: { userId, plan } }
2. Parse & validate request body
3. Call lib/claude.ts function (e.g., getCodeExplanation)
4. incrementUsage(userId, toolName)
5. Return response
```

### Updated pattern

```
1. authenticateAndCheckUsage(toolName) → { context: { userId, plan } }
2. Parse & validate request body
3. Resolve persona via resolvePersona(body, cookies, profile?)
4. Call lib/claude.ts function with persona instruction appended
5. incrementUsage(userId, toolName)
6. Return response
```

### Prompt injection approach

Each `lib/claude.ts` function gains an optional `personaInstruction?: string` parameter. The instruction is appended to the existing user-message content (the current prompts use user messages, not system messages).

The 10 tools and their `lib/claude.ts` functions:

| Tool | Function | Route |
|------|----------|-------|
| Code Explainer | `getCodeExplanation` | `app/api/tools/code-explainer/route.ts` |
| Error Explainer | `getErrorExplanation` | `app/api/tools/error-explainer/route.ts` |
| Package Advisor | `getPackageRecommendations` | `app/api/tools/package-advisor/route.ts` |
| Integration Planner | `getIntegrationPlan` | `app/api/tools/integration-planner/route.ts` |
| Code Generator | `getGeneratedCode` | `app/api/tools/code-generator/route.ts` |
| API Wrapper Generator | `getApiWrapper` | `app/api/tools/api-wrapper-generator/route.ts` |
| Unit Test Generator | `getUnitTests` | `app/api/tools/unit-test-generator/route.ts` |
| Dependency Audit | `getDependencyAudit` | `app/api/tools/dependency-audit/route.ts` |
| Health Checker | `getHealthCheck` | `app/api/tools/health-checker/route.ts` |
| Migration Assistant | `getMigrationPlan` | `app/api/tools/migration-assistant/route.ts` |

---

## 4. Tool Router Fix

The tool router at `app/api/tools/router/route.ts` currently hardcodes `business_owner` descriptions when building the tool list for Claude:

```typescript
tool.descriptions.business_owner  // hardcoded
```

This should resolve the active persona and use the matching description variant from `TOOL_CATALOG`. The router already has access to cookies — add `resolvePersona` to select the right description key.

---

## 5. Testing Strategy

### Approach: extend existing mock tests

All 10 tools have existing Playwright mock tests that intercept the API route and verify the happy path. Extend these tests to assert that the intercepted request/response pipeline includes persona context.

Specifically, each existing mock test should:

1. Set a `viewing_as` cookie (or let it default)
2. Fill and submit the tool form as normal
3. Assert the mocked API response is rendered (existing assertion)
4. Verify persona was included in the pipeline (new assertion on intercepted route)

### No new canary tests

Existing canary tests already prove the Claude API pipeline works end-to-end. Persona adds a prompt suffix — mock tests confirming it reaches the prompt are sufficient.

### Expected test count change

No new test files. Enhanced assertions in existing tests. Total remains ~125.

---

## 6. Implementation Notes

### Profile fetching in routes

The `authenticateAndCheckUsage` helper returns `{ userId, plan }`. Rather than modifying this shared helper, each route can optionally fetch the user profile via `getUserProfile(userId)` from `lib/user-profile.ts` when needed for persona resolution. This keeps the change localised.

However, since all 10 routes will now need the profile, a pragmatic alternative is to extend `authenticateAndCheckUsage` to also return the user's persona (a single extra column query). This avoids 10 separate `getUserProfile` calls. The implementation plan should evaluate which approach is cleaner.

### No schema changes

All required tables (`user_profiles`, `sessions`) already exist from Phase 9a. No migrations needed.

### No UI changes

Tool forms and result components remain unchanged. The persona adaptation happens entirely in the Claude prompt — the AI adjusts its language, not the frontend.

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Persona instruction dilutes JSON output compliance | Claude returns invalid JSON | Keep instruction concise; test JSON parsing still works |
| Prompt length increase slows response | Marginal latency increase | Instruction is ~50 words — negligible vs existing prompts |
| `resolvePersona` adds a DB call per request | Extra latency | Accept optional pre-fetched profile; consider extending auth helper |

---

## 8. Phase 10 Preview

Based on decisions made during this design, Phase 10 (Persona Refinement) should include:

- **Per-tool UI label changes** — form labels/descriptions adapt per persona
- **Per-route persona instructions** — tailored Claude guidance per tool (evolve central module to accept `toolName`)
- **Persona-specific result rendering** — components render differently per persona (e.g., summary-first vs code-first)
