# Phase 9d — Tool Expansion & Rebranding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand from 10 to 18 tools — rebrand 7 existing tools for broader appeal, add 8 new integration tools, all persona-aware from day one.

**Architecture:** Follow the established tool pattern: constant in `lib/constants.ts` → Claude function with Zod schema in `lib/claude.ts` → API route in `app/api/tools/<slug>/route.ts` → form component in `components/tools/<slug>/` → page in `app/(dashboard)/tools/<slug>/page.tsx` → catalog entry in `lib/tool-descriptions.ts` → test fixtures + page objects + specs in `playwright/`. Rebrands are cosmetic: rename directories, update references, add URL redirects.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Anthropic SDK (claude-haiku-4-5-20251001), Zod, Playwright

---

## Batch 1: Rebrands (Tasks 1–7)

Rename 7 existing tools. Each rebrand follows the same checklist. Do all 7 before moving on — they're independent and mechanical.

**For every rebrand task below, follow these exact steps:**

1. Update `lib/constants.ts` — rename the `TOOL_NAME_*` constant
2. Update `lib/tool-descriptions.ts` — change the `ToolId` union member, update `TOOL_CATALOG` entry (label, href, slug key, descriptions)
3. Rename API route directory: `app/api/tools/<old>/` → `app/api/tools/<new>/`
4. Update the import in the renamed route file to use the new constant name
5. Rename tool page directory: `app/(dashboard)/tools/<old>/` → `app/(dashboard)/tools/<new>/`
6. Update the page heading and description text
7. Rename form component directory: `components/tools/<old>/` → `components/tools/<new>/`
8. Update the form's fetch URL to `/api/tools/<new>`
9. Rename result cards component directory if applicable
10. Update `lib/tool-router.ts` — change the `ToolId` reference in the keyword map
11. Update `lib/tool-recommendations.ts` — change any `ToolId` references in `PLATFORM_TOOLS` and `COMFORT_TOOL_PRIORITY`
12. Add redirect in `next.config.ts`: `{ source: '/tools/<old>', destination: '/tools/<new>', permanent: true }`
13. Rename test fixtures: `playwright/mocks/fixtures/<old>-success.json` → `<new>-success.json`, same for `-error.json`
14. Update `playwright/fixtures/index.ts` — rename the `mockApi` method and update its route pattern
15. Rename page object: `playwright/pages/<old>.page.ts` → `<new>.page.ts`, update class name, `goto()` URL, heading matcher
16. Update test spec: `playwright/tests/fast/<old>.spec.ts` → `<new>.spec.ts`, update imports and test names
17. Run `npm run build` to verify no broken imports
18. Run `npx playwright test --project=fast` to verify tests pass
19. Commit: `refactor: rename <Old Name> to <New Name>`

---

### Task 1: Rename Code Explainer → How It Works

| Item | Old | New |
|------|-----|-----|
| Constant | `TOOL_NAME_CODE_EXPLAINER` | `TOOL_NAME_HOW_IT_WORKS` |
| Constant value | `"code-explainer"` | `"how-it-works"` |
| ToolId | `"code-explainer"` | `"how-it-works"` |
| Label | `"Code Explainer"` | `"How It Works"` |
| API route dir | `app/api/tools/code-explainer/` | `app/api/tools/how-it-works/` |
| Page dir | `app/(dashboard)/tools/code-explainer/` | `app/(dashboard)/tools/how-it-works/` |
| Form component dir | `components/tools/code-explainer/` | `components/tools/how-it-works/` |
| Fetch URL | `/api/tools/code-explainer` | `/api/tools/how-it-works` |
| Test spec | `playwright/tests/fast/code-explainer.spec.ts` | `playwright/tests/fast/how-it-works.spec.ts` |
| Page object | `playwright/pages/code-explainer.page.ts` | `playwright/pages/how-it-works.page.ts` |
| Fixtures | `code-explainer-success.json` / `code-explainer-error.json` | `how-it-works-success.json` / `how-it-works-error.json` |
| mockApi method | `codeExplainer` | `howItWorks` |
| Redirect | `/tools/code-explainer` → `/tools/how-it-works` |

**Updated descriptions:**
```typescript
"how-it-works": {
  label: "How It Works",
  href: "/tools/how-it-works",
  category: "troubleshoot",
  descriptions: {
    business_owner: "Understand what a piece of code or configuration does in plain English",
    support_ops: "Break down code snippets to understand logic and dependencies",
    implementer: "Parse code, identify patterns and packages",
  },
},
```

**Router keyword update** (line ~23 in `lib/tool-router.ts`):
```typescript
[/\b(explain|understand|what\s*does|how\s*does)\b/, "how-it-works"],
```

Follow steps 1–19 from the rebrand checklist above.

---

### Task 2: Rename Error Explainer → Error Resolver

| Item | Old | New |
|------|-----|-----|
| Constant | `TOOL_NAME_ERROR_EXPLAINER` | `TOOL_NAME_ERROR_RESOLVER` |
| Constant value | `"error-explainer"` | `"error-resolver"` |
| ToolId | `"error-explainer"` | `"error-resolver"` |
| Label | `"Error Explainer"` | `"Error Resolver"` |
| API route dir | `app/api/tools/error-explainer/` | `app/api/tools/error-resolver/` |
| Page dir | `app/(dashboard)/tools/error-explainer/` | `app/(dashboard)/tools/error-resolver/` |
| Form component dir | `components/tools/error-explainer/` | `components/tools/error-resolver/` |
| Fetch URL | `/api/tools/error-explainer` | `/api/tools/error-resolver` |
| Test spec | `playwright/tests/fast/error-explainer.spec.ts` | `playwright/tests/fast/error-resolver.spec.ts` |
| Page object | `playwright/pages/error-explainer.page.ts` | `playwright/pages/error-resolver.page.ts` |
| Fixtures | `error-explainer-*.json` | `error-resolver-*.json` |
| mockApi method | `errorExplainer` | `errorResolver` |
| Redirect | `/tools/error-explainer` → `/tools/error-resolver` |

**Updated descriptions:**
```typescript
"error-resolver": {
  label: "Error Resolver",
  href: "/tools/error-resolver",
  category: "troubleshoot",
  descriptions: {
    business_owner: "Find out why something stopped working and how to fix it",
    support_ops: "Diagnose error messages and stack traces with resolution steps",
    implementer: "Root cause analysis from errors and traces with fix suggestions",
  },
},
```

**Router keyword update:**
```typescript
[/\b(error|exception|stack\s*trace|crash|fail|broke|broken|not\s*working|stopped)\b/, "error-resolver"],
```

**Recommendations update** — in `PLATFORM_TOOLS`, change all `"error-explainer"` → `"error-resolver"`. In `COMFORT_TOOL_PRIORITY.guided`, change `"error-explainer"` → `"error-resolver"`.

Follow steps 1–19 from the rebrand checklist above.

---

### Task 3: Rename Package Advisor → Tool Finder

| Item | Old | New |
|------|-----|-----|
| Constant | `TOOL_NAME_PACKAGE_ADVISOR` | `TOOL_NAME_TOOL_FINDER` |
| Constant value | `"package-advisor"` | `"tool-finder"` |
| ToolId | `"package-advisor"` | `"tool-finder"` |
| Label | `"Package Advisor"` | `"Tool Finder"` |
| API route dir | `app/api/tools/package-advisor/` | `app/api/tools/tool-finder/` |
| Page dir | `app/(dashboard)/tools/package-advisor/` | `app/(dashboard)/tools/tool-finder/` |
| Form component dir | `components/tools/package-advisor/` | `components/tools/tool-finder/` |
| Fetch URL | `/api/tools/package-advisor` | `/api/tools/tool-finder` |
| Test spec | `playwright/tests/fast/package-advisor.spec.ts` | `playwright/tests/fast/tool-finder.spec.ts` |
| Page object | `playwright/pages/package-advisor.page.ts` | `playwright/pages/tool-finder.page.ts` |
| Fixtures | `package-advisor-*.json` | `tool-finder-*.json` |
| mockApi method | `packageAdvisor` | `toolFinder` |
| Redirect | `/tools/package-advisor` → `/tools/tool-finder` |

**Updated descriptions:**
```typescript
"tool-finder": {
  label: "Tool Finder",
  href: "/tools/tool-finder",
  category: "explore",
  descriptions: {
    business_owner: "Get recommendations for the right tools and services",
    support_ops: "Compare tools, packages, and libraries for your stack",
    implementer: "Package comparison with compatibility analysis",
  },
},
```

**Router keyword update:**
```typescript
[/\b(choose|compare|which|recommend|package|library|alternative|find\s*tool)\b/, "tool-finder"],
```

**Recommendations update** — in `COMFORT_TOOL_PRIORITY.guided`, change `"package-advisor"` → `"tool-finder"`.

Follow steps 1–19 from the rebrand checklist above.

---

### Task 4: Rename Integration Planner → Integration Blueprint

| Item | Old | New |
|------|-----|-----|
| Constant | `TOOL_NAME_INTEGRATION_PLANNER` | `TOOL_NAME_INTEGRATION_BLUEPRINT` |
| Constant value | `"integration-planner"` | `"integration-blueprint"` |
| ToolId | `"integration-planner"` | `"integration-blueprint"` |
| Label | `"Integration Planner"` | `"Integration Blueprint"` |
| API route dir | `app/api/tools/integration-planner/` | `app/api/tools/integration-blueprint/` |
| Page dir | `app/(dashboard)/tools/integration-planner/` | `app/(dashboard)/tools/integration-blueprint/` |
| Form component dir | `components/tools/integration-planner/` | `components/tools/integration-blueprint/` |
| Fetch URL | `/api/tools/integration-planner` | `/api/tools/integration-blueprint` |
| Test spec | `playwright/tests/fast/integration-planner.spec.ts` | `playwright/tests/fast/integration-blueprint.spec.ts` |
| Page object | `playwright/pages/integration-planner.page.ts` | `playwright/pages/integration-blueprint.page.ts` |
| Fixtures | `integration-planner-*.json` | `integration-blueprint-*.json` |
| mockApi method | `integrationPlanner` | `integrationBlueprint` |
| Redirect | `/tools/integration-planner` → `/tools/integration-blueprint` |

**Updated descriptions:**
```typescript
"integration-blueprint": {
  label: "Integration Blueprint",
  href: "/tools/integration-blueprint",
  category: "explore",
  descriptions: {
    business_owner: "Plan how to connect your services together",
    support_ops: "Architecture and approach for connecting platforms",
    implementer: "Integration architecture, packages, patterns",
  },
},
```

**Router keyword update:**
```typescript
[/\b(connect|integrate|set\s*up|link|sync|hook\s*up|blueprint)\b/, "integration-blueprint"],
```

**Recommendations update** — in `PLATFORM_TOOLS`, change all `"integration-planner"` → `"integration-blueprint"`.

**Note:** The `ACCEPTED_FROM` array in the Code Generator's form (`components/tools/code-generator/generator-form.tsx`) references `"integration-planner"` for workflow context. Update to `"integration-blueprint"`. Also check the `WorkflowNext` `sourceToolId` in the planner form itself.

Follow steps 1–19 from the rebrand checklist above.

---

### Task 5: Rename Health Checker → Connection Health Check

| Item | Old | New |
|------|-----|-----|
| Constant | `TOOL_NAME_HEALTH_CHECKER` | `TOOL_NAME_CONNECTION_HEALTH_CHECK` |
| Constant value | `"health-checker"` | `"connection-health-check"` |
| ToolId | `"health-checker"` | `"connection-health-check"` |
| Label | `"Health Checker"` | `"Connection Health Check"` |
| API route dir | `app/api/tools/health-checker/` | `app/api/tools/connection-health-check/` |
| Page dir | `app/(dashboard)/tools/health-checker/` | `app/(dashboard)/tools/connection-health-check/` |
| Form component dir | `components/tools/health-checker/` | `components/tools/connection-health-check/` |
| Fetch URL | `/api/tools/health-checker` | `/api/tools/connection-health-check` |
| Test spec | `playwright/tests/fast/health-checker.spec.ts` | `playwright/tests/fast/connection-health-check.spec.ts` |
| Page object | `playwright/pages/health-checker.page.ts` | `playwright/pages/connection-health-check.page.ts` |
| Fixtures | `health-checker-*.json` | `connection-health-check-*.json` |
| mockApi method | `healthChecker` | `connectionHealthCheck` |
| Redirect | `/tools/health-checker` → `/tools/connection-health-check` |

**Updated descriptions:**
```typescript
"connection-health-check": {
  label: "Connection Health Check",
  href: "/tools/connection-health-check",
  category: "maintain",
  descriptions: {
    business_owner: "Get a health report for your connections and integrations",
    support_ops: "Assess configuration health and identify risks",
    implementer: "Config health assessment with severity ratings",
  },
},
```

**Router keyword update:**
```typescript
[/\b(health|check|status|diagnose|config)\b/, "connection-health-check"],
```

**Recommendations update** — in `PLATFORM_TOOLS`, change all `"health-checker"` → `"connection-health-check"`. In `COMFORT_TOOL_PRIORITY.guided`, change `"health-checker"` → `"connection-health-check"`.

Follow steps 1–19 from the rebrand checklist above.

---

### Task 6: Rename Dependency Audit → Compatibility Check

| Item | Old | New |
|------|-----|-----|
| Constant | `TOOL_NAME_DEPENDENCY_AUDIT` | `TOOL_NAME_COMPATIBILITY_CHECK` |
| Constant value | `"dependency-audit"` | `"compatibility-check"` |
| ToolId | `"dependency-audit"` | `"compatibility-check"` |
| Label | `"Dependency Audit"` | `"Compatibility Check"` |
| API route dir | `app/api/tools/dependency-audit/` | `app/api/tools/compatibility-check/` |
| Page dir | `app/(dashboard)/tools/dependency-audit/` | `app/(dashboard)/tools/compatibility-check/` |
| Form component dir | `components/tools/dependency-audit/` | `components/tools/compatibility-check/` |
| Fetch URL | `/api/tools/dependency-audit` | `/api/tools/compatibility-check` |
| Test spec | `playwright/tests/fast/dependency-audit.spec.ts` | `playwright/tests/fast/compatibility-check.spec.ts` |
| Page object | `playwright/pages/dependency-audit.page.ts` | `playwright/pages/compatibility-check.page.ts` |
| Fixtures | `dependency-audit-*.json` | `compatibility-check-*.json` |
| mockApi method | `dependencyAudit` | `compatibilityCheck` |
| Redirect | `/tools/dependency-audit` → `/tools/compatibility-check` |

**Updated descriptions:**
```typescript
"compatibility-check": {
  label: "Compatibility Check",
  href: "/tools/compatibility-check",
  category: "maintain",
  descriptions: {
    business_owner: "Check if your tools and dependencies are compatible and up to date",
    support_ops: "Audit dependencies for updates and known issues",
    implementer: "Dependency audit table with status badges",
  },
},
```

**Router keyword update:**
```typescript
[/\b(audit|dependencies|outdated|vulnerable|compatible|compatibility)\b/, "compatibility-check"],
```

Follow steps 1–19 from the rebrand checklist above.

---

### Task 7: Rename Migration Assistant → Upgrade Assistant

| Item | Old | New |
|------|-----|-----|
| Constant | `TOOL_NAME_MIGRATION_ASSISTANT` | `TOOL_NAME_UPGRADE_ASSISTANT` |
| Constant value | `"migration-assistant"` | `"upgrade-assistant"` |
| ToolId | `"migration-assistant"` | `"upgrade-assistant"` |
| Label | `"Migration Assistant"` | `"Upgrade Assistant"` |
| API route dir | `app/api/tools/migration-assistant/` | `app/api/tools/upgrade-assistant/` |
| Page dir | `app/(dashboard)/tools/migration-assistant/` | `app/(dashboard)/tools/upgrade-assistant/` |
| Form component dir | `components/tools/migration-assistant/` | `components/tools/upgrade-assistant/` |
| Fetch URL | `/api/tools/migration-assistant` | `/api/tools/upgrade-assistant` |
| Test spec | `playwright/tests/fast/migration-assistant.spec.ts` | `playwright/tests/fast/upgrade-assistant.spec.ts` |
| Page object | `playwright/pages/migration-assistant.page.ts` | `playwright/pages/upgrade-assistant.page.ts` |
| Fixtures | `migration-assistant-*.json` | `upgrade-assistant-*.json` |
| mockApi method | `migrationAssistant` | `upgradeAssistant` |
| Redirect | `/tools/migration-assistant` → `/tools/upgrade-assistant` |

**Updated descriptions:**
```typescript
"upgrade-assistant": {
  label: "Upgrade Assistant",
  href: "/tools/upgrade-assistant",
  category: "maintain",
  descriptions: {
    business_owner: "Get help upgrading to a new version of your tools",
    support_ops: "Step-by-step upgrade guide with breaking changes",
    implementer: "Migration steps, breaking changes, effort estimate",
  },
},
```

**Router keyword update:**
```typescript
[/\b(migrate|upgrade|version|update|breaking\s*change)\b/, "upgrade-assistant"],
```

**Recommendations update** — in `PLATFORM_TOOLS.magento`, change `"migration-assistant"` → `"upgrade-assistant"`. In `COMFORT_TOOL_PRIORITY.writes_code`, change `"migration-assistant"` → `"upgrade-assistant"`.

Follow steps 1–19 from the rebrand checklist above.

---

### Task 8: Batch rebrand verification & commit

After all 7 rebrands are complete:

**Step 1: Full build verification**
```bash
npm run build
```
Expected: Build succeeds with no errors.

**Step 2: Run all fast tests**
```bash
npx playwright test --project=fast
```
Expected: All tests pass.

**Step 3: Verify redirects work**

Start dev server and manually check each redirect:
- `/tools/code-explainer` → `/tools/how-it-works`
- `/tools/error-explainer` → `/tools/error-resolver`
- `/tools/package-advisor` → `/tools/tool-finder`
- `/tools/integration-planner` → `/tools/integration-blueprint`
- `/tools/health-checker` → `/tools/connection-health-check`
- `/tools/dependency-audit` → `/tools/compatibility-check`
- `/tools/migration-assistant` → `/tools/upgrade-assistant`

**Step 4: Check for stale references**

Search the entire codebase for any remaining old tool IDs:
```bash
grep -r "code-explainer\|error-explainer\|package-advisor\|integration-planner\|health-checker\|dependency-audit\|migration-assistant" --include="*.ts" --include="*.tsx" --include="*.json" . | grep -v node_modules | grep -v .worktrees | grep -v next.config
```
Expected: Only `next.config.ts` redirect sources remain. All other references should be updated.

**Note:** The `nuget-advisor` tool references `code-explainer` in its workflow recommendations — update to `how-it-works`. Check ALL form components for cross-tool references in `ACCEPTED_FROM` arrays and `WorkflowNext` components.

---

## Batch 2: Update Stage Descriptions & Constants Cleanup (Task 9)

### Task 9: Update stage descriptions and pre-existing constants

**Step 1: Update stage descriptions in `lib/tool-descriptions.ts`**

Replace the `getStageDescription` function body with updated descriptions reflecting the broader platform:

```typescript
function getStageDescription(stage: Category, persona: Persona): string {
  const descriptions: Record<Category, Record<Persona, string>> = {
    explore: {
      business_owner: "Figure out what tools and connections you need",
      support_ops: "Research platforms and plan integrations",
      implementer: "Evaluate tools, APIs, and architecture options",
    },
    setup: {
      business_owner: "Connect your apps and set up automations",
      support_ops: "Configure integrations and workflows",
      implementer: "Build connections, webhooks, and automation code",
    },
    troubleshoot: {
      business_owner: "Find and fix connection problems",
      support_ops: "Diagnose integration issues and changes",
      implementer: "Debug connections, analyse changes and errors",
    },
    maintain: {
      business_owner: "Keep your integrations running smoothly",
      support_ops: "Monitor health and manage updates",
      implementer: "Audit, test, migrate, and verify integrations",
    },
  };
  return descriptions[stage][persona];
}
```

**Step 2: Update pre-existing constants in `lib/constants.ts`**

The old Phase 9 doc pre-defined 4 tool constants. Remove or rename these to match the new tool names:

```typescript
// Remove these:
// TOOL_NAME_INTEGRATION_HUB = "integration-hub"
// TOOL_NAME_CHANGE_IMPACT = "change-impact"
// TOOL_NAME_STACK_PLANNER = "stack-planner"
// TOOL_NAME_TROUBLESHOOTER = "troubleshooter" — keep this one, value matches

// Add/update:
export const TOOL_NAME_TOOL_PLANNER = "tool-planner";
export const TOOL_NAME_CONNECTION_MAP = "connection-map";
export const TOOL_NAME_INTEGRATION_SETUP = "integration-setup";
export const TOOL_NAME_WEBHOOK_BUILDER = "webhook-builder";
export const TOOL_NAME_AUTH_GUIDE = "auth-guide";
export const TOOL_NAME_WORKFLOW_BUILDER = "workflow-builder";
export const TOOL_NAME_TROUBLESHOOTER = "troubleshooter";
export const TOOL_NAME_WHAT_CHANGED = "what-changed";
```

**Step 3: Run `npm run build` to verify**

**Step 4: Commit**
```bash
git commit -m "refactor: update stage descriptions and tool constants for Phase 9d"
```

---

## Batch 3: New Tools — Explore Category (Tasks 10–11)

Each new tool follows this pattern. Steps are detailed for Task 10 as the template; subsequent tasks follow the same structure.

### Task 10: Tool Planner (Explore)

**Files to create:**
- `lib/claude.ts` — add `getToolPlan()` function and `ToolPlannerResult` Zod schema
- `app/api/tools/tool-planner/route.ts` — API route
- `components/tools/tool-planner/planner-form.tsx` — form component
- `components/tools/tool-planner/result-cards.tsx` — result display
- `app/(dashboard)/tools/tool-planner/page.tsx` — page
- `playwright/mocks/fixtures/tool-planner-success.json` — mock fixture
- `playwright/mocks/fixtures/tool-planner-error.json` — error fixture
- `playwright/pages/tool-planner.page.ts` — page object
- `playwright/tests/fast/tool-planner.spec.ts` — test spec

**Files to modify:**
- `lib/tool-descriptions.ts` — add `"tool-planner"` to `ToolId` union and `TOOL_CATALOG`
- `lib/constants.ts` — already added in Task 9
- `lib/tool-router.ts` — add keyword pattern
- `lib/tool-recommendations.ts` — add to `PLATFORM_TOOLS` and `COMFORT_TOOL_PRIORITY` where appropriate
- `playwright/fixtures/index.ts` — add `toolPlanner` mock method

**Step 1: Add Zod schema and Claude function to `lib/claude.ts`**

```typescript
// Zod schema
const toolPlannerSchema = z.object({
  recommendations: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
    cost: z.string(),
    integrationComplexity: z.enum(["low", "medium", "high"]),
  })),
  stackOverview: z.string(),
  implementationOrder: z.array(z.string()),
  considerations: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type ToolPlannerResult = z.infer<typeof toolPlannerSchema>;

// Function
export async function getToolPlan(
  description: string,
  personaInstruction?: string
): Promise<ToolPlannerResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are an integration platform advisor. The user needs help choosing the right tools and platforms for their business needs.

Analyse their requirements and recommend a compatible tool stack.

User's needs: "${description}"

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "recommendations": [{"name": "Tool Name", "purpose": "What it does for them", "cost": "Free / $X/month / etc", "integrationComplexity": "low|medium|high"}],
  "stackOverview": "How these tools work together as a stack",
  "implementationOrder": ["First do this", "Then this"],
  "considerations": ["Important things to know"],
  "nextStepSuggestion": "What to do next",
  "nextStepToolId": "integration-setup",
  "nextStepDescription": "Brief description of why this tool helps next"
}${personaInstruction ? `\n\n${personaInstruction}` : ""}`,
    }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = toolPlannerSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error(`Failed to parse Claude response: ${text}`);
  return parsed.data;
}
```

**Step 2: Create API route `app/api/tools/tool-planner/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getToolPlan } from "@/lib/claude";
import { TOOL_NAME_TOOL_PLANNER } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";
import { getUserProfile } from "@/lib/user-profile";
import { resolvePersona } from "@/lib/utils";
import { getPersonaInstruction } from "@/lib/persona-prompts";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_TOOL_PLANNER);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { description } = body as { description?: string };

  if (!description?.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }
  if (description.length > 2000) {
    return NextResponse.json({ error: "Description exceeds 2,000 character limit" }, { status: 400 });
  }

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
    result = await getToolPlan(description.trim(), personaInstruction);
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Failed to create plan. Please try again." }, { status: 500 });
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_TOOL_PLANNER);
  return NextResponse.json(result);
}
```

**Step 3: Add tool catalog entry to `lib/tool-descriptions.ts`**

Add `"tool-planner"` to the `ToolId` union type. Add to `TOOL_CATALOG`:

```typescript
"tool-planner": {
  label: "Tool Planner",
  href: "/tools/tool-planner",
  category: "explore",
  descriptions: {
    business_owner: "Get recommendations for the right tools for your business",
    support_ops: "Compare platforms and tools for your integration needs",
    implementer: "Evaluate tool stacks with cost and complexity analysis",
  },
},
```

**Step 4: Add keyword pattern to `lib/tool-router.ts`**

Add to the `highConfidence` array:
```typescript
[/\b(plan|stack|what\s*tools|what\s*should\s*i\s*use|tool\s*plan)\b/, "tool-planner"],
```

**Step 5: Create form component `components/tools/tool-planner/planner-form.tsx`**

Follow the pattern from `components/tools/integration-planner/planner-form.tsx` but:
- No `StackSelector` — this tool is domain-agnostic, no language/framework needed
- Single `CharLimitedInput` for `description` with placeholder: `e.g. "I sell online and need shipping, accounting, and payment tools"`
- Submit button text: `"Find Tools"` / `"Finding..."` when loading
- Fetch URL: `/api/tools/tool-planner`
- Result type: `ToolPlannerResult`

**Step 6: Create result cards `components/tools/tool-planner/result-cards.tsx`**

Display sections:
- **Recommended tools** — list with name, purpose, cost, complexity badge
- **Stack overview** — paragraph text
- **Implementation order** — numbered list
- **Considerations** — bullet list

**Step 7: Create page `app/(dashboard)/tools/tool-planner/page.tsx`**

Follow the server component pattern from existing tools:
```typescript
export default async function ToolPlannerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [userPlan, { data: usageRows }] = await Promise.all([
    getUserPlan(user.id),
    supabase.from("usage").select("count").eq("user_id", user.id).eq("month", currentMonthDate()),
  ]);

  const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-white">Tool Planner</h1>
      <p className="mt-2 text-muted-400">
        Describe your business needs and get recommendations for compatible tools.
      </p>
      <div className="mt-8">
        <PlannerForm usageCount={totalUsage} plan={userPlan.plan} />
      </div>
    </div>
  );
}
```

**Step 8: Create test fixtures**

`playwright/mocks/fixtures/tool-planner-success.json`:
```json
{
  "recommendations": [
    {"name": "Stripe", "purpose": "Payment processing", "cost": "2.9% + 30p per transaction", "integrationComplexity": "medium"},
    {"name": "Xero", "purpose": "Accounting and invoicing", "cost": "£15/month", "integrationComplexity": "medium"}
  ],
  "stackOverview": "Stripe handles payments and syncs transaction data to Xero for accounting. Both have well-documented APIs and official integrations.",
  "implementationOrder": ["Set up Stripe account and API keys", "Connect Xero and configure chart of accounts", "Set up Stripe-to-Xero sync via webhook or integration app"],
  "considerations": ["Stripe and Xero have a native integration via Xero's app marketplace", "Consider using a middleware like Zapier if you want no-code setup"],
  "nextStepSuggestion": "Set up the connection between your chosen tools.",
  "nextStepToolId": "integration-setup",
  "nextStepDescription": "Now that you have a tool plan, use Integration Setup to connect your platforms step by step."
}
```

`playwright/mocks/fixtures/tool-planner-error.json`:
```json
{"error": "Failed to create plan. Please try again."}
```

**Step 9: Add mockApi method to `playwright/fixtures/index.ts`**

```typescript
toolPlanner: async (page: Page, scenario: "success" | "error" = "success") => {
  const fixturePath = path.resolve(__dirname, `../mocks/fixtures/tool-planner-${scenario}.json`);
  const body = readFileSync(fixturePath, "utf-8");
  const status = scenario === "error" ? 500 : 200;
  await page.route("**/api/tools/tool-planner", (route) =>
    route.fulfill({ status, contentType: "application/json", body })
  );
},
```

Also add `toolPlanner` to the `MockApiFactory` type.

**Step 10: Create page object `playwright/pages/tool-planner.page.ts`**

```typescript
import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class ToolPlannerPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /tool planner/i });
  }

  get formInput(): Locator {
    return this.descriptionInput;
  }

  get descriptionInput(): Locator {
    return this.main.locator('textarea[id="description-input"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get recommendationsSection(): Locator {
    return this.main.getByRole("heading", { name: /recommended tools/i }).locator("..");
  }

  get stackOverviewCard(): Locator {
    return this.main.getByRole("heading", { name: /stack overview/i }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/tool-planner");
  }

  async planTools(description: string) {
    await this.descriptionInput.fill(description);
    await this.submitButton.click();
  }
}
```

**Step 11: Create test spec `playwright/tests/fast/tool-planner.spec.ts`**

```typescript
import { test, expect } from "../../fixtures";
import { ToolPlannerPage } from "../../pages/tool-planner.page";

test.describe("Tool Planner", () => {
  test("submits and shows recommendation cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.toolPlanner(freeUserPage, "success");
    const planner = new ToolPlannerPage(freeUserPage);
    await planner.goto();
    await planner.planTools("I need payment processing and accounting");
    await expect(planner.recommendationsSection).toBeVisible({ timeout: 5000 });
    await expect(planner.stackOverviewCard).toBeVisible();
  });

  test("shows What's Next section after results", async ({ freeUserPage, mockApi }) => {
    await mockApi.toolPlanner(freeUserPage, "success");
    const planner = new ToolPlannerPage(freeUserPage);
    await planner.goto();
    await planner.planTools("I need payment processing and accounting");
    await expect(planner.whatsNextSection).toBeVisible({ timeout: 5000 });
  });

  test("submit disabled without description", async ({ freeUserPage }) => {
    const planner = new ToolPlannerPage(freeUserPage);
    await planner.goto();
    await expect(planner.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.toolPlanner(freeUserPage, "error");
    const planner = new ToolPlannerPage(freeUserPage);
    await planner.goto();
    await planner.planTools("I need payment processing and accounting");
    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("shows usage counter", async ({ freeUserPage, mockApi }) => {
    await mockApi.toolPlanner(freeUserPage, "success");
    const planner = new ToolPlannerPage(freeUserPage);
    await planner.goto();
    await expect(planner.usageCounter).toBeVisible();
  });
});
```

**Step 12: Run tests**
```bash
npx playwright test --project=fast tests/fast/tool-planner.spec.ts
```
Expected: All 5 tests pass.

**Step 13: Commit**
```bash
git commit -m "feat: add Tool Planner tool (Explore category)"
```

---

### Task 11: Connection Map (Explore)

Follow the same pattern as Task 10 with these specifics:

**Claude function:** `getConnectionMap(platforms: string, concerns?: string, personaInstruction?: string)`

**Zod schema:**
```typescript
const connectionMapSchema = z.object({
  connections: z.array(z.object({
    from: z.string(),
    to: z.string(),
    dataFlow: z.string(),
    method: z.string(),
  })),
  weakPoints: z.array(z.object({
    description: z.string(),
    severity: z.enum(["critical", "warning", "info"]),
    recommendation: z.string(),
  })),
  overallAssessment: z.string(),
  recommendations: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});
```

**Prompt focus:** "You are an integration architecture advisor. Analyse the user's described platform landscape and map how data flows between systems."

**Form inputs:**
- `platforms` (required, textarea, max 2000) — placeholder: `e.g. "Shopify for online store, Stripe for payments, Xero for accounting, Mailchimp for email marketing"`
- `concerns` (optional, textarea, max 1000) — placeholder: `e.g. "I'm worried about order data not reaching my accountant"`

**Result cards:** Connections table, Weak points list (with severity badges), Overall assessment, Recommendations

**Tool catalog entry:**
```typescript
"connection-map": {
  label: "Connection Map",
  href: "/tools/connection-map",
  category: "explore",
  descriptions: {
    business_owner: "See how your apps are connected and find weak spots",
    support_ops: "Map integration landscape with health indicators",
    implementer: "Architecture overview with API dependency chain and failure modes",
  },
},
```

**Router keywords:** `[/\b(map|landscape|overview|how\s*.*connected|connections)\b/, "connection-map"]`

**Constant:** `TOOL_NAME_CONNECTION_MAP` (already added in Task 9)

Create fixture files, page object, test spec, mockApi method following the same pattern as Task 10.

**Commit:** `feat: add Connection Map tool (Explore category)`

---

## Batch 4: New Tools — Set Up Category (Tasks 12–15)

### Task 12: Integration Setup (Set Up)

**Claude function:** `getIntegrationSetup(platformA: string, platformB: string, goal?: string, personaInstruction?: string)`

**Zod schema:**
```typescript
const integrationSetupSchema = z.object({
  prerequisites: z.array(z.string()),
  steps: z.array(z.object({
    step: z.number(),
    title: z.string(),
    description: z.string(),
    platform: z.string(),
  })),
  verificationSteps: z.array(z.string()),
  commonPitfalls: z.array(z.object({
    issue: z.string(),
    prevention: z.string(),
  })),
  estimatedTime: z.string(),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});
```

**max_tokens:** 2048 (longer output for step-by-step guides)

**Prompt focus:** "You are an integration setup expert. Guide the user through connecting two platforms together with clear, step-by-step instructions."

**Form inputs:**
- `platformA` (required, text input) — label: "First platform", placeholder: `e.g. "Shopify"`
- `platformB` (required, text input) — label: "Second platform", placeholder: `e.g. "Xero"`
- `goal` (optional, textarea, max 1000) — label: "What do you want the connection to do?", placeholder: `e.g. "Automatically sync new orders to my accounting software"`

**Result cards:** Prerequisites checklist, Step-by-step guide (numbered, with platform labels), Verification steps, Common pitfalls

**Tool catalog entry:**
```typescript
"integration-setup": {
  label: "Integration Setup",
  href: "/tools/integration-setup",
  category: "setup",
  descriptions: {
    business_owner: "Get step-by-step help connecting two apps together",
    support_ops: "Configuration guide with webhook setup and troubleshooting tips",
    implementer: "API endpoints, auth flows, and architecture for platform connections",
  },
},
```

**Router keywords:** Add a new high-priority pattern early in the list:
```typescript
[/\b(connect\s*.*to|set\s*up\s*.*integration|link\s*.*with|how\s*to\s*connect)\b/, "integration-setup"],
```
**Note:** The existing `connect|integrate|set up` pattern now points to `integration-blueprint` (from rebrand). Adjust so more specific "connect X to Y" phrases match `integration-setup`, while general "integrate" matches `integration-blueprint`.

**Constant:** `TOOL_NAME_INTEGRATION_SETUP` (already added in Task 9)

**Commit:** `feat: add Integration Setup tool (Set Up category)`

---

### Task 13: Webhook Builder (Set Up)

**Claude function:** `getWebhookSetup(sourceApp: string, targetApp: string, events?: string, personaInstruction?: string)`

**Zod schema:**
```typescript
const webhookBuilderSchema = z.object({
  sourceSetup: z.object({
    steps: z.array(z.string()),
    webhookUrl: z.string(),
    authentication: z.string(),
  }),
  targetSetup: z.object({
    steps: z.array(z.string()),
    endpointCode: z.string().optional(),
  }),
  payloadFormat: z.object({
    description: z.string(),
    exampleFields: z.array(z.object({ field: z.string(), description: z.string() })),
  }),
  testing: z.array(z.string()),
  securityNotes: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});
```

**Prompt focus:** "You are a webhook integration specialist. Help the user set up event-driven communication between two applications."

**Form inputs:**
- `sourceApp` (required, text input) — label: "App sending events", placeholder: `e.g. "Shopify"`
- `targetApp` (required, text input) — label: "App receiving events", placeholder: `e.g. "Slack"`
- `events` (optional, textarea, max 1000) — label: "What events should trigger notifications?", placeholder: `e.g. "New order, payment received, shipping update"`

**Tool catalog entry:**
```typescript
"webhook-builder": {
  label: "Webhook Builder",
  href: "/tools/webhook-builder",
  category: "setup",
  descriptions: {
    business_owner: "Set up automatic notifications between your apps",
    support_ops: "Configure webhooks with endpoint setup and payload inspection",
    implementer: "Webhook endpoint code, signature verification, and retry logic",
  },
},
```

**Router keywords:** `[/\b(webhook|notify|notification|event\s*driven|trigger)\b/, "webhook-builder"]`

**Commit:** `feat: add Webhook Builder tool (Set Up category)`

---

### Task 14: Auth Guide (Set Up)

**Claude function:** `getAuthGuide(service: string, purpose?: string, personaInstruction?: string)`

**Zod schema:**
```typescript
const authGuideSchema = z.object({
  authMethod: z.string(),
  steps: z.array(z.object({
    step: z.number(),
    title: z.string(),
    description: z.string(),
  })),
  securityTips: z.array(z.string()),
  testingSteps: z.array(z.string()),
  commonErrors: z.array(z.object({
    error: z.string(),
    fix: z.string(),
  })),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});
```

**Prompt focus:** "You are an API authentication expert. Help the user understand and set up authentication for a specific service. Cover the auth method (API key, OAuth 2.0, JWT, etc.), step-by-step credential setup, and security best practices."

**Form inputs:**
- `service` (required, text input) — label: "Which service do you need to authenticate with?", placeholder: `e.g. "Stripe", "Google Sheets API", "Xero"`
- `purpose` (optional, textarea, max 1000) — label: "What will you use it for?", placeholder: `e.g. "Read customer orders and create invoices"`

**Tool catalog entry:**
```typescript
"auth-guide": {
  label: "Auth Guide",
  href: "/tools/auth-guide",
  category: "setup",
  descriptions: {
    business_owner: "Get help setting up API keys and authentication for any service",
    support_ops: "Authentication setup, scopes, permissions, and credential rotation",
    implementer: "Auth flow diagrams, token refresh logic, and setup code snippets",
  },
},
```

**Router keywords:** `[/\b(auth|api\s*key|oauth|token|credentials|login\s*.*api|authenticate)\b/, "auth-guide"]`

**Commit:** `feat: add Auth Guide tool (Set Up category)`

---

### Task 15: Workflow Builder (Set Up)

**Claude function:** `getWorkflow(description: string, platforms?: string, personaInstruction?: string)`

**Zod schema:**
```typescript
const workflowBuilderSchema = z.object({
  trigger: z.object({
    event: z.string(),
    platform: z.string(),
    conditions: z.array(z.string()),
  }),
  steps: z.array(z.object({
    step: z.number(),
    action: z.string(),
    platform: z.string(),
    details: z.string(),
    errorHandling: z.string(),
  })),
  implementationOptions: z.array(z.object({
    method: z.string(),
    description: z.string(),
    complexity: z.enum(["low", "medium", "high"]),
    cost: z.string(),
  })),
  estimatedSetupTime: z.string(),
  considerations: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});
```

**max_tokens:** 2048

**Prompt focus:** "You are an automation workflow designer. Help the user design a multi-step workflow that connects their apps. Consider both no-code (Zapier, Make, n8n) and code-based approaches."

**Form inputs:**
- `description` (required, textarea, max 2000) — label: "Describe the workflow you want to automate", placeholder: `e.g. "When a new order comes in on Shopify, create an invoice in Xero and notify the team on Slack"`
- `platforms` (optional, textarea, max 1000) — label: "Platforms involved (if not mentioned above)", placeholder: `e.g. "Shopify, Xero, Slack"`

**Tool catalog entry:**
```typescript
"workflow-builder": {
  label: "Workflow Builder",
  href: "/tools/workflow-builder",
  category: "setup",
  descriptions: {
    business_owner: "Design automated workflows between your apps — no coding required",
    support_ops: "Multi-step automation with monitoring and error handling",
    implementer: "Workflow architecture with queue patterns and reliability design",
  },
},
```

**Router keywords:** `[/\b(automate|automation|workflow|when\s*.*then|zapier|make|n8n)\b/, "workflow-builder"]`

**Commit:** `feat: add Workflow Builder tool (Set Up category)`

---

## Batch 5: New Tools — Troubleshoot Category (Tasks 16–17)

### Task 16: Troubleshooter (Troubleshoot)

**Claude function:** `troubleshootIntegration(problem: string, platforms?: string, recentChanges?: string, personaInstruction?: string)`

**Zod schema:**
```typescript
const troubleshooterSchema = z.object({
  likelyCause: z.object({
    category: z.enum(["auth", "webhook", "mapping", "rate_limit", "service_outage", "configuration", "other"]),
    explanation: z.string(),
    confidence: z.enum(["high", "medium", "low"]),
  }),
  diagnosticSteps: z.array(z.object({
    step: z.number(),
    check: z.string(),
    expectedResult: z.string(),
    ifFails: z.string(),
  })),
  fixSteps: z.array(z.string()),
  preventionTips: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});
```

**max_tokens:** 2048

**Prompt focus:** "You are an integration troubleshooting expert. Diagnose the user's integration problem through a guided diagnostic approach. Identify the most likely root cause category and provide step-by-step fix instructions."

**Form inputs:**
- `problem` (required, textarea, max 2000) — label: "Describe the problem", placeholder: `e.g. "Orders aren't syncing from Shopify to Xero since yesterday"`
- `platforms` (optional, text input) — label: "Platforms involved", placeholder: `e.g. "Shopify, Xero"`
- `recentChanges` (optional, textarea, max 1000) — label: "Any recent changes?", placeholder: `e.g. "Updated Shopify app version yesterday"`

**Tool catalog entry:**
```typescript
"troubleshooter": {
  label: "Troubleshooter",
  href: "/tools/troubleshooter",
  category: "troubleshoot",
  descriptions: {
    business_owner: "Find out why your apps stopped talking to each other",
    support_ops: "Guided diagnosis with root cause analysis and fix steps",
    implementer: "Integration debugging with payload inspection and replay guidance",
  },
},
```

**Router keywords:** The existing `error|exception|crash|fail|broke` pattern points to `error-resolver`. Add a separate pattern for troubleshooting-specific terms:
```typescript
[/\b(troubleshoot|not\s*syncing|stopped\s*working|connection\s*.*problem|apps?\s*.*not\s*.*talking)\b/, "troubleshooter"],
```

**Commit:** `feat: add Troubleshooter tool (Troubleshoot category)`

---

### Task 17: What Changed? (Troubleshoot)

**Claude function:** `analyseChange(change: string, currentSetup?: string, personaInstruction?: string)`

**Zod schema:**
```typescript
const whatChangedSchema = z.object({
  affectedIntegrations: z.array(z.object({
    integration: z.string(),
    impact: z.enum(["breaking", "degraded", "cosmetic", "none"]),
    description: z.string(),
  })),
  priorityOrder: z.array(z.object({
    item: z.string(),
    urgency: z.enum(["immediate", "soon", "when_convenient"]),
    effort: z.string(),
  })),
  migrationSteps: z.array(z.string()),
  workarounds: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});
```

**Prompt focus:** "You are a change impact analyst for software integrations. The user is describing an external change (API update, platform deprecation, regulation change, etc.). Analyse which integrations are affected, what breaks, and what needs updating."

**Form inputs:**
- `change` (required, textarea, max 2000) — label: "Describe the change", placeholder: `e.g. "Stripe deprecated API version 2024-12-18" or "Royal Mail updated their shipping API"`
- `currentSetup` (optional, textarea, max 1000) — label: "Describe your current setup (optional)", placeholder: `e.g. "We use Stripe for payments connected to Xero for accounting"`

**Tool catalog entry:**
```typescript
"what-changed": {
  label: "What Changed?",
  href: "/tools/what-changed",
  category: "troubleshoot",
  descriptions: {
    business_owner: "Find out how an update or change affects your integrations",
    support_ops: "Impact analysis with priority checklist and customer-facing notes",
    implementer: "API diff analysis, migration code, and version pinning guidance",
  },
},
```

**Router keywords:** `[/\b(changed|deprecated|breaking\s*change|api\s*update|new\s*version|sunset)\b/, "what-changed"]`

**Note:** There is overlap with the existing `migrate|upgrade|version|update` pattern pointing to `upgrade-assistant`. Ensure the `what-changed` pattern is checked first (higher in the array) for change-specific terms, while `upgrade-assistant` handles action-oriented terms like "migrate" and "upgrade".

**Commit:** `feat: add What Changed? tool (Troubleshoot category)`

---

## Batch 6: Update Recommendations & Router (Task 18)

### Task 18: Update tool-recommendations.ts and tool-router.ts

Now that all tools exist, update the recommendation engine and router to include the new tools.

**Step 1: Update `PLATFORM_TOOLS` in `lib/tool-recommendations.ts`**

Add new tools to platform mappings:
```typescript
const PLATFORM_TOOLS: Record<string, ToolId[]> = {
  shopify: ["integration-blueprint", "connection-health-check", "error-resolver", "integration-setup", "webhook-builder"],
  woocommerce: ["integration-blueprint", "code-generator", "connection-health-check", "integration-setup"],
  xero: ["integration-blueprint", "api-wrapper-generator", "error-resolver", "integration-setup", "auth-guide"],
  stripe: ["api-wrapper-generator", "integration-blueprint", "code-generator", "webhook-builder", "auth-guide"],
  "royal-mail": ["api-wrapper-generator", "integration-blueprint", "integration-setup"],
  quickbooks: ["integration-blueprint", "api-wrapper-generator", "error-resolver", "integration-setup"],
  magento: ["integration-blueprint", "connection-health-check", "upgrade-assistant", "integration-setup"],
};
```

**Step 2: Update `COMFORT_TOOL_PRIORITY`**

```typescript
const COMFORT_TOOL_PRIORITY: Record<string, ToolId[]> = {
  guided: ["troubleshooter", "integration-setup", "tool-planner", "connection-map", "error-resolver", "how-it-works", "connection-health-check", "tool-finder"],
  writes_code: ["code-generator", "api-wrapper-generator", "webhook-builder", "unit-test-generator", "upgrade-assistant", "workflow-builder"],
};
```

**Step 3: Review keyword priority order in `lib/tool-router.ts`**

Ensure the `highConfidence` array is ordered so more specific patterns match first:
```typescript
const highConfidence: [RegExp, ToolId][] = [
  // Specific phrases first
  [/\b(connect\s*.*to|set\s*up\s*.*integration|link\s*.*with|how\s*to\s*connect)\b/, "integration-setup"],
  [/\b(webhook|notify|notification|event\s*driven|trigger)\b/, "webhook-builder"],
  [/\b(auth|api\s*key|oauth|token|credentials|authenticate)\b/, "auth-guide"],
  [/\b(automate|automation|workflow|when\s*.*then|zapier|make|n8n)\b/, "workflow-builder"],
  [/\b(changed|deprecated|breaking\s*change|api\s*update|sunset)\b/, "what-changed"],
  [/\b(troubleshoot|not\s*syncing|stopped\s*working|connection\s*.*problem|apps?\s*.*not\s*.*talking)\b/, "troubleshooter"],
  [/\b(map|landscape|overview|how\s*.*connected|connections)\b/, "connection-map"],
  [/\b(plan|stack|what\s*tools|what\s*should\s*i\s*use|tool\s*plan)\b/, "tool-planner"],
  // Original patterns (updated tool IDs)
  [/\b(error|exception|stack\s*trace|crash|fail|broke|broken)\b/, "error-resolver"],
  [/\b(integrate|blueprint)\b/, "integration-blueprint"],
  [/\b(choose|compare|which|recommend|package|library|alternative|find\s*tool)\b/, "tool-finder"],
  [/\b(generate|scaffold|boilerplate|create\s*code|write\s*code)\b/, "code-generator"],
  [/\b(wrap|wrapper|api\s*client|sdk)\b/, "api-wrapper-generator"],
  [/\b(test|testing|unit\s*test)\b/, "unit-test-generator"],
  [/\b(audit|dependencies|outdated|vulnerable|compatible|compatibility)\b/, "compatibility-check"],
  [/\b(health|check|status|diagnose|config)\b/, "connection-health-check"],
  [/\b(migrate|upgrade|version|update)\b/, "upgrade-assistant"],
  [/\b(explain|understand|what\s*does|how\s*does)\b/, "how-it-works"],
];
```

**Step 4: Run tests**
```bash
npm run build && npx playwright test --project=fast
```

**Step 5: Commit**
```bash
git commit -m "feat: update recommendations and router for all 18 tools"
```

---

## Batch 7: Full Test Suite & Verification (Task 19)

### Task 19: Full verification and test run

**Step 1: Run full build**
```bash
npm run build
```

**Step 2: Run all fast tests**
```bash
npx playwright test --project=fast
```

**Step 3: Run fast-serial tests**
```bash
npx playwright test --project=fast-serial
```

**Step 4: Verify tool catalog completeness**

Check that `TOOL_CATALOG` has exactly 18 entries (10 existing including NuGet which stays + 7 rebrands net-zero + 8 new). Wait — NuGet Advisor is still in the catalog but not in our 18-tool list. Verify: the actual count is the original 10 tools (with 7 renamed) + 8 new = 18 tool IDs in `TOOL_CATALOG`. NuGet Advisor may be a separate legacy tool — check if it's still in the catalog and if so, keep it. The final count may be 19 including NuGet.

**Step 5: Search for any remaining stale references**
```bash
grep -r "integration-hub\|change-impact\|stack-planner" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .worktrees
```
Expected: No matches (old pre-defined constants removed in Task 9).

**Step 6: Verify all redirects are in `next.config.ts`**

Read the file and confirm 7 redirect entries.

**Step 7: Commit any final fixes**

---

## Batch 8: PR (Task 20)

### Task 20: Create PR

**Step 1: Create feature branch (if not already on one)**
```bash
git checkout -b feature/phase-9d-tool-expansion
```

**Step 2: Push and create PR**
```bash
gh pr create --title "Phase 9d: Tool expansion and rebranding" --body "$(cat <<'EOF'
## Summary
- Rebrand 7 existing tools for broader integration platform appeal
- Add 8 new integration tools (Tool Planner, Connection Map, Integration Setup, Webhook Builder, Auth Guide, Workflow Builder, Troubleshooter, What Changed?)
- All new tools are persona-aware from day one
- URL redirects for all rebranded tools
- Updated router keywords and recommendation engine for 18 tools
- Full Playwright test coverage for all new tools

## Test plan
- [ ] All fast tests pass
- [ ] All fast-serial tests pass
- [ ] Build succeeds
- [ ] Old URLs redirect to new URLs (7 redirects)
- [ ] New tool pages load and forms submit correctly
- [ ] Tool catalog shows correct descriptions per persona
- [ ] Router recommends new tools for relevant queries

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Step 3: Monitor CI and fix any failures**

---

## Reference: File Checklist Per New Tool

For each of the 8 new tools, ensure ALL of these files exist:

| File | Purpose |
|------|---------|
| `lib/claude.ts` | Zod schema + Claude function added |
| `lib/constants.ts` | `TOOL_NAME_*` constant |
| `lib/tool-descriptions.ts` | `ToolId` union + `TOOL_CATALOG` entry |
| `lib/tool-router.ts` | Keyword pattern |
| `app/api/tools/<slug>/route.ts` | API route |
| `components/tools/<slug>/<name>-form.tsx` | Form component |
| `components/tools/<slug>/result-cards.tsx` | Result display |
| `app/(dashboard)/tools/<slug>/page.tsx` | Page |
| `playwright/mocks/fixtures/<slug>-success.json` | Success fixture |
| `playwright/mocks/fixtures/<slug>-error.json` | Error fixture |
| `playwright/fixtures/index.ts` | mockApi method added |
| `playwright/pages/<slug>.page.ts` | Page object |
| `playwright/tests/fast/<slug>.spec.ts` | Test spec |
