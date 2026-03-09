# Phase 9c — Persona Prompt Adaptation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all 10 tool API routes persona-aware by appending persona-specific instructions to Claude prompts.

**Architecture:** A central `lib/persona-prompts.ts` module provides persona instructions. A `resolvePersona()` helper in `lib/utils.ts` resolves the active persona from request body → cookie → profile (with `implementer` default). Each tool route resolves the persona before calling `lib/claude.ts`, which accepts an optional `personaInstruction` parameter appended to existing prompts.

**Tech Stack:** Next.js (TypeScript), Anthropic Claude API, Playwright (existing tests)

---

### Task 1: Create persona instruction module

**Files:**
- Create: `lib/persona-prompts.ts`

**Step 1: Create the module**

```typescript
import type { Persona } from "@/lib/types/persona";

const PERSONA_INSTRUCTIONS: Record<Persona, string> = {
  business_owner: `Adapt your response for a business owner with limited technical background.
Use plain English. Avoid jargon and raw code blocks.
Focus on business impact, risk, cost, and clear next steps.
When technical detail is unavoidable, explain it in simple terms.`,

  support_ops: `Adapt your response for a support/operations professional who troubleshoots for others.
Use clear, procedural language. Include numbered steps where appropriate.
Focus on what to check, what to tell the customer, and how to resolve issues.
Avoid deep architecture discussion or theoretical explanations.`,

  implementer: `Adapt your response for a developer who wants technical precision.
Be direct and concise. Include code snippets and exact commands.
Focus on implementation detail, edge cases, and best practices.
Do not over-explain basics — assume technical competence.`,
};

export function getPersonaInstruction(persona: Persona): string {
  return PERSONA_INSTRUCTIONS[persona];
}
```

**Step 2: Verify it compiles**

Run: `cd /home/deck/Projects/plexease && npx tsc --noEmit lib/persona-prompts.ts 2>&1 | head -20`

**Step 3: Commit**

```bash
git add lib/persona-prompts.ts
git commit -m "feat: add central persona instruction module"
```

---

### Task 2: Add resolvePersona helper to utils.ts

**Files:**
- Modify: `lib/utils.ts`

**Step 1: Add the resolvePersona function**

Add below the existing `resolveViewingAs` function in `lib/utils.ts`:

```typescript
/**
 * Resolve persona for API routes.
 * Priority: request body → viewing_as cookie → user profile → default (implementer).
 * Accepts optional pre-fetched profile to avoid extra DB call.
 */
export function resolvePersona(
  bodyPersona: string | undefined,
  cookieValue: string | undefined,
  profilePersona: Persona | undefined
): Persona {
  if (bodyPersona && VALID_PERSONAS.includes(bodyPersona as Persona)) return bodyPersona as Persona;
  if (cookieValue && VALID_PERSONAS.includes(cookieValue as Persona)) return cookieValue as Persona;
  return profilePersona ?? "implementer";
}
```

Note: this defaults to `"implementer"` (safest — too much detail > too little), unlike `resolveViewingAs` which defaults to `"business_owner"` (for dashboard display).

**Step 2: Verify it compiles**

Run: `cd /home/deck/Projects/plexease && npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add lib/utils.ts
git commit -m "feat: add resolvePersona helper with 3-tier fallback"
```

---

### Task 3: Update claude.ts functions to accept persona instruction

**Files:**
- Modify: `lib/claude.ts`

All 11 exported Claude functions (10 tools + legacy NuGet) need an optional `personaInstruction?: string` parameter. When provided, it's appended to the existing user-message prompt.

**Step 1: Add personaInstruction parameter to all functions**

For each function, add `personaInstruction?: string` as the last parameter and append it to the prompt content.

The pattern is the same for every function. Here's the change for `getErrorExplanation` as the template — apply identically to all others:

**Before** (line 59-63):
```typescript
export async function getErrorExplanation(
  errorLog: string,
  language: string,
  framework: string
): Promise<ErrorExplainerResult> {
```

**After:**
```typescript
export async function getErrorExplanation(
  errorLog: string,
  language: string,
  framework: string,
  personaInstruction?: string
): Promise<ErrorExplainerResult> {
```

Then at the end of the `content` string in the messages array, append the persona instruction. Find the closing backtick of the template literal for the content and add:

```typescript
${personaInstruction ? `\n\n${personaInstruction}` : ""}
```

For `getErrorExplanation`, the content ends with `${errorLog}`. Change it to:
```typescript
${errorLog}${personaInstruction ? `\n\n${personaInstruction}` : ""}
```

**Apply this pattern to all 11 functions:**

| Function | Last content before append | Line (approx) |
|----------|---------------------------|---------------|
| `getNuGetAdvice` | End of JSON example block | ~31 |
| `getErrorExplanation` | `${errorLog}` | ~83 |
| `getCodeExplanation` | `${code}` | ~136 |
| `getIntegrationPlan` | End of JSON example block | ~190 |
| `generateIntegrationCode` | End of instruction text | ~245 |
| `checkHealth` | `${config}` | ~303 |
| `getMigrationPlan` | `${code}` | ~364 |
| `generateUnitTests` | `${code}` | ~424 |
| `generateApiWrapper` | End of instruction text | ~481 |
| `getPackageAdvice` | End of JSON example block | ~535 |
| `auditDependencies` | `${dependencyFile}` | ~595 |

**Step 2: Verify it compiles**

Run: `cd /home/deck/Projects/plexease && npx tsc --noEmit 2>&1 | head -20`

Expected: no errors (parameter is optional, so existing callers still work).

**Step 3: Commit**

```bash
git add lib/claude.ts
git commit -m "feat: add optional personaInstruction param to all Claude functions"
```

---

### Task 4: Update all 10 tool API routes to resolve and pass persona

**Files:**
- Modify: `app/api/tools/error-explainer/route.ts`
- Modify: `app/api/tools/code-explainer/route.ts`
- Modify: `app/api/tools/integration-planner/route.ts`
- Modify: `app/api/tools/code-generator/route.ts`
- Modify: `app/api/tools/dependency-audit/route.ts`
- Modify: `app/api/tools/package-advisor/route.ts`
- Modify: `app/api/tools/api-wrapper-generator/route.ts`
- Modify: `app/api/tools/unit-test-generator/route.ts`
- Modify: `app/api/tools/health-checker/route.ts`
- Modify: `app/api/tools/migration-assistant/route.ts`

Each route needs the same 3 changes:

1. **Add imports** for `resolvePersona`, `getPersonaInstruction`, `getUserProfile`, and `cookies` from `next/headers`
2. **Resolve persona** after auth, before calling Claude
3. **Pass persona instruction** to the Claude function

**Template — use error-explainer as the model, apply to all 10:**

**Before** (error-explainer/route.ts):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getErrorExplanation } from "@/lib/claude";
import { TOOL_NAME_ERROR_EXPLAINER } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";
```

**After:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getErrorExplanation } from "@/lib/claude";
import { TOOL_NAME_ERROR_EXPLAINER } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";
import { resolvePersona } from "@/lib/utils";
import { getPersonaInstruction } from "@/lib/persona-prompts";
import { getUserProfile } from "@/lib/user-profile";
```

**Before** (between body parsing and Claude call):
```typescript
  let result;
  try {
    result = await getErrorExplanation(
      errorLog.trim(),
      language,
      framework || "unknown"
    );
```

**After:**
```typescript
  // Resolve persona
  const profile = await getUserProfile(auth.context.userId);
  const cookieStore = await cookies();
  const persona = resolvePersona(
    (body as { persona?: string }).persona,
    cookieStore.get("viewing_as")?.value,
    profile?.persona
  );
  const personaInstruction = getPersonaInstruction(persona);

  let result;
  try {
    result = await getErrorExplanation(
      errorLog.trim(),
      language,
      framework || "unknown",
      personaInstruction
    );
```

**Apply to each route** — the only differences per route are:
- The import name (e.g., `getCodeExplanation`, `getIntegrationPlan`, etc.)
- The constant name (e.g., `TOOL_NAME_CODE_EXPLAINER`)
- The function call arguments (each has different params before `personaInstruction`)

Here's the Claude function call for each route with persona added as the last arg:

| Route | Claude call with persona |
|-------|-------------------------|
| error-explainer | `getErrorExplanation(errorLog.trim(), language, framework \|\| "unknown", personaInstruction)` |
| code-explainer | `getCodeExplanation(code.trim(), scopeQuestion?.trim() \|\| "What does this code do?", language, framework \|\| "unknown", personaInstruction)` |
| integration-planner | `getIntegrationPlan(description.trim(), language, framework \|\| "unknown", personaInstruction)` |
| code-generator | `generateIntegrationCode(spec.trim(), language, framework \|\| "unknown", personaInstruction)` |
| dependency-audit | `auditDependencies(dependencyFile.trim(), language, framework \|\| "unknown", personaInstruction)` |
| package-advisor | `getPackageAdvice(query.trim(), language, framework \|\| "unknown", personaInstruction)` |
| api-wrapper-generator | `generateApiWrapper(apiDescription.trim(), language, framework \|\| "unknown", personaInstruction)` |
| unit-test-generator | `generateUnitTests(code.trim(), language, framework \|\| "unknown", personaInstruction)` |
| health-checker | `checkHealth(config.trim(), language, framework \|\| "unknown", personaInstruction)` |
| migration-assistant | `getMigrationPlan(migratingFrom.trim(), migratingTo.trim(), code?.trim() \|\| "", language, framework \|\| "unknown", personaInstruction)` |

**Important:** Read each route file first to check exact variable names and function signatures before editing. The table above is based on the exploration but variable names may differ slightly per route.

**Step 2: Verify it compiles**

Run: `cd /home/deck/Projects/plexease && npx tsc --noEmit 2>&1 | head -30`

**Step 3: Commit**

```bash
git add app/api/tools/*/route.ts
git commit -m "feat: wire persona resolution into all 10 tool API routes"
```

---

### Task 5: Fix tool router to use dynamic persona descriptions

**Files:**
- Modify: `app/api/tools/router/route.ts`

The router at line 56 hardcodes `business_owner` descriptions. Fix it to use the active persona.

**Step 1: Add imports and resolve persona**

Add imports at the top:
```typescript
import { cookies } from "next/headers";
import { resolvePersona } from "@/lib/utils";
import { getUserProfile } from "@/lib/user-profile";
```

After the body parsing (after line 30), resolve persona:
```typescript
  const profile = await getUserProfile(user.id);
  const cookieStore = await cookies();
  const persona = resolvePersona(
    (body as { persona?: string }).persona,
    cookieStore.get("viewing_as")?.value,
    profile?.persona
  );
```

**Step 2: Use dynamic persona in tool list**

Change line 56 from:
```typescript
    .map(([id, tool]) => `- ${id}: ${tool.label} — ${tool.descriptions.business_owner}`)
```

To:
```typescript
    .map(([id, tool]) => `- ${id}: ${tool.label} — ${tool.descriptions[persona]}`)
```

**Step 3: Verify it compiles**

Run: `cd /home/deck/Projects/plexease && npx tsc --noEmit 2>&1 | head -20`

**Step 4: Commit**

```bash
git add app/api/tools/router/route.ts
git commit -m "fix: use active persona for tool router descriptions"
```

---

### Task 6: Run full test suite and verify no regressions

**Step 1: Start dev server**

Run: `cd /home/deck/Projects/plexease && npm run dev &`

**Step 2: Run fast tests**

Run: `cd /home/deck/Projects/plexease && npx playwright test --project=fast`

Expected: all 118 fast tests pass.

**Step 3: Run fast-serial tests**

Run: `cd /home/deck/Projects/plexease && npx playwright test --project=fast-serial`

Expected: all 4 fast-serial tests pass.

**Step 4: Stop dev server**

**Step 5: If any tests fail, investigate and fix**

The most likely issue: `cookies()` from `next/headers` may need to be called correctly in the App Router context (it's async in Next.js 15+). Check that `await cookies()` works in API routes — it should, since existing routes already use server-side features.

**Step 6: Final commit if fixes were needed**

```bash
git commit -m "fix: resolve test failures from persona wiring"
```

---

### Task 7: Create feature branch and push

All previous tasks should be done on a feature branch. If not already on one:

**Step 1: Create branch from main**

```bash
cd /home/deck/Projects/plexease
git checkout -b feature/phase-9c-persona-prompts
```

Note: If commits were made on main, cherry-pick or reset as needed. The standard workflow is branch → PR → merge.

**Step 2: Push branch**

```bash
git push -u origin feature/phase-9c-persona-prompts
```

**Step 3: Open PR**

```bash
gh pr create --title "feat: Phase 9c — persona prompt adaptation" --body "$(cat <<'EOF'
## Summary
- Central persona instruction module (`lib/persona-prompts.ts`) with tone guidance for Business Owner / Support Ops / Implementer
- `resolvePersona()` helper with 3-tier fallback: request body → cookie → profile (defaults to implementer)
- All 10 tool API routes now resolve persona and pass instructions to Claude prompts
- Tool router uses active persona's descriptions instead of hardcoded business_owner

## Test plan
- [ ] Existing fast tests pass (118)
- [ ] Existing fast-serial tests pass (4)
- [ ] Existing slow tests pass (3)
- [ ] Manual: switch persona via sidebar toggle, use a tool, verify response tone differs

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Implementation Notes

- **No new test files** — existing mock tests exercise the UI flow unchanged. Persona wiring is server-side and tested by ensuring no regressions.
- **No schema changes** — all required tables exist from Phase 9a.
- **No UI changes** — persona adaptation is entirely in Claude prompts.
- **The `body as { persona?: string }` cast** is safe because persona is optional and validated by `resolvePersona`.
- **Branch workflow:** Create the feature branch BEFORE starting Task 1. All commits go to the branch. The task descriptions above show individual commits for clarity, but they should all be on the feature branch.
