# Phase 8a Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build shared workflow infrastructure and 4 tools (one per stage) to create a demonstrable end-to-end user journey.

**Architecture:** localStorage-based workflow context system with shared StackSelector and WorkflowNext components. Each tool follows the existing NuGet Advisor pattern (API route + server page + client form + result component). Dashboard becomes a workflow hub with tools grouped by stage.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase, Anthropic SDK, Zod, Playwright

---

## Part 1: Shared Infrastructure

### Task 1: Workflow context library

**Files:**
- Create: `lib/workflow-context.ts`

**Step 1: Write the failing test**

No runtime test — this is a pure TypeScript module. We'll test it via component tests later.

**Step 2: Write the implementation**

```typescript
// lib/workflow-context.ts

const CONTEXT_KEY = "plexease_workflow_context";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface WorkflowContext {
  sourceToolId: string;
  language: string;
  framework: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export function saveWorkflowContext(context: Omit<WorkflowContext, "timestamp">): void {
  try {
    const data: WorkflowContext = { ...context, timestamp: new Date().toISOString() };
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadWorkflowContext(acceptFrom?: string[]): WorkflowContext | null {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    if (!raw) return null;

    const data: WorkflowContext = JSON.parse(raw);

    // Check TTL
    const age = Date.now() - new Date(data.timestamp).getTime();
    if (age > TTL_MS) {
      localStorage.removeItem(CONTEXT_KEY);
      return null;
    }

    // Check source tool compatibility
    if (acceptFrom && !acceptFrom.includes(data.sourceToolId)) {
      return null;
    }

    return data;
  } catch {
    // Corrupted data — clear and return null
    try { localStorage.removeItem(CONTEXT_KEY); } catch {}
    return null;
  }
}

export function clearWorkflowContext(): void {
  try { localStorage.removeItem(CONTEXT_KEY); } catch {}
}
```

**Step 3: Commit**

```bash
git add lib/workflow-context.ts
git commit -m "feat: add workflow context localStorage library"
```

---

### Task 2: Stack selector component

**Files:**
- Create: `components/shared/stack-selector.tsx`
- Create: `lib/stack-options.ts`

**Step 1: Write the stack options config**

```typescript
// lib/stack-options.ts

export type Language = "csharp" | "javascript" | "python" | "php" | "java" | "go";

export interface StackOption {
  id: Language;
  label: string;
  frameworks: { id: string; label: string }[];
}

export const STACK_OPTIONS: StackOption[] = [
  {
    id: "csharp",
    label: "C#",
    frameworks: [
      { id: "dotnet8", label: ".NET 8" },
      { id: "dotnet6", label: ".NET 6" },
      { id: "dotnet-framework", label: ".NET Framework 4.x" },
    ],
  },
  {
    id: "javascript",
    label: "JavaScript / TypeScript",
    frameworks: [
      { id: "node-express", label: "Node / Express" },
      { id: "nextjs", label: "Next.js" },
      { id: "nestjs", label: "NestJS" },
    ],
  },
  {
    id: "python",
    label: "Python",
    frameworks: [
      { id: "django", label: "Django" },
      { id: "flask", label: "Flask" },
      { id: "fastapi", label: "FastAPI" },
    ],
  },
  {
    id: "php",
    label: "PHP",
    frameworks: [
      { id: "laravel", label: "Laravel" },
      { id: "symfony", label: "Symfony" },
      { id: "php-plain", label: "Plain PHP" },
    ],
  },
  {
    id: "java",
    label: "Java",
    frameworks: [
      { id: "spring", label: "Spring Boot" },
      { id: "quarkus", label: "Quarkus" },
      { id: "jakarta", label: "Jakarta EE" },
    ],
  },
  {
    id: "go",
    label: "Go",
    frameworks: [
      { id: "go-std", label: "Standard Library" },
      { id: "gin", label: "Gin" },
      { id: "echo", label: "Echo" },
    ],
  },
];

const STACK_KEY = "plexease_stack";

export interface SelectedStack {
  language: Language;
  framework: string;
}

export function saveStack(stack: SelectedStack): void {
  try { localStorage.setItem(STACK_KEY, JSON.stringify(stack)); } catch {}
}

export function loadStack(): SelectedStack | null {
  try {
    const raw = localStorage.getItem(STACK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
```

**Step 2: Write the component**

```typescript
// components/shared/stack-selector.tsx
"use client";

import { useState, useEffect } from "react";
import { STACK_OPTIONS, loadStack, saveStack, type Language, type SelectedStack } from "@/lib/stack-options";

type Props = {
  onChange?: (stack: SelectedStack) => void;
  initialStack?: SelectedStack | null;
};

export function StackSelector({ onChange, initialStack }: Props) {
  const [language, setLanguage] = useState<Language | "">(initialStack?.language ?? "");
  const [framework, setFramework] = useState(initialStack?.framework ?? "");

  // Load from localStorage on mount if no initial provided
  useEffect(() => {
    if (initialStack) return;
    const saved = loadStack();
    if (saved) {
      setLanguage(saved.language);
      setFramework(saved.framework);
      onChange?.(saved);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedLang = STACK_OPTIONS.find((o) => o.id === language);
  const frameworks = selectedLang?.frameworks ?? [];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    const defaultFramework = STACK_OPTIONS.find((o) => o.id === lang)?.frameworks[0]?.id ?? "";
    setFramework(defaultFramework);
    const stack: SelectedStack = { language: lang, framework: defaultFramework };
    saveStack(stack);
    onChange?.(stack);
  };

  const handleFrameworkChange = (fw: string) => {
    setFramework(fw);
    if (language) {
      const stack: SelectedStack = { language, framework: fw };
      saveStack(stack);
      onChange?.(stack);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <div>
        <label htmlFor="stack-language" className="block text-xs font-medium text-muted-400 mb-1">
          Language
        </label>
        <select
          id="stack-language"
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
          className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="" disabled>Select language</option>
          {STACK_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {frameworks.length > 0 && (
        <div>
          <label htmlFor="stack-framework" className="block text-xs font-medium text-muted-400 mb-1">
            Framework
          </label>
          <select
            id="stack-framework"
            value={framework}
            onChange={(e) => handleFrameworkChange(e.target.value)}
            className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {frameworks.map((fw) => (
              <option key={fw.id} value={fw.id}>{fw.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add lib/stack-options.ts components/shared/stack-selector.tsx
git commit -m "feat: add StackSelector component with localStorage persistence"
```

---

### Task 3: WorkflowNext component

**Files:**
- Create: `components/shared/workflow-next.tsx`

**Step 1: Write the component**

```typescript
// components/shared/workflow-next.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveWorkflowContext } from "@/lib/workflow-context";

export interface WorkflowRecommendation {
  toolId: string;
  toolName: string;
  href: string;
  description: string; // Claude-generated context-aware copy
  contextSummary: string; // e.g. "Language: C#, Package: Stripe.NET"
}

type Props = {
  recommendations: WorkflowRecommendation[];
  sourceToolId: string;
  language: string;
  framework: string;
  payload: Record<string, unknown>;
};

export function WorkflowNext({ recommendations, sourceToolId, language, framework, payload }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);

  const handleClick = (rec: WorkflowRecommendation) => {
    setConfirming(rec.toolId);
  };

  const handleConfirm = (rec: WorkflowRecommendation) => {
    saveWorkflowContext({ sourceToolId, language, framework, payload });
    router.push(rec.href);
  };

  const handleCancel = () => {
    setConfirming(null);
  };

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-8 rounded-lg border border-surface-700 bg-surface-900 p-5">
      <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
        What&apos;s next?
      </h3>
      <div className="mt-3 space-y-3">
        {recommendations.map((rec) => (
          <div key={rec.toolId} className="rounded-lg border border-surface-700 bg-surface-800 p-4">
            <p className="text-sm text-muted-300">{rec.description}</p>
            <p className="mt-1 text-xs text-muted-500">{rec.contextSummary}</p>

            {confirming === rec.toolId ? (
              <div className="mt-3 flex gap-2">
                <p className="text-sm text-muted-300 self-center">
                  Pass this context to <strong className="text-white">{rec.toolName}</strong> and open it?
                </p>
                <button
                  onClick={() => handleConfirm(rec)}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={handleCancel}
                  className="rounded-lg border border-surface-700 px-4 py-2 text-sm font-medium text-muted-300 hover:bg-surface-700 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleClick(rec)}
                className="mt-3 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
              >
                Open {rec.toolName} &rarr;
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/shared/workflow-next.tsx
git commit -m "feat: add WorkflowNext hand-off component"
```

---

### Task 4: Character-limited textarea component

**Files:**
- Create: `components/shared/char-limited-input.tsx`

**Step 1: Write the component**

```typescript
// components/shared/char-limited-input.tsx
"use client";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  label: string;
  hint?: string;
};

export function CharLimitedInput({
  id,
  value,
  onChange,
  maxLength,
  placeholder,
  disabled,
  rows = 6,
  label,
  hint,
}: Props) {
  const remaining = maxLength - value.length;
  const isNearLimit = remaining <= Math.floor(maxLength * 0.1);
  const isAtLimit = remaining <= 0;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-muted-300">
        {label}
      </label>
      {hint && <p className="mt-1 text-xs text-muted-500">{hint}</p>}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-sm text-white placeholder-muted-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 font-mono"
      />
      <p className={`mt-1 text-xs ${isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-muted-500"}`}>
        {remaining.toLocaleString()} characters remaining
      </p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/shared/char-limited-input.tsx
git commit -m "feat: add CharLimitedInput component with live counter"
```

---

### Task 5: Tool constants and shared usage check

**Files:**
- Modify: `lib/constants.ts`

**Step 1: Add new tool name constants**

Add to `lib/constants.ts`:

```typescript
// Tool names
export const TOOL_NAME_NUGET_ADVISOR = "nuget-advisor";
export const TOOL_NAME_CODE_EXPLAINER = "code-explainer";
export const TOOL_NAME_INTEGRATION_PLANNER = "integration-planner";
export const TOOL_NAME_CODE_GENERATOR = "integration-code-generator";
export const TOOL_NAME_DEPENDENCY_AUDIT = "dependency-audit";
```

**Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add Phase 8a tool name constants"
```

---

### Task 6: Shared API route helper for usage check

**Files:**
- Create: `lib/api-helpers.ts`

**Step 1: Extract shared pattern from NuGet Advisor route**

```typescript
// lib/api-helpers.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";
import { currentMonthDate } from "@/lib/utils";
import { isProUser } from "@/lib/subscription";

export interface AuthenticatedContext {
  userId: string;
  isPro: boolean;
}

/**
 * Authenticate user and check usage limits. Returns context or error response.
 */
export async function authenticateAndCheckUsage(
  toolName: string
): Promise<{ context: AuthenticatedContext } | { error: NextResponse }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isPro = await isProUser(user.id);

  if (!isPro) {
    const month = currentMonthDate();
    const { data: usageRows } = await supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("month", month);

    const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

    if (totalUsage >= FREE_MONTHLY_LIMIT) {
      return {
        error: NextResponse.json(
          { error: "Monthly limit reached", limitReached: true },
          { status: 429 }
        ),
      };
    }
  }

  return { context: { userId: user.id, isPro } };
}

/**
 * Increment usage counter for a tool.
 */
export async function incrementUsage(userId: string, toolName: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_usage", {
    p_user_id: userId,
    p_tool_name: toolName,
    p_month: currentMonthDate(),
  });
  if (error) {
    console.error("Failed to increment usage:", error);
  }
}
```

**Step 2: Commit**

```bash
git add lib/api-helpers.ts
git commit -m "feat: extract shared API auth and usage helpers"
```

---

### Task 7: Update sidebar navigation

**Files:**
- Modify: `components/dashboard/sidebar.tsx`

**Step 1: Update navItems with tool groups**

Replace the `navItems` const with:

```typescript
const navGroups = [
  {
    label: null,
    items: [{ href: "/dashboard", label: "Dashboard", exact: true }],
  },
  {
    label: "Understand",
    items: [{ href: "/tools/code-explainer", label: "Code Explainer" }],
  },
  {
    label: "Decide",
    items: [{ href: "/tools/integration-planner", label: "Integration Planner" }],
  },
  {
    label: "Build",
    items: [{ href: "/tools/code-generator", label: "Code Generator" }],
  },
  {
    label: "Maintain",
    items: [{ href: "/tools/dependency-audit", label: "Dependency Audit" }],
  },
];
```

Update the `<nav>` to render groups:

```tsx
<nav className="mt-6 flex-1 space-y-4">
  {navGroups.map((group) => (
    <div key={group.label ?? "main"}>
      {group.label && (
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-500 mb-1">
          {group.label}
        </p>
      )}
      <div className="space-y-1">
        {group.items.map(({ href, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                isActive
                  ? "bg-surface-800 text-white"
                  : "text-muted-300 hover:bg-surface-800 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  ))}
</nav>
```

**Step 2: Run existing fast tests to verify sidebar still works**

Run: `npx playwright test --project=fast --config=playwright/playwright.config.ts`
Expected: All existing tests pass

**Step 3: Commit**

```bash
git add components/dashboard/sidebar.tsx
git commit -m "feat: update sidebar with grouped tool navigation"
```

---

### Task 8: Update dashboard hub

**Files:**
- Modify: `components/dashboard/dashboard-content.tsx`

**Step 1: Replace the single "Tools" card with a workflow hub**

Replace the tools card section (the third card in the grid) with:

```tsx
{/* Workflow stages */}
<div className="mt-8">
  <h2 className="font-heading text-lg font-bold text-white">Tools</h2>
  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {[
      {
        stage: "Understand",
        description: "Explain code and errors in plain English",
        tools: [{ href: "/tools/code-explainer", label: "Code Explainer" }],
      },
      {
        stage: "Decide",
        description: "Plan integrations and choose packages",
        tools: [{ href: "/tools/integration-planner", label: "Integration Planner" }],
      },
      {
        stage: "Build",
        description: "Generate integration code and tests",
        tools: [{ href: "/tools/code-generator", label: "Code Generator" }],
      },
      {
        stage: "Maintain",
        description: "Audit dependencies and check health",
        tools: [{ href: "/tools/dependency-audit", label: "Dependency Audit" }],
      },
    ].map((stage) => (
      <div
        key={stage.stage}
        className="rounded-lg border border-surface-700 bg-surface-900 p-5"
      >
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-brand-400">
          {stage.stage}
        </h3>
        <p className="mt-1 text-xs text-muted-500">{stage.description}</p>
        <div className="mt-3 space-y-1">
          {stage.tools.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              className="block text-sm font-medium text-muted-300 hover:text-white transition-colors"
            >
              {tool.label} &rarr;
            </a>
          ))}
        </div>
      </div>
    ))}
  </div>
</div>
```

Remove the old standalone "Tools" card from the grid above.

**Step 2: Run existing tests**

Run: `npx playwright test --project=fast --config=playwright/playwright.config.ts`
Expected: All pass (dashboard tests check for heading/plan/usage, not specific tool links)

**Step 3: Commit**

```bash
git add components/dashboard/dashboard-content.tsx
git commit -m "feat: replace tools card with workflow hub on dashboard"
```

---

## Part 2: Code Explainer (Understand)

### Task 9: Claude function for Code Explainer

**Files:**
- Modify: `lib/claude.ts`

**Step 1: Add Zod schema and function**

Add below the existing NuGet Advisor code:

```typescript
// --- Code Explainer ---

const CodeExplainerSchema = z.object({
  explanation: z.string(),
  detectedPackages: z.array(z.string()),
  detectedPatterns: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type CodeExplainerResult = z.infer<typeof CodeExplainerSchema>;

export async function getCodeExplanation(
  code: string,
  scopeQuestion: string,
  language: string,
  framework: string
): Promise<CodeExplainerResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a code explainer for developers and non-developers. The user has pasted ${language} code (${framework}) and wants to understand: "${scopeQuestion}".

Analyse this code and return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "explanation": "A clear, plain English explanation accessible to non-developers. Explain what the code does, not how.",
  "detectedPackages": ["List", "of", "packages/libraries used"],
  "detectedPatterns": ["List", "of", "design patterns or integration patterns detected"],
  "nextStepSuggestion": "A 1-2 sentence recommendation for what the user should do next, referencing a specific tool.",
  "nextStepToolId": "integration-planner or package-advisor (whichever is most relevant)",
  "nextStepDescription": "Context-aware description for why the recommended tool would help, referencing specifics from this code."
}

The code:
${code}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return CodeExplainerSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}
```

**Step 2: Commit**

```bash
git add lib/claude.ts
git commit -m "feat: add Code Explainer Claude function with Zod schema"
```

---

### Task 10: Code Explainer API route

**Files:**
- Create: `app/api/tools/code-explainer/route.ts`

**Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCodeExplanation } from "@/lib/claude";
import { TOOL_NAME_CODE_EXPLAINER } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_CODE_EXPLAINER);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { code, scopeQuestion, language, framework } = body as {
    code?: string;
    scopeQuestion?: string;
    language?: string;
    framework?: string;
  };

  if (!code?.trim()) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  if (code.length > 5000) {
    return NextResponse.json({ error: "Code exceeds 5,000 character limit" }, { status: 400 });
  }

  if (!language) {
    return NextResponse.json({ error: "Language is required" }, { status: 400 });
  }

  let result;
  try {
    result = await getCodeExplanation(
      code.trim(),
      scopeQuestion?.trim() || "How does this code work?",
      language,
      framework || "unknown"
    );
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to explain code. Please try again." },
      { status: 500 }
    );
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_CODE_EXPLAINER);

  return NextResponse.json(result);
}
```

**Step 2: Commit**

```bash
git add app/api/tools/code-explainer/route.ts
git commit -m "feat: add Code Explainer API route"
```

---

### Task 11: Code Explainer result component

**Files:**
- Create: `components/tools/code-explainer/result-cards.tsx`

**Step 1: Write the component**

```typescript
import type { CodeExplainerResult } from "@/lib/claude";

export function CodeExplainerResultCards({ result }: { result: CodeExplainerResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Explanation
        </h3>
        <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.explanation}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
            Detected packages
          </h3>
          {result.detectedPackages.length > 0 ? (
            <ul className="mt-2 list-disc list-inside space-y-1">
              {result.detectedPackages.map((pkg) => (
                <li key={pkg} className="text-sm text-muted-300">{pkg}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-500">No packages detected.</p>
          )}
        </div>

        <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
            Detected patterns
          </h3>
          {result.detectedPatterns.length > 0 ? (
            <ul className="mt-2 list-disc list-inside space-y-1">
              {result.detectedPatterns.map((pattern) => (
                <li key={pattern} className="text-sm text-muted-300">{pattern}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-500">No specific patterns detected.</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/tools/code-explainer/result-cards.tsx
git commit -m "feat: add Code Explainer result cards component"
```

---

### Task 12: Code Explainer form component

**Files:**
- Create: `components/tools/code-explainer/explainer-form.tsx`

**Step 1: Write the form**

```typescript
"use client";

import { useState, useEffect } from "react";
import { CodeExplainerResultCards } from "./result-cards";
import { StackSelector } from "@/components/shared/stack-selector";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { loadWorkflowContext } from "@/lib/workflow-context";
import type { CodeExplainerResult } from "@/lib/claude";
import type { SelectedStack } from "@/lib/stack-options";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";

const SCOPE_OPTIONS = [
  { value: "how-it-works", label: "How does this code work?" },
  { value: "specific-function", label: "What does a specific function do?" },
  { value: "why-failing", label: "Why might this be failing?" },
  { value: "dependencies", label: "What does this depend on?" },
];

const ACCEPTED_FROM = ["error-explainer", "health-checker"];

type Props = {
  usageCount: number;
  isPro: boolean;
};

export function ExplainerForm({ usageCount, isPro }: Props) {
  const [code, setCode] = useState("");
  const [scopeQuestion, setScopeQuestion] = useState(SCOPE_OPTIONS[0].value);
  const [stack, setStack] = useState<SelectedStack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CodeExplainerResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);
  const [contextBanner, setContextBanner] = useState<string | null>(null);

  const limitReached = !isPro && currentUsage >= FREE_MONTHLY_LIMIT;

  // Load workflow context on mount
  useEffect(() => {
    const ctx = loadWorkflowContext(ACCEPTED_FROM);
    if (ctx) {
      setContextBanner(`Continuing from ${ctx.sourceToolId} — ${ctx.language}, ${ctx.framework}`);
      if (ctx.payload.code) setCode(String(ctx.payload.code).slice(0, 5000));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stack) {
      setError("Please select a language.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/code-explainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          scopeQuestion: SCOPE_OPTIONS.find((o) => o.value === scopeQuestion)?.label ?? scopeQuestion,
          language: stack.language,
          framework: stack.framework,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setCurrentUsage(FREE_MONTHLY_LIMIT);
        } else {
          setError(data.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      setResult(data);
      setCurrentUsage((prev) => prev + 1);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (limitReached) {
    return (
      <div className="rounded-lg border border-yellow-700 bg-yellow-950/30 p-6 text-center">
        <p className="text-sm font-medium text-yellow-300">
          You&apos;ve used all {FREE_MONTHLY_LIMIT} free lookups this month.
        </p>
        <p className="mt-1 text-sm text-muted-400">Upgrade to Pro for unlimited access.</p>
        <a
          href="/upgrade"
          className="mt-4 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          Upgrade to Pro
        </a>
      </div>
    );
  }

  const recommendations: WorkflowRecommendation[] = result
    ? [
        {
          toolId: result.nextStepToolId,
          toolName: result.nextStepToolId === "integration-planner" ? "Integration Planner" : "Package Advisor",
          href: result.nextStepToolId === "integration-planner" ? "/tools/integration-planner" : "/tools/package-advisor",
          description: result.nextStepDescription,
          contextSummary: `Language: ${stack?.language ?? "unknown"}, Packages: ${result.detectedPackages.join(", ") || "none"}`,
        },
      ]
    : [];

  return (
    <div>
      {contextBanner && (
        <div className="mb-4 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm text-brand-300">
          {contextBanner}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <StackSelector onChange={setStack} />

        <div>
          <label htmlFor="scope-question" className="block text-sm font-medium text-muted-300">
            What do you want to understand?
          </label>
          <select
            id="scope-question"
            value={scopeQuestion}
            onChange={(e) => setScopeQuestion(e.target.value)}
            disabled={loading}
            className="mt-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {SCOPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <CharLimitedInput
          id="code-input"
          value={code}
          onChange={setCode}
          maxLength={5000}
          placeholder="Paste the relevant code section here..."
          disabled={loading}
          rows={10}
          label="Code"
          hint="Focus on the function or class you're asking about, not the whole file."
        />

        <button
          type="submit"
          disabled={loading || !code.trim() || !stack}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Explaining..." : "Explain"}
        </button>
      </form>

      {!isPro && (
        <p className="mt-2 text-xs text-muted-500">
          {currentUsage} of {FREE_MONTHLY_LIMIT} free lookups used this month
        </p>
      )}

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <CodeExplainerResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="code-explainer"
              language={stack?.language ?? ""}
              framework={stack?.framework ?? ""}
              payload={{
                detectedPackages: result.detectedPackages,
                explanation: result.explanation.slice(0, 500),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/tools/code-explainer/explainer-form.tsx
git commit -m "feat: add Code Explainer form with stack selector and workflow handoff"
```

---

### Task 13: Code Explainer server page

**Files:**
- Create: `app/(dashboard)/tools/code-explainer/page.tsx`

**Step 1: Write the page**

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExplainerForm } from "@/components/tools/code-explainer/explainer-form";
import { currentMonthDate } from "@/lib/utils";
import { isProUser } from "@/lib/subscription";

export default async function CodeExplainerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [isPro, { data: usageRows }] = await Promise.all([
    isProUser(user.id),
    supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("month", currentMonthDate()),
  ]);

  const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-white">Code Explainer</h1>
      <p className="mt-2 text-muted-400">
        Paste a code snippet and get a plain English explanation of what it does,
        what packages it uses, and what patterns it follows.
      </p>

      <div className="mt-8">
        <ExplainerForm usageCount={totalUsage} isPro={isPro} />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(dashboard\)/tools/code-explainer/page.tsx
git commit -m "feat: add Code Explainer server page"
```

---

### Task 14: Code Explainer tests

**Files:**
- Create: `playwright/mocks/fixtures/code-explainer-success.json`
- Create: `playwright/pages/code-explainer.page.ts`
- Create: `playwright/tests/fast/code-explainer.spec.ts`
- Modify: `playwright/fixtures/index.ts`

**Step 1: Write the mock fixture**

```json
{
  "explanation": "This code creates an HTTP client that connects to the Stripe payment API. It handles creating payment intents and processing webhook events for subscription billing.",
  "detectedPackages": ["Stripe.NET", "Microsoft.Extensions.Http"],
  "detectedPatterns": ["Dependency Injection", "Webhook Handler", "Repository Pattern"],
  "nextStepSuggestion": "The Integration Planner can help you map out the full payment flow including error handling and testing.",
  "nextStepToolId": "integration-planner",
  "nextStepDescription": "Your code uses Stripe.NET for payment processing. The Integration Planner can help you map out a full integration strategy — covering webhook handling, error recovery, and testing approaches for your C# Stripe setup."
}
```

**Step 2: Write the page object**

```typescript
// playwright/pages/code-explainer.page.ts
import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class CodeExplainerPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /code explainer/i });
  }

  get formInput(): Locator {
    return this.codeInput;
  }

  get codeInput(): Locator {
    return this.main.locator('textarea[id="code-input"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get languageSelect(): Locator {
    return this.main.locator('select[id="stack-language"]');
  }

  get explanationCard(): Locator {
    return this.main.getByRole("heading", { name: "Explanation" }).locator("..");
  }

  get detectedPackagesCard(): Locator {
    return this.main.getByRole("heading", { name: "Detected packages" }).locator("..");
  }

  get detectedPatternsCard(): Locator {
    return this.main.getByRole("heading", { name: "Detected patterns" }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/code-explainer");
  }

  async explainCode(code: string, language = "csharp") {
    await this.languageSelect.selectOption(language);
    await this.codeInput.fill(code);
    await this.submitButton.click();
  }
}
```

**Step 3: Add mockApi method to fixtures**

In `playwright/fixtures/index.ts`, add to the `MockApiFactory` type:

```typescript
codeExplainer: (page: Page, scenario?: "success" | "error") => Promise<void>;
```

Add to the `mockApi` implementation:

```typescript
codeExplainer: async (page: Page, scenario: "success" | "error" = "success") => {
  const fixturePath = path.resolve(
    __dirname,
    `../mocks/fixtures/code-explainer-${scenario}.json`
  );
  const body = readFileSync(fixturePath, "utf-8");
  const status = scenario === "error" ? 500 : 200;

  await page.route("**/api/tools/code-explainer", (route) =>
    route.fulfill({ status, contentType: "application/json", body })
  );
},
```

**Step 4: Write the fast tests**

```typescript
// playwright/tests/fast/code-explainer.spec.ts
import { test, expect } from "../../fixtures";
import { CodeExplainerPage } from "../../pages/code-explainer.page";

test.describe("Code Explainer", () => {
  test("free user submits code and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "success");

    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();

    await explainer.explainCode("public class PaymentService { }");

    await expect(explainer.explanationCard).toBeVisible({ timeout: 5000 });
    await expect(explainer.detectedPackagesCard).toBeVisible();
    await expect(explainer.detectedPatternsCard).toBeVisible();
  });

  test("shows What's Next section after results", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "success");

    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();

    await explainer.explainCode("public class PaymentService { }");

    await expect(explainer.whatsNextSection).toBeVisible({ timeout: 5000 });
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "success");

    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();

    await expect(explainer.languageSelect).toBeVisible();
    await explainer.languageSelect.selectOption("python");
    await expect(explainer.languageSelect).toHaveValue("python");
  });

  test("submit disabled without code", async ({ freeUserPage }) => {
    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();

    await expect(explainer.submitButton).toBeDisabled();
  });

  test("pro user sees no usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.codeExplainer(proUserPage, "success");

    const explainer = new CodeExplainerPage(proUserPage);
    await explainer.goto();

    await expect(explainer.usageCounter).not.toBeVisible();
  });
});
```

**Step 5: Run tests**

Run: `npx playwright test --project=fast --config=playwright/playwright.config.ts code-explainer`
Expected: All 5 tests pass

**Step 6: Commit**

```bash
git add playwright/mocks/fixtures/code-explainer-success.json playwright/pages/code-explainer.page.ts playwright/tests/fast/code-explainer.spec.ts playwright/fixtures/index.ts
git commit -m "test: add Code Explainer fast tests with mock fixtures"
```

---

## Part 3: Integration Planner (Decide)

### Task 15: Claude function for Integration Planner

**Files:**
- Modify: `lib/claude.ts`

**Step 1: Add schema and function**

```typescript
// --- Integration Planner ---

const IntegrationPlannerSchema = z.object({
  approach: z.string(),
  recommendedPackages: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
  })),
  architectureOverview: z.string(),
  considerations: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type IntegrationPlannerResult = z.infer<typeof IntegrationPlannerSchema>;

export async function getIntegrationPlan(
  description: string,
  language: string,
  framework: string
): Promise<IntegrationPlannerResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an integration planning advisor. The user wants to build an integration using ${language} (${framework}): "${description}".

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "approach": "A clear, plain English summary of the recommended approach.",
  "recommendedPackages": [{"name": "PackageName", "purpose": "What it's used for"}],
  "architectureOverview": "High-level architecture description — components, data flow, key patterns.",
  "considerations": ["Security consideration", "Error handling note", "Testing approach"],
  "nextStepSuggestion": "A 1-2 sentence recommendation for what to do next.",
  "nextStepToolId": "integration-code-generator or api-wrapper-generator",
  "nextStepDescription": "Context-aware description referencing specifics from this plan."
}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return IntegrationPlannerSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}
```

**Step 2: Commit**

```bash
git add lib/claude.ts
git commit -m "feat: add Integration Planner Claude function"
```

---

### Task 16: Integration Planner API route, components, page

**Files:**
- Create: `app/api/tools/integration-planner/route.ts`
- Create: `components/tools/integration-planner/result-cards.tsx`
- Create: `components/tools/integration-planner/planner-form.tsx`
- Create: `app/(dashboard)/tools/integration-planner/page.tsx`

Follow the same patterns as Code Explainer (Tasks 10-13) but with:
- Input: textarea (2,000 char limit) for integration description, no scope question
- Accepted context from: `["code-explainer"]`
- Results: approach card, recommended packages (list with name+purpose), architecture overview, considerations (bullet list)
- WorkflowNext hands off to: Integration Code Generator (`/tools/code-generator`)
- API validation: description required, max 2000 chars, language required

**Step 1: Write API route** (`app/api/tools/integration-planner/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getIntegrationPlan } from "@/lib/claude";
import { TOOL_NAME_INTEGRATION_PLANNER } from "@/lib/constants";
import { authenticateAndCheckUsage, incrementUsage } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  const auth = await authenticateAndCheckUsage(TOOL_NAME_INTEGRATION_PLANNER);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { description, language, framework } = body as {
    description?: string;
    language?: string;
    framework?: string;
  };

  if (!description?.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }
  if (description.length > 2000) {
    return NextResponse.json({ error: "Description exceeds 2,000 character limit" }, { status: 400 });
  }
  if (!language) {
    return NextResponse.json({ error: "Language is required" }, { status: 400 });
  }

  let result;
  try {
    result = await getIntegrationPlan(description.trim(), language, framework || "unknown");
  } catch (err) {
    console.error("Claude API error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Failed to create plan. Please try again." }, { status: 500 });
  }

  await incrementUsage(auth.context.userId, TOOL_NAME_INTEGRATION_PLANNER);
  return NextResponse.json(result);
}
```

**Step 2: Write result cards** (`components/tools/integration-planner/result-cards.tsx`)

```typescript
import type { IntegrationPlannerResult } from "@/lib/claude";

export function PlannerResultCards({ result }: { result: IntegrationPlannerResult }) {
  return (
    <div className="mt-8 space-y-4">
      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Recommended approach
        </h3>
        <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.approach}</p>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Recommended packages
        </h3>
        {result.recommendedPackages.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {result.recommendedPackages.map((pkg) => (
              <li key={pkg.name} className="text-sm">
                <span className="font-medium text-white">{pkg.name}</span>
                <span className="text-muted-400"> — {pkg.purpose}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-500">No specific packages recommended.</p>
        )}
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Architecture overview
        </h3>
        <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.architectureOverview}</p>
      </div>

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Considerations
        </h3>
        <ul className="mt-2 list-disc list-inside space-y-1">
          {result.considerations.map((item) => (
            <li key={item} className="text-sm text-muted-300">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

**Step 3: Write form** (`components/tools/integration-planner/planner-form.tsx`)

```typescript
"use client";

import { useState, useEffect } from "react";
import { PlannerResultCards } from "./result-cards";
import { StackSelector } from "@/components/shared/stack-selector";
import { CharLimitedInput } from "@/components/shared/char-limited-input";
import { WorkflowNext, type WorkflowRecommendation } from "@/components/shared/workflow-next";
import { loadWorkflowContext } from "@/lib/workflow-context";
import type { IntegrationPlannerResult } from "@/lib/claude";
import type { SelectedStack } from "@/lib/stack-options";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";

const ACCEPTED_FROM = ["code-explainer"];

type Props = {
  usageCount: number;
  isPro: boolean;
};

export function PlannerForm({ usageCount, isPro }: Props) {
  const [description, setDescription] = useState("");
  const [stack, setStack] = useState<SelectedStack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IntegrationPlannerResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);
  const [contextBanner, setContextBanner] = useState<string | null>(null);

  const limitReached = !isPro && currentUsage >= FREE_MONTHLY_LIMIT;

  useEffect(() => {
    const ctx = loadWorkflowContext(ACCEPTED_FROM);
    if (ctx) {
      setContextBanner(`Continuing from ${ctx.sourceToolId} — ${ctx.language}, ${ctx.framework}`);
      if (ctx.payload.detectedPackages) {
        const packages = (ctx.payload.detectedPackages as string[]).join(", ");
        setDescription(`I need to integrate with: ${packages}`);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stack) {
      setError("Please select a language.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tools/integration-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, language: stack.language, framework: stack.framework }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) setCurrentUsage(FREE_MONTHLY_LIMIT);
        else setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setResult(data);
      setCurrentUsage((prev) => prev + 1);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (limitReached) {
    return (
      <div className="rounded-lg border border-yellow-700 bg-yellow-950/30 p-6 text-center">
        <p className="text-sm font-medium text-yellow-300">
          You&apos;ve used all {FREE_MONTHLY_LIMIT} free lookups this month.
        </p>
        <p className="mt-1 text-sm text-muted-400">Upgrade to Pro for unlimited access.</p>
        <a href="/upgrade" className="mt-4 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors">
          Upgrade to Pro
        </a>
      </div>
    );
  }

  const recommendations: WorkflowRecommendation[] = result
    ? [{
        toolId: "integration-code-generator",
        toolName: "Code Generator",
        href: "/tools/code-generator",
        description: result.nextStepDescription,
        contextSummary: `Language: ${stack?.language ?? "unknown"}, Packages: ${result.recommendedPackages.map((p) => p.name).join(", ")}`,
      }]
    : [];

  return (
    <div>
      {contextBanner && (
        <div className="mb-4 rounded-lg border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm text-brand-300">
          {contextBanner}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <StackSelector onChange={setStack} />

        <CharLimitedInput
          id="description-input"
          value={description}
          onChange={setDescription}
          maxLength={2000}
          placeholder='e.g. "I need to connect my app to Stripe for subscription billing with webhooks"'
          disabled={loading}
          rows={4}
          label="What do you need to integrate?"
          hint="Describe the systems you want to connect and what you need them to do."
        />

        <button
          type="submit"
          disabled={loading || !description.trim() || !stack}
          className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-950"
        >
          {loading ? "Planning..." : "Plan Integration"}
        </button>
      </form>

      {!isPro && (
        <p className="mt-2 text-xs text-muted-500">
          {currentUsage} of {FREE_MONTHLY_LIMIT} free lookups used this month
        </p>
      )}

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
        {result && (
          <>
            <PlannerResultCards result={result} />
            <WorkflowNext
              recommendations={recommendations}
              sourceToolId="integration-planner"
              language={stack?.language ?? ""}
              framework={stack?.framework ?? ""}
              payload={{
                approach: result.approach.slice(0, 500),
                packages: result.recommendedPackages,
                architecture: result.architectureOverview.slice(0, 500),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Write server page** (`app/(dashboard)/tools/integration-planner/page.tsx`)

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlannerForm } from "@/components/tools/integration-planner/planner-form";
import { currentMonthDate } from "@/lib/utils";
import { isProUser } from "@/lib/subscription";

export default async function IntegrationPlannerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [isPro, { data: usageRows }] = await Promise.all([
    isProUser(user.id),
    supabase.from("usage").select("count").eq("user_id", user.id).eq("month", currentMonthDate()),
  ]);

  const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-white">Integration Planner</h1>
      <p className="mt-2 text-muted-400">
        Describe what you need to integrate and get an AI-powered plan with recommended
        packages, architecture, and key considerations.
      </p>
      <div className="mt-8">
        <PlannerForm usageCount={totalUsage} isPro={isPro} />
      </div>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add app/api/tools/integration-planner/route.ts components/tools/integration-planner/ app/\(dashboard\)/tools/integration-planner/page.tsx
git commit -m "feat: add Integration Planner tool (Decide stage)"
```

---

### Task 17: Integration Planner tests

**Files:**
- Create: `playwright/mocks/fixtures/integration-planner-success.json`
- Create: `playwright/pages/integration-planner.page.ts`
- Create: `playwright/tests/fast/integration-planner.spec.ts`
- Modify: `playwright/fixtures/index.ts`

Follow same pattern as Task 14. Mock fixture:

```json
{
  "approach": "Use Stripe.NET SDK with webhook-based event processing. Create a PaymentService that wraps the Stripe API and handles checkout sessions, subscription lifecycle, and invoice events.",
  "recommendedPackages": [
    {"name": "Stripe.NET", "purpose": "Official Stripe SDK for .NET"},
    {"name": "Microsoft.Extensions.Http", "purpose": "HTTP client factory for resilient API calls"}
  ],
  "architectureOverview": "Three-layer architecture: Controller (webhook endpoint + checkout API) → Service (PaymentService wrapping Stripe SDK) → Repository (subscription state in database). Webhooks drive state changes; API calls are idempotent.",
  "considerations": ["Verify webhook signatures to prevent spoofing", "Use idempotency keys for payment creation", "Handle subscription state transitions atomically", "Test with Stripe CLI for local webhook testing"],
  "nextStepSuggestion": "Generate the integration boilerplate with the Code Generator.",
  "nextStepToolId": "integration-code-generator",
  "nextStepDescription": "You've planned a Stripe payment integration with webhook handling and idempotency. The Code Generator can produce the boilerplate — controllers, webhook handlers, and DTOs based on this plan."
}
```

Page object, test specs, and mockApi entry follow the same structure as Code Explainer tests. Key test cases:
- Free user submits and sees result cards (approach, packages, architecture, considerations)
- Shows What's Next section
- Language selector works
- Submit disabled without description
- Pro user sees no usage counter

**Step 1: Create all files and add mockApi method**

**Step 2: Run tests**

Run: `npx playwright test --project=fast --config=playwright/playwright.config.ts integration-planner`
Expected: All pass

**Step 3: Commit**

```bash
git add playwright/mocks/fixtures/integration-planner-success.json playwright/pages/integration-planner.page.ts playwright/tests/fast/integration-planner.spec.ts playwright/fixtures/index.ts
git commit -m "test: add Integration Planner fast tests"
```

---

## Part 4: Integration Code Generator (Build)

### Task 18: Claude function for Code Generator

**Files:**
- Modify: `lib/claude.ts`

**Step 1: Add schema and function**

```typescript
// --- Integration Code Generator ---

const CodeGeneratorSchema = z.object({
  files: z.array(z.object({
    filename: z.string(),
    description: z.string(),
    code: z.string(),
  })),
  setupInstructions: z.string(),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type CodeGeneratorResult = z.infer<typeof CodeGeneratorSchema>;

export async function generateIntegrationCode(
  spec: string,
  language: string,
  framework: string
): Promise<CodeGeneratorResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are an integration code generator. Generate boilerplate code for this integration using ${language} (${framework}): "${spec}".

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "files": [
    {"filename": "FileName.ext", "description": "What this file does", "code": "// Full file contents"}
  ],
  "setupInstructions": "Step-by-step setup instructions (package install commands, config, env vars).",
  "nextStepSuggestion": "Recommendation for next step.",
  "nextStepToolId": "unit-test-generator",
  "nextStepDescription": "Context-aware description for generating tests for this code."
}

Generate 2-4 files max. Keep code production-ready but concise.`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return CodeGeneratorSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}
```

**Step 2: Commit**

```bash
git add lib/claude.ts
git commit -m "feat: add Code Generator Claude function"
```

---

### Task 19: Code Generator API route, components, page

**Files:**
- Create: `app/api/tools/code-generator/route.ts`
- Create: `components/tools/code-generator/result-cards.tsx`
- Create: `components/tools/code-generator/generator-form.tsx`
- Create: `app/(dashboard)/tools/code-generator/page.tsx`

Follow same patterns. Key differences:
- Input: 2,000 char textarea for integration spec
- Accepted context from: `["integration-planner", "package-advisor", "migration-assistant"]`
- Pre-fill from context: builds spec from approach + packages
- Results: file list (filename + description + code block with copy button), setup instructions
- WorkflowNext hands off to: Unit Test Generator (not built in 8a, show as "Coming soon" or omit)
- max_tokens: 2048 (code generation needs more tokens)

Result cards component should render code blocks with a monospace font and a copy-to-clipboard button:

```typescript
// components/tools/code-generator/result-cards.tsx
"use client";

import { useState } from "react";
import type { CodeGeneratorResult } from "@/lib/claude";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-muted-400 hover:text-white transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function GeneratorResultCards({ result }: { result: CodeGeneratorResult }) {
  return (
    <div className="mt-8 space-y-4">
      {result.files.map((file) => (
        <div key={file.filename} className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-semibold text-white">{file.filename}</h3>
            <CopyButton text={file.code} />
          </div>
          <p className="mt-1 text-xs text-muted-500">{file.description}</p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-950 p-4 text-xs text-muted-300 font-mono">
            <code>{file.code}</code>
          </pre>
        </div>
      ))}

      <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
          Setup instructions
        </h3>
        <p className="mt-2 text-sm text-muted-300 whitespace-pre-line">{result.setupInstructions}</p>
      </div>
    </div>
  );
}
```

API route, form, and page follow the established patterns from Tasks 10-13/16.

**Step 1: Create all files**

**Step 2: Commit**

```bash
git add app/api/tools/code-generator/route.ts components/tools/code-generator/ app/\(dashboard\)/tools/code-generator/page.tsx
git commit -m "feat: add Integration Code Generator tool (Build stage)"
```

---

### Task 20: Code Generator tests

Same pattern as Tasks 14/17. Mock fixture with 2 generated files, page object, 5 fast tests.

**Step 1: Create test files, add mockApi method**

**Step 2: Run and verify**

**Step 3: Commit**

```bash
git add playwright/mocks/fixtures/code-generator-success.json playwright/pages/code-generator.page.ts playwright/tests/fast/code-generator.spec.ts playwright/fixtures/index.ts
git commit -m "test: add Code Generator fast tests"
```

---

## Part 5: Dependency Audit (Maintain)

### Task 21: Claude function for Dependency Audit

**Files:**
- Modify: `lib/claude.ts`

```typescript
// --- Dependency Audit ---

const DependencyAuditSchema = z.object({
  summary: z.string(),
  dependencies: z.array(z.object({
    name: z.string(),
    currentVersion: z.string(),
    latestVersion: z.string(),
    status: z.enum(["up-to-date", "outdated", "vulnerable", "deprecated"]),
    note: z.string(),
  })),
  recommendations: z.array(z.string()),
  nextStepSuggestion: z.string(),
  nextStepToolId: z.string(),
  nextStepDescription: z.string(),
});

export type DependencyAuditResult = z.infer<typeof DependencyAuditSchema>;

export async function auditDependencies(
  dependencyFile: string,
  language: string,
  framework: string
): Promise<DependencyAuditResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a dependency audit tool. Analyse this ${language} (${framework}) dependency file and check for outdated, vulnerable, or deprecated packages.

Return ONLY valid JSON — no markdown, no explanation, no code fences:
{
  "summary": "Overall health summary (e.g. '3 of 8 packages need attention').",
  "dependencies": [
    {"name": "PackageName", "currentVersion": "1.0.0", "latestVersion": "2.0.0", "status": "outdated", "note": "Major version available with breaking changes."}
  ],
  "recommendations": ["Priority action 1", "Priority action 2"],
  "nextStepSuggestion": "Recommendation for next step.",
  "nextStepToolId": "migration-assistant",
  "nextStepDescription": "Context-aware description for migrating outdated dependencies."
}

The dependency file:
${dependencyFile}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return DependencyAuditSchema.parse(JSON.parse(text));
  } catch {
    throw new Error(`Failed to parse Claude response: ${text}`);
  }
}
```

**Step 1: Commit**

```bash
git add lib/claude.ts
git commit -m "feat: add Dependency Audit Claude function"
```

---

### Task 22: Dependency Audit API route, components, page

**Files:**
- Create: `app/api/tools/dependency-audit/route.ts`
- Create: `components/tools/dependency-audit/result-cards.tsx`
- Create: `components/tools/dependency-audit/audit-form.tsx`
- Create: `app/(dashboard)/tools/dependency-audit/page.tsx`

Key differences:
- Input: 5,000 char textarea for dependency file content
- Accepted context from: `["unit-test-generator", "code-explainer"]`
- Results: summary card, dependency table (name, current, latest, status badge, note), recommendations list
- Status badges: green (up-to-date), yellow (outdated), red (vulnerable), grey (deprecated)
- WorkflowNext hands off to: Migration Assistant (not built in 8a, omit or show "Coming soon")
- Placeholder: "Paste your package.json, .csproj, requirements.txt, or go.mod here..."

Result cards should include colour-coded status badges:

```typescript
const statusColors: Record<string, string> = {
  "up-to-date": "text-green-400 bg-green-950/30 border-green-700",
  "outdated": "text-yellow-400 bg-yellow-950/30 border-yellow-700",
  "vulnerable": "text-red-400 bg-red-950/30 border-red-700",
  "deprecated": "text-muted-400 bg-surface-800 border-surface-700",
};
```

**Step 1: Create all files following established patterns**

**Step 2: Commit**

```bash
git add app/api/tools/dependency-audit/route.ts components/tools/dependency-audit/ app/\(dashboard\)/tools/dependency-audit/page.tsx
git commit -m "feat: add Dependency Audit tool (Maintain stage)"
```

---

### Task 23: Dependency Audit tests

Same pattern as previous tools. Mock fixture, page object, 5 fast tests.

**Step 1: Create test files**

**Step 2: Run and verify**

**Step 3: Commit**

```bash
git add playwright/mocks/fixtures/dependency-audit-success.json playwright/pages/dependency-audit.page.ts playwright/tests/fast/dependency-audit.spec.ts playwright/fixtures/index.ts
git commit -m "test: add Dependency Audit fast tests"
```

---

## Part 6: Shared Infrastructure Tests

### Task 24: Shared component tests

**Files:**
- Create: `playwright/tests/fast/shared-components.spec.ts`

**Step 1: Write tests for StackSelector, WorkflowNext, and workflow context**

```typescript
import { test, expect } from "../../fixtures";
import { CodeExplainerPage } from "../../pages/code-explainer.page";

test.describe("Shared Components", () => {
  test("StackSelector persists language across tools", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "success");

    // Set language on Code Explainer
    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();
    await explainer.languageSelect.selectOption("python");

    // Navigate to Integration Planner — language should persist
    await freeUserPage.goto("/tools/integration-planner");
    const langSelect = freeUserPage.locator('select[id="stack-language"]');
    await expect(langSelect).toHaveValue("python");
  });

  test("character counter shows remaining chars", async ({ freeUserPage }) => {
    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();

    await expect(freeUserPage.getByText(/characters remaining/)).toBeVisible();
  });

  test("context banner shows when arriving from hand-off", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "success");

    // Manually set workflow context in localStorage
    await freeUserPage.goto("/tools/code-explainer");
    await freeUserPage.evaluate(() => {
      localStorage.setItem("plexease_workflow_context", JSON.stringify({
        sourceToolId: "error-explainer",
        language: "csharp",
        framework: ".NET 8",
        payload: { code: "var x = 1;" },
        timestamp: new Date().toISOString(),
      }));
    });

    // Reload to pick up context
    await freeUserPage.reload();

    await expect(freeUserPage.getByText(/Continuing from/)).toBeVisible();
  });
});
```

**Step 2: Run tests**

Run: `npx playwright test --project=fast --config=playwright/playwright.config.ts shared-components`
Expected: All pass

**Step 3: Commit**

```bash
git add playwright/tests/fast/shared-components.spec.ts
git commit -m "test: add shared component tests for StackSelector, CharLimit, WorkflowContext"
```

---

## Part 7: Final Integration

### Task 25: Run all tests

**Step 1: Run full fast test suite**

Run: `npx playwright test --project=fast --config=playwright/playwright.config.ts`
Expected: All existing + new tests pass

**Step 2: Run slow canary tests**

Run: `npx playwright test --project=slow --config=playwright/playwright.config.ts`
Expected: Existing NuGet Advisor canary passes

**Step 3: Fix any failures**

---

### Task 26: Update PLEXEASE.md

**Files:**
- Modify: `PLEXEASE.md`

Update Phase 8a status to complete. Add notes about new tools, shared components, and test counts.

**Step 1: Update and commit**

```bash
git add PLEXEASE.md
git commit -m "docs: update PLEXEASE.md — Phase 8a complete"
```

---

## Test Matrix

| Tool / Component | Fast Tests | Slow Canary | E2E Workflow |
|---|---|---|---|
| Code Explainer | 5 (submit, results, what's next, language, disabled, pro) | Phase 8a-e2e | Phase 8a-e2e |
| Integration Planner | 5 | Phase 8a-e2e | Phase 8a-e2e |
| Code Generator | 5 | Phase 8a-e2e | Phase 8a-e2e |
| Dependency Audit | 5 | Phase 8a-e2e | Phase 8a-e2e |
| StackSelector | 2 (persistence, display) | N/A | Phase 8a-e2e |
| CharLimitedInput | 1 (counter display) | N/A | N/A |
| WorkflowContext | 1 (banner on hand-off) | N/A | Phase 8a-e2e |
| Dashboard Hub | Covered by existing | N/A | N/A |
| Sidebar Groups | Covered by existing | N/A | N/A |

**Total new fast tests: ~24**
**Existing tests: 51 fast + 4 slow**
**Expected after Phase 8a: ~75 fast + 4 slow**
