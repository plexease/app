# Phase 9b — Persona-Driven UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the dashboard from a one-size-fits-all tool list into three persona-driven views (Business Owner / Support & Operations / Implementer) with a view-switching toggle, AI-powered tool router, and lifecycle-based navigation categories.

**Architecture:** The dashboard layout reads a `viewing_as` cookie (defaulting to the user's `persona` from `user_profiles`) and passes it to the `DashboardContent` component, which renders one of three view variants. A new `/api/tools/router` endpoint provides AI-powered tool routing for the Business Owner hero input, with client-side keyword matching as a first layer and Claude Haiku as a fallback. Navigation categories are renamed from Understand/Decide/Build/Maintain to Explore/Set Up/Troubleshoot/Maintain.

**Tech Stack:** Next.js (TypeScript), Tailwind CSS v4, Supabase, Anthropic Claude Haiku API, Playwright

**Design doc:** `docs/plans/2026-03-09-phase9b-design.md`

---

### Task 1: Create feature branch

**Files:** None

**Step 1: Create and push feature branch**

```bash
cd /home/deck/Projects/plexease
git checkout main
git pull origin main
git checkout -b feature/phase-9b-persona-ui
```

**Step 2: Symlink .env.local if in worktree**

Only needed if using a worktree:
```bash
ln -s /home/deck/Projects/plexease/.env.local .env.local
```

---

### Task 2: Rename navigation categories and remap tools

**Files:**
- Modify: `components/dashboard/sidebar.tsx:12-47`
- Modify: `components/dashboard/dashboard-content.tsx:146-208`

**Step 1: Update sidebar navGroups**

In `components/dashboard/sidebar.tsx`, replace the `navGroups` array (lines 12-47) with:

```typescript
const navGroups: { label: string | null; items: { href: string; label: string; exact?: boolean }[] }[] = [
  {
    label: null,
    items: [{ href: "/dashboard", label: "Dashboard", exact: true }],
  },
  {
    label: "Explore",
    items: [
      { href: "/tools/package-advisor", label: "Package Advisor" },
      { href: "/tools/integration-planner", label: "Integration Planner" },
    ],
  },
  {
    label: "Set Up",
    items: [
      { href: "/tools/code-generator", label: "Code Generator" },
      { href: "/tools/api-wrapper-generator", label: "API Wrapper Generator" },
    ],
  },
  {
    label: "Troubleshoot",
    items: [
      { href: "/tools/error-explainer", label: "Error Explainer" },
      { href: "/tools/code-explainer", label: "Code Explainer" },
    ],
  },
  {
    label: "Maintain",
    items: [
      { href: "/tools/dependency-audit", label: "Dependency Audit" },
      { href: "/tools/health-checker", label: "Health Checker" },
      { href: "/tools/migration-assistant", label: "Migration Assistant" },
      { href: "/tools/unit-test-generator", label: "Unit Test Generator" },
    ],
  },
];
```

**Step 2: Update dashboard-content stage cards**

In `components/dashboard/dashboard-content.tsx`, replace the workflow stages array (lines 150-184) with:

```typescript
{[
  {
    stage: "Explore",
    description: "Figure out what you need — compare tools and plan integrations",
    tools: [
      { href: "/tools/package-advisor", label: "Package Advisor" },
      { href: "/tools/integration-planner", label: "Integration Planner" },
    ],
  },
  {
    stage: "Set Up",
    description: "Build and connect your services",
    tools: [
      { href: "/tools/code-generator", label: "Code Generator" },
      { href: "/tools/api-wrapper-generator", label: "API Wrapper Generator" },
    ],
  },
  {
    stage: "Troubleshoot",
    description: "Diagnose and fix integration issues",
    tools: [
      { href: "/tools/error-explainer", label: "Error Explainer" },
      { href: "/tools/code-explainer", label: "Code Explainer" },
    ],
  },
  {
    stage: "Maintain",
    description: "Keep your integrations healthy and up to date",
    tools: [
      { href: "/tools/dependency-audit", label: "Dependency Audit" },
      { href: "/tools/health-checker", label: "Health Checker" },
      { href: "/tools/migration-assistant", label: "Migration Assistant" },
      { href: "/tools/unit-test-generator", label: "Unit Test Generator" },
    ],
  },
].map((stage) => (
```

**Step 3: Run dev server and verify sidebar renders with new categories**

```bash
npm run dev
```

Open http://localhost:3000/dashboard — verify sidebar shows Explore / Set Up / Troubleshoot / Maintain with correct tools under each.

**Step 4: Commit**

```bash
git add components/dashboard/sidebar.tsx components/dashboard/dashboard-content.tsx
git commit -m "refactor: rename navigation categories to lifecycle-based (Explore/Set Up/Troubleshoot/Maintain)"
```

---

### Task 3: Create persona-variant tool descriptions

**Files:**
- Create: `lib/tool-descriptions.ts`

**Step 1: Create the tool descriptions file**

Create `lib/tool-descriptions.ts`:

```typescript
import type { Persona } from "@/lib/types/persona";

export type ToolId =
  | "code-explainer"
  | "error-explainer"
  | "package-advisor"
  | "integration-planner"
  | "code-generator"
  | "api-wrapper-generator"
  | "unit-test-generator"
  | "dependency-audit"
  | "health-checker"
  | "migration-assistant";

type ToolDescriptions = {
  label: string;
  href: string;
  category: "explore" | "setup" | "troubleshoot" | "maintain";
  descriptions: Record<Persona, string>;
};

export const TOOL_CATALOG: Record<ToolId, ToolDescriptions> = {
  "package-advisor": {
    label: "Package Advisor",
    href: "/tools/package-advisor",
    category: "explore",
    descriptions: {
      business_owner: "Get recommendations for the right tools",
      support_ops: "Compare packages and libraries for your stack",
      implementer: "Package comparison with compatibility analysis",
    },
  },
  "integration-planner": {
    label: "Integration Planner",
    href: "/tools/integration-planner",
    category: "explore",
    descriptions: {
      business_owner: "Plan how to connect your services",
      support_ops: "Architecture and approach for integrations",
      implementer: "Integration architecture, packages, patterns",
    },
  },
  "code-generator": {
    label: "Code Generator",
    href: "/tools/code-generator",
    category: "setup",
    descriptions: {
      business_owner: "Get ready-to-use code for your project",
      support_ops: "Generate boilerplate and implementation code",
      implementer: "Scaffold files from spec with setup instructions",
    },
  },
  "api-wrapper-generator": {
    label: "API Wrapper Generator",
    href: "/tools/api-wrapper-generator",
    category: "setup",
    descriptions: {
      business_owner: "Create code to talk to an external service",
      support_ops: "Generate typed API client wrappers",
      implementer: "Typed wrapper with auth setup and usage",
    },
  },
  "error-explainer": {
    label: "Error Explainer",
    href: "/tools/error-explainer",
    category: "troubleshoot",
    descriptions: {
      business_owner: "Find out why something stopped working",
      support_ops: "Diagnose error messages and stack traces",
      implementer: "Root cause analysis from errors and traces",
    },
  },
  "code-explainer": {
    label: "Code Explainer",
    href: "/tools/code-explainer",
    category: "troubleshoot",
    descriptions: {
      business_owner: "Understand what a piece of code does in plain English",
      support_ops: "Break down code snippets to understand logic and dependencies",
      implementer: "Parse code, identify patterns and packages",
    },
  },
  "dependency-audit": {
    label: "Dependency Audit",
    href: "/tools/dependency-audit",
    category: "maintain",
    descriptions: {
      business_owner: "Check if your project's tools are up to date",
      support_ops: "Audit dependencies for updates and vulnerabilities",
      implementer: "Dependency audit table with status badges",
    },
  },
  "health-checker": {
    label: "Health Checker",
    href: "/tools/health-checker",
    category: "maintain",
    descriptions: {
      business_owner: "Get a health report for your setup",
      support_ops: "Assess configuration health and risks",
      implementer: "Config health assessment with severity ratings",
    },
  },
  "migration-assistant": {
    label: "Migration Assistant",
    href: "/tools/migration-assistant",
    category: "maintain",
    descriptions: {
      business_owner: "Get help upgrading to a new version",
      support_ops: "Step-by-step migration with breaking changes",
      implementer: "Migration steps, breaking changes, effort estimate",
    },
  },
  "unit-test-generator": {
    label: "Unit Test Generator",
    href: "/tools/unit-test-generator",
    category: "maintain",
    descriptions: {
      business_owner: "Make sure your code works correctly",
      support_ops: "Generate test files for existing code",
      implementer: "Test scaffold with mocking approach",
    },
  },
};

/** Get tools grouped by lifecycle category, with descriptions for a specific persona. */
export function getToolsByCategory(persona: Persona) {
  const categories = {
    explore: { label: "Explore", description: getStageDescription("explore", persona), tools: [] as { label: string; href: string; description: string }[] },
    setup: { label: "Set Up", description: getStageDescription("setup", persona), tools: [] as { label: string; href: string; description: string }[] },
    troubleshoot: { label: "Troubleshoot", description: getStageDescription("troubleshoot", persona), tools: [] as { label: string; href: string; description: string }[] },
    maintain: { label: "Maintain", description: getStageDescription("maintain", persona), tools: [] as { label: string; href: string; description: string }[] },
  };

  for (const [, tool] of Object.entries(TOOL_CATALOG)) {
    categories[tool.category].tools.push({
      label: tool.label,
      href: tool.href,
      description: tool.descriptions[persona],
    });
  }

  return Object.values(categories);
}

/** Get all tools as a flat array with descriptions for a specific persona. */
export function getAllTools(persona: Persona) {
  return Object.entries(TOOL_CATALOG).map(([id, tool]) => ({
    id: id as ToolId,
    label: tool.label,
    href: tool.href,
    category: tool.category,
    description: tool.descriptions[persona],
  }));
}

function getStageDescription(stage: string, persona: Persona): string {
  const descriptions: Record<string, Record<Persona, string>> = {
    explore: {
      business_owner: "Figure out what you need",
      support_ops: "Research tools and plan integrations",
      implementer: "Evaluate packages and architecture options",
    },
    setup: {
      business_owner: "Build and connect your services",
      support_ops: "Generate code and API integrations",
      implementer: "Scaffold implementations and wrappers",
    },
    troubleshoot: {
      business_owner: "Find and fix problems",
      support_ops: "Diagnose errors and understand code",
      implementer: "Debug errors, analyse code",
    },
    maintain: {
      business_owner: "Keep everything running smoothly",
      support_ops: "Audit dependencies and check health",
      implementer: "Audit, test, migrate, monitor health",
    },
  };
  return descriptions[stage]?.[persona] ?? "";
}
```

**Step 2: Commit**

```bash
git add lib/tool-descriptions.ts
git commit -m "feat: add persona-variant tool descriptions catalog"
```

---

### Task 4: Create tool recommendations logic

**Files:**
- Create: `lib/tool-recommendations.ts`

**Step 1: Create the recommendations module**

Create `lib/tool-recommendations.ts`:

```typescript
import type { Persona, ComfortLevel, PrimaryGoal } from "@/lib/types/persona";
import { TOOL_CATALOG, type ToolId } from "@/lib/tool-descriptions";

/** Platform-to-tool relevance mapping. */
const PLATFORM_TOOLS: Record<string, ToolId[]> = {
  shopify: ["integration-planner", "health-checker", "error-explainer"],
  woocommerce: ["integration-planner", "code-generator", "health-checker"],
  xero: ["integration-planner", "api-wrapper-generator", "error-explainer"],
  stripe: ["api-wrapper-generator", "integration-planner", "code-generator"],
  "royal-mail": ["api-wrapper-generator", "integration-planner"],
  quickbooks: ["integration-planner", "api-wrapper-generator", "error-explainer"],
  magento: ["integration-planner", "health-checker", "migration-assistant"],
};

/** Goal-to-category priority. */
const GOAL_CATEGORY_PRIORITY: Record<string, string[]> = {
  setup: ["setup", "explore"],
  fixing: ["troubleshoot", "maintain"],
  evaluating: ["explore", "setup"],
  exploring: ["explore", "troubleshoot", "setup", "maintain"],
};

/** Comfort-level priority for tiebreaking (simpler tools first for guided users). */
const COMFORT_TOOL_PRIORITY: Record<string, ToolId[]> = {
  guided: ["error-explainer", "code-explainer", "health-checker", "package-advisor"],
  writes_code: ["code-generator", "api-wrapper-generator", "unit-test-generator", "migration-assistant"],
};

export function getRecommendedTools(
  platforms: string[],
  primaryGoal: PrimaryGoal | null,
  comfortLevel: ComfortLevel | null,
  count: number = 4
): ToolId[] {
  // Collect tools from platform mappings with frequency scores
  const toolScores = new Map<ToolId, number>();

  for (const platform of platforms) {
    const tools = PLATFORM_TOOLS[platform];
    if (!tools) continue;
    for (const toolId of tools) {
      toolScores.set(toolId, (toolScores.get(toolId) ?? 0) + 1);
    }
  }

  // If no platforms selected, use all tools with equal score
  if (toolScores.size === 0) {
    for (const toolId of Object.keys(TOOL_CATALOG) as ToolId[]) {
      toolScores.set(toolId, 1);
    }
  }

  // Sort by: goal-priority category, then platform frequency, then comfort tiebreaker
  const goalPriority = GOAL_CATEGORY_PRIORITY[primaryGoal ?? "exploring"] ?? [];
  const comfortPriority = COMFORT_TOOL_PRIORITY[comfortLevel ?? "docs_configs"] ?? [];

  const sorted = Array.from(toolScores.entries()).sort(([aId, aScore], [bId, bScore]) => {
    const aCat = TOOL_CATALOG[aId].category;
    const bCat = TOOL_CATALOG[bId].category;

    // Goal-priority category first
    const aGoalIdx = goalPriority.indexOf(aCat);
    const bGoalIdx = goalPriority.indexOf(bCat);
    const aGoal = aGoalIdx === -1 ? 999 : aGoalIdx;
    const bGoal = bGoalIdx === -1 ? 999 : bGoalIdx;
    if (aGoal !== bGoal) return aGoal - bGoal;

    // Platform frequency (higher = better)
    if (bScore !== aScore) return bScore - aScore;

    // Comfort tiebreaker
    const aComfort = comfortPriority.indexOf(aId);
    const bComfort = comfortPriority.indexOf(bId);
    const aC = aComfort === -1 ? 999 : aComfort;
    const bC = bComfort === -1 ? 999 : bComfort;
    return aC - bC;
  });

  return sorted.slice(0, count).map(([id]) => id);
}
```

**Step 2: Commit**

```bash
git add lib/tool-recommendations.ts
git commit -m "feat: add profile-based tool recommendation logic"
```

---

### Task 5: Add viewing_as cookie support to dashboard layout

**Files:**
- Modify: `app/(dashboard)/layout.tsx`
- Modify: `app/(dashboard)/dashboard/page.tsx`
- Modify: `lib/types/persona.ts`

**Step 1: Add ViewingAs type**

In `lib/types/persona.ts`, add at the bottom:

```typescript
/** Ephemeral view mode — which persona's UI to render. Stored in cookie, defaults to user's persona. */
export type ViewingAs = Persona;
```

**Step 2: Update dashboard layout to read viewing_as and fetch profile**

In `app/(dashboard)/layout.tsx`, update to read the `viewing_as` cookie and fetch the user profile, passing both to the Sidebar:

```typescript
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";
import { getUserProfile } from "@/lib/user-profile";
import { currentMonthDate } from "@/lib/utils";
import { Sidebar } from "@/components/dashboard/sidebar";
import type { Persona } from "@/lib/types/persona";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const plan = await getUserPlan(user.id);
  const profile = await getUserProfile(user.id);

  // Get total usage across all tools for the current month
  const { data: usageRows } = await supabase
    .from("usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", currentMonthDate());

  const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  // Read viewing_as cookie, default to user's persona
  const cookieStore = await cookies();
  const viewingAsCookie = cookieStore.get("viewing_as")?.value as Persona | undefined;
  const validPersonas: Persona[] = ["business_owner", "support_ops", "implementer"];
  const viewingAs: Persona = viewingAsCookie && validPersonas.includes(viewingAsCookie)
    ? viewingAsCookie
    : (profile?.persona ?? "business_owner");

  // Reconcile once per session (not on every page load)
  const alreadyReconciled = cookieStore.get("reconciled");

  if (!alreadyReconciled && plan.plan !== "free") {
    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (userData?.stripe_customer_id) {
      const { reconcileSubscription } = await import("@/lib/subscription");
      await reconcileSubscription(user.id, userData.stripe_customer_id);
    }

    try {
      cookieStore.set("reconciled", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    } catch {
      // Reconciliation still ran — the cookie just won't be set this time.
    }
  }

  return (
    <div className="flex min-h-screen bg-surface-900">
      <Sidebar
        plan={plan}
        usageCount={totalUsage}
        viewingAs={viewingAs}
      />
      <main id="main-content" className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

**Step 3: Update dashboard page to pass profile and viewingAs**

Replace the entire `app/(dashboard)/dashboard/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";
import { getUserProfile } from "@/lib/user-profile";
import { currentMonthDate } from "@/lib/utils";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import type { Persona } from "@/lib/types/persona";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const plan = await getUserPlan(user.id);
  const profile = await getUserProfile(user.id);

  const { data: usageRows } = await supabase
    .from("usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", currentMonthDate());

  const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  // Read viewing_as cookie, default to user's persona
  const cookieStore = await cookies();
  const viewingAsCookie = cookieStore.get("viewing_as")?.value as Persona | undefined;
  const validPersonas: Persona[] = ["business_owner", "support_ops", "implementer"];
  const viewingAs: Persona = viewingAsCookie && validPersonas.includes(viewingAsCookie)
    ? viewingAsCookie
    : (profile?.persona ?? "business_owner");

  return (
    <DashboardContent
      plan={plan}
      usageCount={totalUsage}
      viewingAs={viewingAs}
      platforms={profile?.platforms ?? []}
      primaryGoal={profile?.primaryGoal ?? null}
      comfortLevel={profile?.comfortLevel ?? null}
    />
  );
}
```

**Step 4: Commit**

```bash
git add lib/types/persona.ts app/(dashboard)/layout.tsx app/(dashboard)/dashboard/page.tsx
git commit -m "feat: add viewing_as cookie support to dashboard layout and page"
```

---

### Task 6: Add view-switching toggle to sidebar

**Files:**
- Create: `components/dashboard/view-toggle.tsx`
- Modify: `components/dashboard/sidebar.tsx`
- Create: `app/api/view-mode/route.ts`

**Step 1: Create the API route for setting the viewing_as cookie**

Create `app/api/view-mode/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Persona } from "@/lib/types/persona";

const VALID_PERSONAS: Persona[] = ["business_owner", "support_ops", "implementer"];

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { viewingAs } = body as { viewingAs?: string };

  if (!viewingAs || !VALID_PERSONAS.includes(viewingAs as Persona)) {
    return NextResponse.json({ error: "Invalid persona" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set("viewing_as", viewingAs, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Session cookie — cleared when browser closes
  });

  return NextResponse.json({ viewingAs });
}
```

**Step 2: Create the view toggle component**

Create `components/dashboard/view-toggle.tsx`:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Persona } from "@/lib/types/persona";
import { PERSONA_LABELS } from "@/lib/types/persona";

type Props = {
  viewingAs: Persona;
};

const PERSONAS: Persona[] = ["business_owner", "support_ops", "implementer"];
const SHORT_LABELS: Record<Persona, string> = {
  business_owner: "Business",
  support_ops: "Support",
  implementer: "Implementer",
};

export function ViewToggle({ viewingAs }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(viewingAs);
  const [loading, setLoading] = useState(false);

  const handleSwitch = async (persona: Persona) => {
    if (persona === current || loading) return;
    setLoading(true);
    try {
      await fetch("/api/view-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewingAs: persona }),
      });
      setCurrent(persona);
      router.refresh();
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 mb-2">
      <p className="px-3 text-xs text-muted-500 mb-1">View as</p>
      <div className="flex rounded-lg border border-surface-700 bg-surface-950 p-0.5">
        {PERSONAS.map((persona) => (
          <button
            key={persona}
            onClick={() => handleSwitch(persona)}
            disabled={loading}
            title={PERSONA_LABELS[persona]}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              current === persona
                ? "bg-surface-800 text-white"
                : "text-muted-400 hover:text-muted-300"
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {SHORT_LABELS[persona]}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Add view toggle and viewingAs prop to sidebar**

Update `components/dashboard/sidebar.tsx`:

Add the import at the top:
```typescript
import { ViewToggle } from "./view-toggle";
import type { Persona } from "@/lib/types/persona";
```

Update the Props type:
```typescript
type Props = {
  plan: UserPlan;
  usageCount: number;
  viewingAs: Persona;
};
```

Update the function signature:
```typescript
export function Sidebar({ plan, usageCount, viewingAs }: Props) {
```

Add the `<ViewToggle />` component after the usage counter div (after line 78, before the nav):
```typescript
      <ViewToggle viewingAs={viewingAs} />
```

**Step 4: Verify the toggle renders and switching works**

Run dev server, open dashboard, verify toggle appears below usage counter. Click between Business / Support / Implementer — page should refresh (dashboard content won't change yet, but the toggle state should persist).

**Step 5: Commit**

```bash
git add app/api/view-mode/route.ts components/dashboard/view-toggle.tsx components/dashboard/sidebar.tsx
git commit -m "feat: add persona view-switching toggle to sidebar"
```

---

### Task 7: Build three dashboard content views

**Files:**
- Modify: `components/dashboard/dashboard-content.tsx`
- Create: `components/dashboard/views/business-owner-view.tsx`
- Create: `components/dashboard/views/support-ops-view.tsx`
- Create: `components/dashboard/views/implementer-view.tsx`

**Step 1: Create the Business Owner view**

Create `components/dashboard/views/business-owner-view.tsx`:

```typescript
"use client";

import Link from "next/link";
import { HeroInput } from "../hero-input";
import { TOOL_CATALOG, type ToolId } from "@/lib/tool-descriptions";
import type { PrimaryGoal, ComfortLevel } from "@/lib/types/persona";

type Props = {
  recommendedToolIds: ToolId[];
  platforms: string[];
  primaryGoal: PrimaryGoal | null;
  comfortLevel: ComfortLevel | null;
};

const STAGE_PROMPTS = [
  { label: "Something's broken", category: "troubleshoot" as const, href: "/tools/error-explainer" },
  { label: "Connect two services", category: "setup" as const, href: "/tools/code-generator" },
  { label: "Help me choose tools", category: "explore" as const, href: "/tools/package-advisor" },
  { label: "Check my setup", category: "maintain" as const, href: "/tools/health-checker" },
];

export function BusinessOwnerView({ recommendedToolIds, platforms }: Props) {
  const hasRecommendations = recommendedToolIds.length > 0 && platforms.length > 0;

  return (
    <div>
      {/* Hero input */}
      <HeroInput />

      {/* Stage prompt buttons */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAGE_PROMPTS.map((prompt) => (
          <Link
            key={prompt.category}
            href={prompt.href}
            className="rounded-lg border border-surface-700 bg-surface-900 px-4 py-3 text-center text-sm font-medium text-muted-300 hover:border-brand-500/50 hover:bg-surface-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {prompt.label}
          </Link>
        ))}
      </div>

      {/* Recommended tools */}
      <div className="mt-8">
        <h2 className="font-heading text-lg font-bold text-white">
          {hasRecommendations ? "Recommended for you" : "Get started"}
        </h2>
        {!hasRecommendations && (
          <p className="mt-1 text-sm text-muted-500">
            Tell us about your platforms in{" "}
            <Link href="/settings" className="text-brand-400 hover:text-brand-300">
              Settings
            </Link>{" "}
            to get personalised recommendations.
          </p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(hasRecommendations ? recommendedToolIds : (Object.keys(TOOL_CATALOG).slice(0, 4) as ToolId[])).map((toolId) => {
            const tool = TOOL_CATALOG[toolId];
            if (!tool) return null;
            return (
              <Link
                key={toolId}
                href={tool.href}
                className="rounded-lg border border-surface-700 bg-surface-900 p-5 hover:border-brand-500/50 hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <h3 className="font-heading text-sm font-semibold text-white">
                  {tool.label}
                </h3>
                <p className="mt-1 text-xs text-muted-400">
                  {tool.descriptions.business_owner}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create the Support/Ops view**

Create `components/dashboard/views/support-ops-view.tsx`:

```typescript
"use client";

import Link from "next/link";
import { getToolsByCategory, TOOL_CATALOG, type ToolId } from "@/lib/tool-descriptions";

type Props = {
  recommendedToolIds: ToolId[];
};

export function SupportOpsView({ recommendedToolIds }: Props) {
  const categories = getToolsByCategory("support_ops");

  return (
    <div>
      {/* Recommended tools */}
      {recommendedToolIds.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading text-lg font-bold text-white">Recommended for you</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {recommendedToolIds.map((toolId) => {
              const tool = TOOL_CATALOG[toolId];
              if (!tool) return null;
              return (
                <Link
                  key={toolId}
                  href={tool.href}
                  className="min-w-[180px] flex-shrink-0 rounded-lg border border-surface-700 bg-surface-900 p-4 hover:border-brand-500/50 hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <h3 className="text-sm font-semibold text-white">{tool.label}</h3>
                  <p className="mt-1 text-xs text-muted-400">{tool.descriptions.support_ops}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Category groups */}
      <h2 className="font-heading text-lg font-bold text-white">Tools</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {categories.map((category) => (
          <div
            key={category.label}
            className="rounded-lg border border-surface-700 bg-surface-900 p-5"
          >
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-brand-400">
              {category.label}
            </h3>
            <p className="mt-1 text-xs text-muted-500">{category.description}</p>
            <div className="mt-3 space-y-1">
              {category.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="block rounded-lg px-2 py-2 text-sm text-muted-300 hover:bg-surface-800 hover:text-white transition-colors"
                >
                  <span className="font-medium">{tool.label}</span>
                  <span className="ml-2 text-xs text-muted-500">{tool.description}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Create the Implementer view**

Create `components/dashboard/views/implementer-view.tsx`:

```typescript
"use client";

import Link from "next/link";
import { getAllTools } from "@/lib/tool-descriptions";

export function ImplementerView() {
  const tools = getAllTools("implementer");

  return (
    <div>
      <h2 className="font-heading text-lg font-bold text-white">All Tools</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="rounded-lg border border-surface-700 bg-surface-900 p-4 hover:border-brand-500/50 hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-white">{tool.label}</h3>
              <span className="ml-2 rounded bg-surface-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-500">
                {tool.category}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-400">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Rewrite DashboardContent to switch between views**

Replace `components/dashboard/dashboard-content.tsx` entirely:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CancellationBanner } from "@/components/billing/cancellation-banner";
import { PaymentFailedBanner } from "@/components/billing/payment-failed-banner";
import { UsageCard } from "@/components/billing/usage-card";
import { TierBadge } from "@/components/billing/tier-badge";
import { BusinessOwnerView } from "./views/business-owner-view";
import { SupportOpsView } from "./views/support-ops-view";
import { ImplementerView } from "./views/implementer-view";
import { getRecommendedTools } from "@/lib/tool-recommendations";
import type { UserPlan } from "@/lib/subscription";
import type { Persona, PrimaryGoal, ComfortLevel } from "@/lib/types/persona";

type Props = {
  plan: UserPlan;
  usageCount: number;
  viewingAs: Persona;
  platforms: string[];
  primaryGoal: PrimaryGoal | null;
  comfortLevel: ComfortLevel | null;
};

export function DashboardContent({ plan, usageCount, viewingAs, platforms, primaryGoal, comfortLevel }: Props) {
  const router = useRouter();
  const [resubscribing, setResubscribing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const isPaid = plan.plan !== "free";

  // Determine cancellation state
  let cancellationState: "cancelled" | "grace" | null = null;
  if (plan.cancelAtPeriodEnd) {
    cancellationState = "cancelled";
  } else if (plan.gracePeriodEnd && new Date() < new Date(plan.gracePeriodEnd)) {
    cancellationState = "grace";
  }

  const handleResubscribe = async () => {
    setResubscribing(true);
    try {
      const res = await fetch("/api/stripe/resubscribe", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400) {
          router.push("/upgrade");
          return;
        }
        toast.error(data.error ?? "Failed to resubscribe.");
        return;
      }

      toast.success("Welcome back! Your plan has been reactivated.");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setResubscribing(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to open billing portal.");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const recommendedToolIds = getRecommendedTools(platforms, primaryGoal, comfortLevel);

  return (
    <div>
      {/* Banners */}
      {plan.status === "past_due" && (
        <PaymentFailedBanner
          onManageBilling={handleManageBilling}
          loading={portalLoading}
        />
      )}

      {cancellationState && (
        <CancellationBanner
          state={cancellationState}
          periodEndDate={plan.currentPeriodEnd}
          gracePeriodEndDate={plan.gracePeriodEnd}
          onResubscribe={handleResubscribe}
          resubscribing={resubscribing}
        />
      )}

      <h1 className="font-heading text-2xl font-bold text-white">Dashboard</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Subscription card */}
        <div className="rounded-lg border border-surface-700 bg-surface-900 p-5">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-400">
            Plan
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <TierBadge plan={plan.plan} />
            {isPaid && plan.currentPeriodEnd && !plan.cancelAtPeriodEnd && (
              <span className="text-xs text-muted-500">
                Renews {formatDate(plan.currentPeriodEnd)}
              </span>
            )}
          </div>
          {isPaid && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="mt-3 text-xs text-brand-400 hover:text-brand-300 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg"
            >
              {portalLoading ? "Opening..." : "Manage Subscription"}
            </button>
          )}
          {!isPaid && (
            <a
              href="/upgrade"
              className="mt-3 inline-block text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              Upgrade
            </a>
          )}
        </div>

        {/* Usage card */}
        <UsageCard plan={plan.plan} usageCount={usageCount} />
      </div>

      {/* Persona-specific content */}
      <div className="mt-8">
        {viewingAs === "business_owner" && (
          <BusinessOwnerView
            recommendedToolIds={recommendedToolIds}
            platforms={platforms}
            primaryGoal={primaryGoal}
            comfortLevel={comfortLevel}
          />
        )}
        {viewingAs === "support_ops" && (
          <SupportOpsView recommendedToolIds={recommendedToolIds} />
        )}
        {viewingAs === "implementer" && (
          <ImplementerView />
        )}
      </div>
    </div>
  );
}
```

**Step 5: Verify all three views render correctly**

Run dev server. Switch between the three views using the toggle. Verify:
- Business Owner: hero input + prompt buttons + recommended tools
- Support/Ops: recommended tools row + 2x2 category grid
- Implementer: flat dense tool grid

**Step 6: Commit**

```bash
git add components/dashboard/views/ components/dashboard/dashboard-content.tsx
git commit -m "feat: add three persona-based dashboard content views"
```

---

### Task 8: Build the hero input component (client-side keyword matching)

**Files:**
- Create: `components/dashboard/hero-input.tsx`
- Create: `lib/tool-router.ts`

**Step 1: Create the client-side keyword matching module**

Create `lib/tool-router.ts`:

```typescript
import type { ToolId } from "@/lib/tool-descriptions";

type KeywordMatch = {
  tool: ToolId;
  confidence: "high" | "medium";
};

/** Client-side keyword map for common phrases. Returns null if no confident match. */
export function matchKeywords(query: string): KeywordMatch | null {
  const q = query.toLowerCase().trim();

  // High-confidence matches — specific phrases
  const highConfidence: [RegExp, ToolId][] = [
    [/\b(error|exception|stack\s*trace|crash|fail|broke|broken|not\s*working|stopped)\b/, "error-explainer"],
    [/\b(connect|integrate|set\s*up|link|sync|hook\s*up)\b/, "integration-planner"],
    [/\b(choose|compare|which|recommend|package|library|alternative)\b/, "package-advisor"],
    [/\b(generate|scaffold|boilerplate|create\s*code|write\s*code)\b/, "code-generator"],
    [/\b(wrap|wrapper|api\s*client|sdk)\b/, "api-wrapper-generator"],
    [/\b(test|testing|unit\s*test)\b/, "unit-test-generator"],
    [/\b(audit|dependencies|outdated|vulnerable)\b/, "dependency-audit"],
    [/\b(health|check|status|diagnose|config)\b/, "health-checker"],
    [/\b(migrate|upgrade|version|update|breaking\s*change)\b/, "migration-assistant"],
    [/\b(explain|understand|what\s*does|how\s*does)\b/, "code-explainer"],
  ];

  const matches: { tool: ToolId; index: number }[] = [];

  for (const [pattern, tool] of highConfidence) {
    const match = q.match(pattern);
    if (match && match.index !== undefined) {
      matches.push({ tool, index: match.index });
    }
  }

  if (matches.length === 0) return null;

  // If only one match, return it with high confidence
  if (matches.length === 1) {
    return { tool: matches[0].tool, confidence: "high" };
  }

  // Multiple matches — return the earliest one with medium confidence
  matches.sort((a, b) => a.index - b.index);
  return { tool: matches[0].tool, confidence: "medium" };
}
```

**Step 2: Create the hero input component**

Create `components/dashboard/hero-input.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { matchKeywords } from "@/lib/tool-router";
import { TOOL_CATALOG } from "@/lib/tool-descriptions";
import { Spinner } from "@/components/ui/spinner";

export function HeroInput() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setError(null);

    // Layer 1: Client-side keyword matching
    const keywordMatch = matchKeywords(query);
    if (keywordMatch && keywordMatch.confidence === "high") {
      const tool = TOOL_CATALOG[keywordMatch.tool];
      if (tool) {
        router.push(tool.href);
        return;
      }
    }

    // Layer 2: Claude fallback
    setLoading(true);
    try {
      const res = await fetch("/api/tools/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.rateLimited) {
          setError("rate_limited");
          return;
        }
        setError("fallback");
        return;
      }

      const data = await res.json();
      const tool = TOOL_CATALOG[data.tool as keyof typeof TOOL_CATALOG];
      if (tool) {
        router.push(tool.href);
        return;
      }

      // Tool not found in catalog — show fallback
      setError("fallback");
    } catch {
      setError("fallback");
    } finally {
      setLoading(false);
    }
  };

  if (error === "rate_limited") {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-400">Try browsing by category instead.</p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="hero-input" className="sr-only">
          What do you need help with?
        </label>
        <div className="relative">
          <input
            id="hero-input"
            type="text"
            placeholder="What do you need help with?"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            disabled={loading}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-white placeholder-muted-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Spinner size="sm" />
              <span className="text-xs text-muted-400">Finding the right tool...</span>
            </div>
          )}
        </div>
      </form>

      {error === "fallback" && (
        <p className="mt-2 text-sm text-muted-400">
          We weren&apos;t sure what you need — try one of the options below.
        </p>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add lib/tool-router.ts components/dashboard/hero-input.tsx
git commit -m "feat: add hero input with client-side keyword matching for tool routing"
```

---

### Task 9: Build the AI-powered tool router API endpoint

**Files:**
- Create: `app/api/tools/router/route.ts`
- Modify: `lib/constants.ts`

**Step 1: Add router constants**

In `lib/constants.ts`, add at the bottom:

```typescript
// Tool router
export const ROUTER_DAILY_LIMIT = 10;
export const TOOL_NAME_ROUTER = "_router";
export const TOOL_NAME_ROUTER_MISS = "_router_miss";
```

**Step 2: Create the router API endpoint**

Create `app/api/tools/router/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROUTER_DAILY_LIMIT, TOOL_NAME_ROUTER, TOOL_NAME_ROUTER_MISS } from "@/lib/constants";
import { TOOL_CATALOG, type ToolId } from "@/lib/tool-descriptions";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { query } = body as { query?: string };

  if (!query?.trim() || query.length > 500) {
    return NextResponse.json({ error: "Query is required (max 500 chars)" }, { status: 400 });
  }

  // Check daily rate limit
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const { data: routerUsage } = await supabase
    .from("usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("tool_name", TOOL_NAME_ROUTER)
    .eq("month", today);

  const dailyCount = routerUsage?.[0]?.count ?? 0;

  if (dailyCount >= ROUTER_DAILY_LIMIT) {
    return NextResponse.json(
      { error: "Daily routing limit reached", rateLimited: true },
      { status: 429 }
    );
  }

  // Build tool list for Claude
  const toolList = Object.entries(TOOL_CATALOG)
    .map(([id, tool]) => `- ${id}: ${tool.label} — ${tool.descriptions.business_owner}`)
    .join("\n");

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `You are a tool router. Given the user's description, pick the most relevant tool from this list:

${toolList}

User's description: "${query.trim()}"

Return ONLY valid JSON — no markdown, no explanation:
{"tool": "tool-id", "reason": "One sentence explaining why this tool fits."}`,
        },
      ],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: { tool: string; reason: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Failed to parse routing response" }, { status: 500 });
    }

    // Validate tool ID
    const validToolIds = Object.keys(TOOL_CATALOG);
    if (!validToolIds.includes(parsed.tool)) {
      // Log as router miss
      await incrementRouterUsage(supabase, user.id, TOOL_NAME_ROUTER_MISS, today);
      return NextResponse.json({ error: "Could not determine tool" }, { status: 404 });
    }

    // Increment router usage (daily)
    await incrementRouterUsage(supabase, user.id, TOOL_NAME_ROUTER, today);

    // Log the miss (for keyword map expansion) — query hit Claude, not keyword match
    await logRouterQuery(supabase, user.id, query.trim(), parsed.tool);

    return NextResponse.json({
      tool: parsed.tool,
      reason: parsed.reason,
    });
  } catch (err) {
    console.error("Router Claude error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Routing failed" }, { status: 500 });
  }
}

async function incrementRouterUsage(
  supabase: ReturnType<typeof import("@/lib/supabase/server").createClient> extends Promise<infer T> ? T : never,
  userId: string,
  toolName: string,
  date: string
) {
  // Use the usage table with the date as the "month" field for daily tracking
  const { error } = await supabase.rpc("increment_usage", {
    p_user_id: userId,
    p_tool_name: toolName,
    p_month: date,
  });
  if (error) {
    console.error("Failed to increment router usage:", error);
  }
}

async function logRouterQuery(
  supabase: ReturnType<typeof import("@/lib/supabase/server").createClient> extends Promise<infer T> ? T : never,
  userId: string,
  query: string,
  matchedTool: string
) {
  // Log to usage table with a special tool name for analytics
  // We reuse the usage table's month field with today's date
  // The query itself is logged for keyword map expansion
  const { error } = await supabase.rpc("increment_usage", {
    p_user_id: userId,
    p_tool_name: TOOL_NAME_ROUTER_MISS,
    p_month: new Date().toISOString().split("T")[0],
  });
  if (error) {
    console.error("Failed to log router query:", error);
  }
}
```

**Step 3: Commit**

```bash
git add lib/constants.ts app/api/tools/router/route.ts
git commit -m "feat: add AI-powered tool router API endpoint with daily rate limiting"
```

---

### Task 10: Update existing tests for category rename

**Files:**
- Modify: `playwright/tests/fast/dashboard.spec.ts`
- Modify: `playwright/pages/dashboard.page.ts`

**Step 1: Update dashboard page object**

Update `playwright/pages/dashboard.page.ts` to reflect new category names and support persona views:

```typescript
import type { Page } from "@playwright/test";

export class DashboardPage {
  constructor(private page: Page) {}

  private readonly main = this.page.locator("main");
  readonly heading = this.main.locator("h1", { hasText: "Dashboard" });
  readonly upgradeLink = this.main.locator('a[href="/upgrade"]');
  readonly usageCard = this.main.getByText("Usage").locator("..");
  readonly toolLink = this.main.locator('a[href="/tools/code-explainer"]');
  readonly manageBillingButton = this.main.getByText("Manage Subscription");

  // Persona views
  readonly heroInput = this.main.locator("#hero-input");
  readonly recommendedSection = this.main.getByText("Recommended for you");
  readonly allToolsHeading = this.main.getByText("All Tools");

  // Sidebar categories
  readonly sidebar = this.page.locator("aside");
  readonly exploreCategory = this.sidebar.getByText("Explore");
  readonly setUpCategory = this.sidebar.getByText("Set Up");
  readonly troubleshootCategory = this.sidebar.getByText("Troubleshoot");
  readonly maintainCategory = this.sidebar.getByText("Maintain");

  // View toggle
  readonly viewToggle = this.sidebar.getByText("View as").locator("..");
  readonly businessButton = this.sidebar.getByRole("button", { name: "Business" });
  readonly supportButton = this.sidebar.getByRole("button", { name: "Support" });
  readonly implementerButton = this.sidebar.getByRole("button", { name: "Implementer" });

  async goto() {
    await this.page.goto("/dashboard");
  }
}
```

**Step 2: Update dashboard tests**

Update `playwright/tests/fast/dashboard.spec.ts` to verify the new categories appear:

```typescript
import { test, expect } from "../../fixtures";
import { DashboardPage } from "../../pages/dashboard.page";

test.describe("Dashboard", () => {
  test("free user sees upgrade prompt, usage card, and tool links", async ({ freeUserPage }) => {
    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    await expect(dashboard.heading).toBeVisible();
    await expect(dashboard.upgradeLink).toBeVisible();
    await expect(dashboard.usageCard).toBeVisible();
  });

  test("pro user sees manage subscription and tool links", async ({ proUserPage }) => {
    const dashboard = new DashboardPage(proUserPage);
    await dashboard.goto();

    await expect(dashboard.heading).toBeVisible();
    await expect(dashboard.manageBillingButton).toBeVisible();
  });

  test("sidebar shows lifecycle categories", async ({ freeUserPage }) => {
    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    await expect(dashboard.exploreCategory).toBeVisible();
    await expect(dashboard.setUpCategory).toBeVisible();
    await expect(dashboard.troubleshootCategory).toBeVisible();
    await expect(dashboard.maintainCategory).toBeVisible();
  });

  test("view toggle is visible in sidebar", async ({ freeUserPage }) => {
    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    await expect(dashboard.businessButton).toBeVisible();
    await expect(dashboard.supportButton).toBeVisible();
    await expect(dashboard.implementerButton).toBeVisible();
  });
});
```

**Step 3: Run tests to check for regressions**

```bash
npx playwright test --project=fast tests/fast/dashboard.spec.ts
```

Expected: all tests pass. If any other tests reference the old category names (Understand/Decide/Build), those will need updating too.

**Step 4: Search for other tests referencing old category names**

```bash
grep -r "Understand\|\"Decide\"\|\"Build\"" playwright/tests/ --include="*.spec.ts" -l
```

Update any files found. Common candidates: `landing-sections.spec.ts`, `shared-components.spec.ts`.

**Step 5: Commit**

```bash
git add playwright/pages/dashboard.page.ts playwright/tests/fast/dashboard.spec.ts
# Add any other updated test files
git commit -m "test: update dashboard tests for lifecycle categories and view toggle"
```

---

### Task 11: Add sanity tests for persona views

**Files:**
- Create: `playwright/tests/fast/persona-views.spec.ts`
- Create: `playwright/mocks/fixtures/router-success.json`
- Modify: `playwright/fixtures/index.ts`

**Step 1: Create router mock fixture**

Create `playwright/mocks/fixtures/router-success.json`:

```json
{
  "tool": "error-explainer",
  "reason": "This sounds like a problem that needs diagnosing."
}
```

**Step 2: Add router mock to fixtures**

In `playwright/fixtures/index.ts`, add to the `MockApiFactory` type:

```typescript
  router: (page: Page, scenario?: "success" | "error" | "rate_limited") => Promise<void>;
```

Add to the `mockApi` fixture implementation (inside `await use({...})`):

```typescript
      router: async (page: Page, scenario: "success" | "error" | "rate_limited" = "success") => {
        await page.route("**/api/tools/router", (route) => {
          if (scenario === "rate_limited") {
            return route.fulfill({
              status: 429,
              contentType: "application/json",
              body: JSON.stringify({ error: "Daily routing limit reached", rateLimited: true }),
            });
          }
          if (scenario === "error") {
            return route.fulfill({
              status: 500,
              contentType: "application/json",
              body: JSON.stringify({ error: "Routing failed" }),
            });
          }
          const fixturePath = path.resolve(__dirname, "../mocks/fixtures/router-success.json");
          const body = readFileSync(fixturePath, "utf-8");
          return route.fulfill({ status: 200, contentType: "application/json", body });
        });
      },
```

**Step 3: Create persona views test file**

Create `playwright/tests/fast/persona-views.spec.ts`:

```typescript
import { test, expect } from "../../fixtures";
import { DashboardPage } from "../../pages/dashboard.page";

test.describe("Persona Views", () => {
  test("business owner view shows hero input", async ({ freeUserPage }) => {
    // Set viewing_as cookie to business_owner
    await freeUserPage.context().addCookies([{
      name: "viewing_as",
      value: "business_owner",
      domain: "localhost",
      path: "/",
    }]);

    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    await expect(dashboard.heroInput).toBeVisible();
  });

  test("support ops view shows category cards", async ({ freeUserPage }) => {
    await freeUserPage.context().addCookies([{
      name: "viewing_as",
      value: "support_ops",
      domain: "localhost",
      path: "/",
    }]);

    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    // Should show category groups, not hero input
    await expect(dashboard.heroInput).not.toBeVisible();
    await expect(freeUserPage.getByText("Explore").first()).toBeVisible();
  });

  test("implementer view shows dense tool grid", async ({ freeUserPage }) => {
    await freeUserPage.context().addCookies([{
      name: "viewing_as",
      value: "implementer",
      domain: "localhost",
      path: "/",
    }]);

    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    await expect(dashboard.allToolsHeading).toBeVisible();
    await expect(dashboard.heroInput).not.toBeVisible();
  });

  test("view toggle switches dashboard content", async ({ freeUserPage }) => {
    const dashboard = new DashboardPage(freeUserPage);
    await dashboard.goto();

    // Switch to implementer view
    await dashboard.implementerButton.click();

    // Wait for page refresh
    await expect(dashboard.allToolsHeading).toBeVisible({ timeout: 5000 });
  });

  test("router endpoint responds with valid tool (mocked)", async ({ freeUserPage, mockApi }) => {
    await mockApi.router(freeUserPage);

    const response = await freeUserPage.evaluate(async () => {
      const res = await fetch("/api/tools/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "my orders are broken" }),
      });
      return res.json();
    });

    expect(response.tool).toBe("error-explainer");
  });

  test("router returns rate limited response", async ({ freeUserPage, mockApi }) => {
    await mockApi.router(freeUserPage, "rate_limited");

    const response = await freeUserPage.evaluate(async () => {
      const res = await fetch("/api/tools/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "test query" }),
      });
      return { status: res.status, body: await res.json() };
    });

    expect(response.status).toBe(429);
    expect(response.body.rateLimited).toBe(true);
  });
});
```

**Step 4: Run the new tests**

```bash
npx playwright test --project=fast tests/fast/persona-views.spec.ts
```

Expected: all 6 tests pass.

**Step 5: Commit**

```bash
git add playwright/mocks/fixtures/router-success.json playwright/fixtures/index.ts playwright/tests/fast/persona-views.spec.ts
git commit -m "test: add sanity tests for persona views, view toggle, and tool router"
```

---

### Task 12: Run full test suite and fix regressions

**Files:** Various (depends on failures)

**Step 1: Run the full fast test suite**

```bash
npx playwright test --project=fast
```

**Step 2: Fix any failures**

Common issues:
- Tests referencing old category names (Understand/Decide/Build) in assertions
- Dashboard tests expecting the old workflow stage layout
- Landing page tests referencing tool categories (check `landing-sections.spec.ts`)
- Shared component tests

Search for old category names across all test files:
```bash
grep -r "Understand\|\"Decide\"\|\"Build\"" playwright/ --include="*.ts" -l
```

Also search the landing page component and any other files that reference the old names:
```bash
grep -r "Understand\|\"Decide\"\|\"Build\"" components/ app/ --include="*.tsx" --include="*.ts" -l
```

Update all references.

**Step 3: Run full suite again**

```bash
npx playwright test --project=fast
```

Expected: all tests pass.

**Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix: update remaining references to old category names and fix test regressions"
```

---

### Task 13: Run full test suite including slow tests

**Step 1: Run both fast and slow tests**

```bash
npx playwright test
```

Expected: all tests pass. The slow tests (nuget-advisor-canary, stripe-checkout) should be unaffected by these changes.

**Step 2: Fix any issues found**

If slow tests fail, investigate — they're likely unrelated to this phase's changes.

---

### Task 14: Push branch and open PR

**Step 1: Push the feature branch**

```bash
git push -u origin feature/phase-9b-persona-ui
```

**Step 2: Wait for CI to run**

Check CI status:
```bash
gh run list --branch feature/phase-9b-persona-ui --limit 1
```

**Step 3: Open PR**

```bash
gh pr create --title "feat: Phase 9b — Persona-Driven UI" --body "$(cat <<'EOF'
## Summary
- Rename navigation categories from Understand/Decide/Build/Maintain to lifecycle-based Explore/Set Up/Troubleshoot/Maintain
- Add view-switching toggle (Business/Support/Implementer) to sidebar with ephemeral cookie-based viewing mode
- Three distinct dashboard content views: Business Owner (hero input + recommendations), Support/Ops (category cards + recommendations), Implementer (dense tool grid)
- AI-powered tool router with 3-layer strategy: client-side keyword matching → Claude Haiku fallback → daily rate limit (10/day)
- Persona-variant tool descriptions (3 per tool, one per persona)
- Profile-based tool recommendations using platform, goal, and comfort level
- Sanity tests for views, toggle, and router

## Test plan
- [ ] View toggle renders in sidebar and persists across page loads
- [ ] Business Owner view shows hero input + suggested prompts + recommended tools
- [ ] Support/Ops view shows recommended row + 2x2 category grid
- [ ] Implementer view shows flat dense tool grid
- [ ] Hero input routes correctly via keyword matching (no API call)
- [ ] Hero input falls back to Claude Haiku for ambiguous queries
- [ ] Router rate limit (10/day) enforced — shows fallback message
- [ ] Empty state (no platforms) shows category grid + settings prompt
- [ ] Sidebar shows Explore / Set Up / Troubleshoot / Maintain
- [ ] All existing tests pass with updated category names
- [ ] Mobile: views degrade gracefully on small screens

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Step 4: Note the PR URL for the review session**
