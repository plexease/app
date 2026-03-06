# NuGet Advisor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the NuGet Advisor tool — a form where users enter a .NET package name and receive a structured 4-card advisory from Claude (what it does, alternatives, compatibility, version advice), with a 20/month free usage limit enforced server-side.

**Architecture:** API route (`POST /api/tools/nuget-advisor`) handles auth, usage check, Claude call, and usage increment. A server component page fetches current usage and passes it to a client-side form. Result cards render structured JSON returned by Claude.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase (server client + RPC), Anthropic SDK (`@anthropic-ai/sdk`)

---

## Before You Start

Confirm `.env.local` has `ANTHROPIC_API_KEY` set. If not, add it — get the value from the Anthropic console. The key is already listed in `.env.local.example`.

---

### Task 1: Install Anthropic SDK

**Files:**
- Modify: `package.json` (via npm install)

**Step 1: Install the SDK**

```bash
cd /home/deck/Projects/plexease
npm install @anthropic-ai/sdk
```

Expected: installs successfully, `@anthropic-ai/sdk` appears in `package.json` dependencies.

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install @anthropic-ai/sdk"
```

---

### Task 2: Apply Schema Migration in Supabase

**Files:**
- Modify: `lib/supabase/schema.sql` (documentation update)

The `usage` table currently has a `date` column. We need to rename it to `month` and add a unique constraint, plus create an RPC function for atomic upserts.

**Step 1: Run migration in Supabase SQL editor**

Go to your Supabase project dashboard → SQL Editor → New query. Run this:

```sql
-- Rename date column to month
ALTER TABLE public.usage RENAME COLUMN date TO month;

-- Add unique constraint for atomic upserts
ALTER TABLE public.usage
  ADD CONSTRAINT usage_user_tool_month_unique
  UNIQUE (user_id, tool_name, month);

-- RPC function for atomic usage increment
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid,
  p_tool_name text,
  p_month date
) RETURNS void AS $$
BEGIN
  INSERT INTO public.usage (user_id, tool_name, month, count)
  VALUES (p_user_id, p_tool_name, p_month, 1)
  ON CONFLICT (user_id, tool_name, month)
  DO UPDATE SET count = usage.count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Expected: query runs without errors.

**Step 2: Update schema.sql to match**

Open `lib/supabase/schema.sql`. Replace the usage table block and add the new function:

Replace:
```sql
-- Usage table
create table public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  tool_name text not null,
  date date default current_date not null,
  count integer default 0 not null
);

alter table public.usage enable row level security;

create policy "Users can read own usage"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.usage for update
  using (auth.uid() = user_id);
```

With:
```sql
-- Usage table
create table public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  tool_name text not null,
  month date not null,
  count integer default 0 not null,
  constraint usage_user_tool_month_unique unique (user_id, tool_name, month)
);

alter table public.usage enable row level security;

create policy "Users can read own usage"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.usage for update
  using (auth.uid() = user_id);

-- Atomic usage increment (security definer bypasses RLS safely — auth checked in API route)
create or replace function increment_usage(
  p_user_id uuid,
  p_tool_name text,
  p_month date
) returns void as $$
begin
  insert into public.usage (user_id, tool_name, month, count)
  values (p_user_id, p_tool_name, p_month, 1)
  on conflict (user_id, tool_name, month)
  do update set count = usage.count + 1;
end;
$$ language plpgsql security definer;
```

**Step 3: Commit**

```bash
git add lib/supabase/schema.sql
git commit -m "feat: update usage schema — rename date to month, add unique constraint and increment_usage RPC"
```

---

### Task 3: Create Claude Client (`lib/claude.ts`)

**Files:**
- Create: `lib/claude.ts`

**Step 1: Create the file**

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type NuGetAdvisorResult = {
  whatItDoes: string;
  alternatives: string[];
  compatibility: string;
  versionAdvice: string;
};

export async function getNuGetAdvice(packageName: string): Promise<NuGetAdvisorResult> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a .NET package advisor. The user has asked about the NuGet package: "${packageName}".
Return ONLY valid JSON in this exact shape — no markdown, no explanation, no code fences:
{
  "whatItDoes": "Plain English description of what this package does.",
  "alternatives": ["Package1", "Package2", "Package3"],
  "compatibility": "Which .NET versions are supported, any known issues.",
  "versionAdvice": "Latest stable version, whether to upgrade, any deprecation notes."
}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    return JSON.parse(text) as NuGetAdvisorResult;
  } catch {
    throw new Error("Failed to parse Claude response");
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd /home/deck/Projects/plexease
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add lib/claude.ts
git commit -m "feat: add Claude client with getNuGetAdvice helper"
```

---

### Task 4: Create API Route (`app/api/tools/nuget-advisor/route.ts`)

**Files:**
- Create: `app/api/tools/nuget-advisor/route.ts`

This route: authenticates the user, checks their monthly usage, calls Claude, increments usage, returns the result.

**Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNuGetAdvice } from "@/lib/claude";

const FREE_MONTHLY_LIMIT = 20;
const TOOL_NAME = "nuget-advisor";

function currentMonthDate(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const packageName = body?.packageName?.trim();

  if (!packageName) {
    return NextResponse.json({ error: "Package name is required" }, { status: 400 });
  }

  // Check plan
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const isPro = subscription?.plan === "pro";

  // Enforce monthly limit for free users
  if (!isPro) {
    const month = currentMonthDate();

    const { data: usage } = await supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("tool_name", TOOL_NAME)
      .eq("month", month)
      .maybeSingle();

    if (usage && usage.count >= FREE_MONTHLY_LIMIT) {
      return NextResponse.json(
        { error: "Monthly limit reached", limitReached: true },
        { status: 429 }
      );
    }
  }

  // Call Claude
  let result;
  try {
    result = await getNuGetAdvice(packageName);
  } catch {
    return NextResponse.json(
      { error: "Failed to get advice. Please try again." },
      { status: 500 }
    );
  }

  // Increment usage
  await supabase.rpc("increment_usage", {
    p_user_id: user.id,
    p_tool_name: TOOL_NAME,
    p_month: currentMonthDate(),
  });

  return NextResponse.json(result);
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add app/api/tools/nuget-advisor/route.ts
git commit -m "feat: add NuGet Advisor API route with usage enforcement"
```

---

### Task 5: Create Result Cards Component

**Files:**
- Create: `components/tools/nuget-advisor/result-cards.tsx`

**Step 1: Create the file**

Match the existing dark theme: `bg-gray-800`, `border-gray-700`, `text-white`, `text-gray-300`.

```typescript
import type { NuGetAdvisorResult } from "@/lib/claude";

export function ResultCards({ result }: { result: NuGetAdvisorResult }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          What it does
        </h3>
        <p className="mt-2 text-sm text-gray-300">{result.whatItDoes}</p>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Alternatives
        </h3>
        <ul className="mt-2 space-y-1">
          {result.alternatives.map((alt) => (
            <li key={alt} className="text-sm text-gray-300">
              • {alt}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Compatibility
        </h3>
        <p className="mt-2 text-sm text-gray-300">{result.compatibility}</p>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Version advice
        </h3>
        <p className="mt-2 text-sm text-gray-300">{result.versionAdvice}</p>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add components/tools/nuget-advisor/result-cards.tsx
git commit -m "feat: add NuGet Advisor result cards component"
```

---

### Task 6: Create Advisor Form Component

**Files:**
- Create: `components/tools/nuget-advisor/advisor-form.tsx`

This is a client component. It receives `usageCount` and `isPro` as props from the server page, handles form submission, and shows the result cards on success.

**Step 1: Create the file**

```typescript
"use client";

import { useState } from "react";
import { ResultCards } from "./result-cards";
import type { NuGetAdvisorResult } from "@/lib/claude";

const FREE_MONTHLY_LIMIT = 20;

type Props = {
  usageCount: number;
  isPro: boolean;
};

export function AdvisorForm({ usageCount, isPro }: Props) {
  const [packageName, setPackageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NuGetAdvisorResult | null>(null);
  const [currentUsage, setCurrentUsage] = useState(usageCount);

  const limitReached = !isPro && currentUsage >= FREE_MONTHLY_LIMIT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/tools/nuget-advisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageName }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.limitReached) {
        setCurrentUsage(FREE_MONTHLY_LIMIT);
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
      }
      setLoading(false);
      return;
    }

    setResult(data);
    setCurrentUsage((prev) => prev + 1);
    setLoading(false);
  };

  if (limitReached) {
    return (
      <div className="rounded-lg border border-yellow-700 bg-yellow-950/30 p-6 text-center">
        <p className="text-sm font-medium text-yellow-300">
          You&apos;ve used all 20 free lookups this month.
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Upgrade to Pro for unlimited access.
        </p>
        <a
          href="/upgrade"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Upgrade to Pro
        </a>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          placeholder="e.g. Newtonsoft.Json"
          required
          disabled={loading}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !packageName.trim()}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Analysing..." : "Analyse"}
        </button>
      </form>

      {!isPro && (
        <p className="mt-2 text-xs text-gray-500">
          {currentUsage} of {FREE_MONTHLY_LIMIT} free lookups used this month
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}

      {result && <ResultCards result={result} />}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add components/tools/nuget-advisor/advisor-form.tsx
git commit -m "feat: add NuGet Advisor form with usage counter and upgrade prompt"
```

---

### Task 7: Create Tool Page

**Files:**
- Create: `app/(dashboard)/tools/nuget-advisor/page.tsx`

This server component fetches the user's plan and current month usage, then passes them to `AdvisorForm`.

**Step 1: Create the file**

```typescript
import { createClient } from "@/lib/supabase/server";
import { AdvisorForm } from "@/components/tools/nuget-advisor/advisor-form";

function currentMonthDate(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export default async function NuGetAdvisorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subscription }, { data: usage }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("usage")
      .select("count")
      .eq("user_id", user!.id)
      .eq("tool_name", "nuget-advisor")
      .eq("month", currentMonthDate())
      .maybeSingle(),
  ]);

  const isPro = subscription?.plan === "pro";
  const usageCount = usage?.count ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">NuGet Advisor</h1>
      <p className="mt-2 text-gray-400">
        Enter a NuGet package name to get an AI-powered advisory on what it does,
        alternatives, compatibility, and version advice.
      </p>

      <div className="mt-8">
        <AdvisorForm usageCount={usageCount} isPro={isPro} />
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add app/(dashboard)/tools/nuget-advisor/page.tsx
git commit -m "feat: add NuGet Advisor page"
```

---

### Task 8: Update Sidebar and Dashboard

**Files:**
- Modify: `components/dashboard/sidebar.tsx`
- Modify: `app/(dashboard)/dashboard/page.tsx`

**Step 1: Add NuGet Advisor link to sidebar**

In `components/dashboard/sidebar.tsx`, add after the Dashboard link:

```typescript
        <Link
          href="/tools/nuget-advisor"
          className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          NuGet Advisor
        </Link>
```

**Step 2: Add tool card to dashboard**

In `app/(dashboard)/dashboard/page.tsx`, replace the "Tools will appear here" placeholder:

```typescript
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a
          href="/tools/nuget-advisor"
          className="rounded-lg border border-gray-700 bg-gray-800 p-6 hover:border-gray-600 transition-colors"
        >
          <h3 className="font-semibold text-white">NuGet Advisor</h3>
          <p className="mt-1 text-sm text-gray-400">
            Get AI-powered advice on any NuGet package — what it does, alternatives, compatibility, and version guidance.
          </p>
        </a>
      </div>
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add components/dashboard/sidebar.tsx app/(dashboard)/dashboard/page.tsx
git commit -m "feat: add NuGet Advisor to sidebar and dashboard"
```

---

### Task 9: Manual End-to-End Verification

**Step 1: Start the dev server**

```bash
npm run dev
```

Expected: server starts on http://localhost:3000, no build errors.

**Step 2: Test the happy path**

1. Log in at http://localhost:3000/login
2. Navigate to http://localhost:3000/tools/nuget-advisor
3. Enter `Newtonsoft.Json` and click Analyse
4. Verify: loading state shows, then 4 cards appear with real content
5. Verify: usage counter increments (e.g. "1 of 20 free lookups used this month")

**Step 3: Test error handling**

1. Enter a nonsense package name (e.g. `zzz-fake-package-xyz`) and submit
2. Verify: Claude still returns structured cards (it will describe it as unknown/not found) — this is expected behaviour for v1

**Step 4: Test sidebar and dashboard**

1. Verify NuGet Advisor appears in the sidebar
2. Verify the tool card appears on the dashboard and clicking it navigates correctly

**Step 5: Commit final state**

```bash
git add -A
git commit -m "feat: complete Phase 2 NuGet Advisor tool"
```
