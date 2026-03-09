# Phase 9a — Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add database tables for personas/sessions/feedback, build onboarding flow, update pricing backend from 2 tiers to 4 (Free/Essentials/Pro/Enterprise placeholder).

**Architecture:** New `user_profiles` table stores persona and onboarding answers. Middleware redirects non-onboarded users to `/onboarding`. Constants and subscription logic updated for 3 usage tiers (10/100/1,000). Stripe gets new Essentials price IDs. Enterprise is a static placeholder with no backend logic.

**Tech Stack:** Next.js 16, Supabase (PostgreSQL + Auth), Stripe, Tailwind CSS v4, TypeScript, Zod

**Design doc:** `docs/plans/2026-03-09-phase9-design.md` — reference for all design decisions.

---

## Task 1: Database migration — user_profiles table

**Files:**
- Create: `lib/supabase/migrations/user_profiles.sql`
- Modify: `lib/supabase/schema.sql` (append new table)

**Step 1: Write the migration SQL**

Create `lib/supabase/migrations/user_profiles.sql`:

```sql
-- User profile and persona settings
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  persona text not null default 'business_owner'
    check (persona in ('business_owner', 'support_ops', 'implementer')),
  comfort_level text
    check (comfort_level in ('guided', 'docs_configs', 'writes_code')),
  platforms text[] default '{}',
  primary_goal text
    check (primary_goal in ('setup', 'fixing', 'evaluating', 'exploring')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS policies
alter table public.user_profiles enable row level security;

create policy "Users can read their own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Auto-update updated_at
create or replace function public.update_user_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row
  execute function public.update_user_profiles_updated_at();
```

**Step 2: Append to schema.sql for documentation**

Add the `user_profiles` table definition to the bottom of `lib/supabase/schema.sql` as a reference (after existing tables).

**Step 3: Run the migration against both Supabase projects**

Run in Supabase SQL Editor for both `plexease` (prod) and `plexease-test` (test) projects:
- Copy the migration SQL
- Execute in Supabase dashboard → SQL Editor

**Step 4: Commit**

```bash
git add lib/supabase/migrations/user_profiles.sql lib/supabase/schema.sql
git commit -m "feat: add user_profiles table with RLS and persona fields"
```

---

## Task 2: Database migration — sessions table

**Files:**
- Create: `lib/supabase/migrations/sessions.sql`
- Modify: `lib/supabase/schema.sql` (append)

**Step 1: Write the migration SQL**

Create `lib/supabase/migrations/sessions.sql`:

```sql
-- Session management for concurrent session enforcement
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_info text,
  ip_hash text,
  last_active timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Index for efficient session lookup by user
create index idx_sessions_user_id on public.sessions(user_id);

-- RLS policies
alter table public.sessions enable row level security;

create policy "Users can read their own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);

-- Insert/update handled by service role (server-side only)
```

**Step 2: Append to schema.sql**

**Step 3: Run migration against both Supabase projects**

**Step 4: Commit**

```bash
git add lib/supabase/migrations/sessions.sql lib/supabase/schema.sql
git commit -m "feat: add sessions table for concurrent session enforcement"
```

---

## Task 3: Database migration — feedback tables

**Files:**
- Create: `lib/supabase/migrations/feedback.sql`
- Modify: `lib/supabase/schema.sql` (append)

**Step 1: Write the migration SQL**

Create `lib/supabase/migrations/feedback.sql`:

```sql
-- Feedback collection (CRM-ready)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  trigger_type text not null
    check (trigger_type in ('fifth_use', 'cancellation', 'manual')),
  tool_name text,
  persona text,
  tier text,
  status text not null default 'new'
    check (status in ('new', 'acknowledged', 'resolved')),
  resolution text,
  created_at timestamptz not null default now()
);

-- Index for admin queries
create index idx_feedback_status on public.feedback(status);
create index idx_feedback_user_id on public.feedback(user_id);

-- Feedback dismissal tracking
create table if not exists public.feedback_dismissals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_type text not null
    check (trigger_type in ('fifth_use', 'cancellation')),
  dismissed_at timestamptz not null default now(),
  unique(user_id, trigger_type)
);

-- RLS policies
alter table public.feedback enable row level security;
alter table public.feedback_dismissals enable row level security;

create policy "Users can insert their own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

create policy "Users can insert their own dismissals"
  on public.feedback_dismissals for insert
  with check (auth.uid() = user_id);

create policy "Users can read their own dismissals"
  on public.feedback_dismissals for select
  using (auth.uid() = user_id);
```

**Step 2: Append to schema.sql**

**Step 3: Run migration against both Supabase projects**

**Step 4: Commit**

```bash
git add lib/supabase/migrations/feedback.sql lib/supabase/schema.sql
git commit -m "feat: add feedback and feedback_dismissals tables"
```

---

## Task 4: Update constants and types for new pricing tiers

**Files:**
- Modify: `lib/constants.ts`
- Create: `lib/types/persona.ts`
- Modify: `lib/subscription.ts` (UserPlan type)

**Step 1: Update constants**

In `lib/constants.ts`, make these changes:

Replace usage limits:
```typescript
// Old
export const FREE_MONTHLY_LIMIT = 20;
export const USAGE_WARNING_THRESHOLD = 15;
export const USAGE_DANGER_THRESHOLD = 19;

// New
export const FREE_MONTHLY_LIMIT = 10;
export const ESSENTIALS_MONTHLY_LIMIT = 100;
export const PRO_MONTHLY_LIMIT = 1000;

// Warning thresholds (75% and 95% of each tier)
export const FREE_USAGE_WARNING = 7;
export const FREE_USAGE_DANGER = 9;
export const ESSENTIALS_USAGE_WARNING = 75;
export const ESSENTIALS_USAGE_DANGER = 95;
export const PRO_USAGE_WARNING = 750;
export const PRO_USAGE_DANGER = 950;
```

Add new Stripe price IDs:
```typescript
// Existing (rename for clarity)
export const STRIPE_PRICE_PRO_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!;
export const STRIPE_PRICE_PRO_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!;

// New
export const STRIPE_PRICE_ESSENTIALS_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS_MONTHLY!;
export const STRIPE_PRICE_ESSENTIALS_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS_ANNUAL!;
```

Add new tool name constants for new integration tools:
```typescript
export const TOOL_NAME_INTEGRATION_HUB = "integration-hub";
export const TOOL_NAME_TROUBLESHOOTER = "troubleshooter";
export const TOOL_NAME_CHANGE_IMPACT = "change-impact-advisor";
export const TOOL_NAME_STACK_PLANNER = "stack-planner";
```

**Step 2: Create persona types**

Create `lib/types/persona.ts`:

```typescript
export type Persona = "business_owner" | "support_ops" | "implementer";

export type ComfortLevel = "guided" | "docs_configs" | "writes_code";

export type PrimaryGoal = "setup" | "fixing" | "evaluating" | "exploring";

export interface UserProfile {
  id: string;
  persona: Persona;
  comfortLevel: ComfortLevel | null;
  platforms: string[];
  primaryGoal: PrimaryGoal | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PERSONA_LABELS: Record<Persona, string> = {
  business_owner: "Business Owner",
  support_ops: "Support & Operations",
  implementer: "Implementer",
};

export const PLATFORM_OPTIONS = [
  { id: "shopify", label: "Shopify" },
  { id: "woocommerce", label: "WooCommerce" },
  { id: "xero", label: "Xero" },
  { id: "stripe", label: "Stripe" },
  { id: "royal-mail", label: "Royal Mail" },
  { id: "quickbooks", label: "QuickBooks" },
  { id: "magento", label: "Magento" },
] as const;
```

**Step 3: Update UserPlan type**

In `lib/subscription.ts`, update the plan type:

```typescript
// Old
export type UserPlan = {
  plan: "free" | "pro";
  // ...
};

// New
export type UserPlan = {
  plan: "free" | "essentials" | "pro";
  status: "active" | "cancelled" | "past_due";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  gracePeriodEnd: string | null;
  stripeSubscriptionId: string | null;
};
```

**Step 4: Commit**

```bash
git add lib/constants.ts lib/types/persona.ts lib/subscription.ts
git commit -m "feat: add persona types, update pricing constants for 3-tier model"
```

---

## Task 5: Update subscription logic for Essentials tier

**Files:**
- Modify: `lib/subscription.ts`
- Modify: `lib/api-helpers.ts`

**Step 1: Update getUserPlan to detect Essentials**

In `lib/subscription.ts`, update `getUserPlan` to check which Stripe price the user is subscribed to and return `"essentials"` or `"pro"` accordingly.

The key change: instead of just checking if a subscription exists (which means pro), check the `stripe_price_id` stored on the subscription record against the Essentials and Pro price IDs.

```typescript
import {
  STRIPE_PRICE_ESSENTIALS_MONTHLY,
  STRIPE_PRICE_ESSENTIALS_ANNUAL,
  STRIPE_PRICE_PRO_MONTHLY,
  STRIPE_PRICE_PRO_ANNUAL,
} from "./constants";

const ESSENTIALS_PRICES = [STRIPE_PRICE_ESSENTIALS_MONTHLY, STRIPE_PRICE_ESSENTIALS_ANNUAL];
const PRO_PRICES = [STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL];

// In getUserPlan, when determining plan from subscription row:
function determinePlan(stripePriceId: string | null): "free" | "essentials" | "pro" {
  if (!stripePriceId) return "free";
  if (PRO_PRICES.includes(stripePriceId)) return "pro";
  if (ESSENTIALS_PRICES.includes(stripePriceId)) return "essentials";
  return "free";
}
```

Note: The `subscriptions` table needs a `stripe_price_id` column. Check if it exists; if not, add it to the migration. Currently the subscription row stores `plan` as `"pro"` — we need to also store the price ID so we can distinguish Essentials from Pro.

**Step 2: Add isEssentialsUser helper**

```typescript
export async function isEssentialsUser(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan.plan === "essentials" && plan.status === "active";
}
```

**Step 3: Update api-helpers.ts for tier-based limits**

In `lib/api-helpers.ts`, update `authenticateAndCheckUsage`:

```typescript
import {
  FREE_MONTHLY_LIMIT,
  ESSENTIALS_MONTHLY_LIMIT,
  PRO_MONTHLY_LIMIT,
} from "./constants";

export interface AuthenticatedContext {
  userId: string;
  plan: "free" | "essentials" | "pro";
}

export async function authenticateAndCheckUsage(toolName: string) {
  // ... auth check (unchanged)

  const userPlan = await getUserPlan(user.id);
  const plan = userPlan.plan;

  // Determine limit based on plan
  let limit: number;
  switch (plan) {
    case "pro":
      limit = PRO_MONTHLY_LIMIT;
      break;
    case "essentials":
      limit = ESSENTIALS_MONTHLY_LIMIT;
      break;
    default:
      limit = FREE_MONTHLY_LIMIT;
  }

  // Check usage against limit
  const { data: usageRows } = await supabase
    .from("usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", currentMonthDate());

  const totalUsage = (usageRows ?? []).reduce((sum, row) => sum + row.count, 0);

  if (totalUsage >= limit) {
    return {
      error: NextResponse.json(
        { error: "Monthly usage limit reached.", limitReached: true },
        { status: 429 }
      ),
    };
  }

  return { context: { userId: user.id, plan } };
}
```

**Step 4: Update all tool form components that reference `isPro`**

The `AuthenticatedContext` changes from `isPro: boolean` to `plan: "free" | "essentials" | "pro"`. All tool API routes pass `auth.context.isPro` — these need updating to pass `auth.context.plan` instead.

In each tool form component (10 total in `components/tools/*/`), update the props:

```typescript
// Old
type Props = { usageCount: number; isPro: boolean; };

// New
type Props = { usageCount: number; plan: "free" | "essentials" | "pro"; };
```

And update the limit check:

```typescript
// Old
const limitReached = !isPro && currentUsage >= FREE_MONTHLY_LIMIT;

// New
import { FREE_MONTHLY_LIMIT, ESSENTIALS_MONTHLY_LIMIT, PRO_MONTHLY_LIMIT } from "@/lib/constants";

function getLimit(plan: "free" | "essentials" | "pro"): number {
  switch (plan) {
    case "pro": return PRO_MONTHLY_LIMIT;
    case "essentials": return ESSENTIALS_MONTHLY_LIMIT;
    default: return FREE_MONTHLY_LIMIT;
  }
}

const limit = getLimit(plan);
const limitReached = currentUsage >= limit;
```

**Important:** This is a cross-cutting change. Every tool page, tool form, and the dashboard layout pass `isPro` — all need updating to `plan`. The tool server pages (`app/(dashboard)/tools/*/page.tsx`) fetch `isProUser()` — update these to fetch `getUserPlan()` and pass `plan.plan` instead.

Also update the dashboard layout (`app/(dashboard)/layout.tsx`) which passes plan data to the sidebar.

**Step 5: Commit**

```bash
git add lib/subscription.ts lib/api-helpers.ts lib/constants.ts
git add components/tools/ app/(dashboard)/
git commit -m "feat: update subscription and usage logic for 3-tier pricing model"
```

---

## Task 6: Database migration — add stripe_price_id to subscriptions

**Files:**
- Create: `lib/supabase/migrations/subscriptions_price_id.sql`
- Modify: `lib/supabase/schema.sql`

**Step 1: Write migration**

Create `lib/supabase/migrations/subscriptions_price_id.sql`:

```sql
-- Add stripe_price_id to subscriptions for tier detection
alter table public.subscriptions
  add column if not exists stripe_price_id text;

-- Update plan column to support new tier
-- Old values: 'pro'
-- New values: 'essentials', 'pro'
alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('essentials', 'pro'));
```

**Step 2: Run migration against both projects**

**Step 3: Update webhook handler to store price ID**

In `app/api/stripe/webhook/route.ts`, when handling `checkout.session.completed`, extract the price ID from the subscription and store it:

```typescript
// After creating/updating subscription record, also store the price_id
const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
const priceId = subscription.items.data[0]?.price.id;

// Include in the upsert:
// stripe_price_id: priceId,
// plan: PRO_PRICES.includes(priceId) ? "pro" : "essentials",
```

**Step 4: Commit**

```bash
git add lib/supabase/migrations/subscriptions_price_id.sql lib/supabase/schema.sql
git add app/api/stripe/webhook/route.ts
git commit -m "feat: add stripe_price_id to subscriptions, update webhook handler"
```

---

## Task 7: Create Stripe Essentials price IDs

**Files:**
- Modify: `.env.local`
- Modify: `.env.local.example`

**Step 1: Create Essentials product/prices in Stripe dashboard**

In Stripe dashboard (test mode):
1. Create new price for existing Plexease product: £5/month (Essentials Monthly)
2. Create new price: £50/year (Essentials Annual)
3. Copy both price IDs

**Step 2: Add to .env.local**

```
NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS_ANNUAL=price_xxx
```

**Step 3: Update .env.local.example**

Add the new variables with placeholder comments.

**Step 4: Update test:setup script if it generates env vars**

Check `scripts/test-setup.ts` or equivalent — ensure new env vars are included.

**Step 5: Commit**

```bash
git add .env.local.example
git commit -m "feat: add Essentials tier Stripe price ID env vars"
```

---

## Task 8: Update Stripe checkout to support Essentials tier

**Files:**
- Modify: `app/api/stripe/checkout/route.ts`

**Step 1: Update checkout route to accept tier parameter**

The current checkout route accepts `interval` (monthly/annual). Update it to also accept `tier` (essentials/pro):

```typescript
// Parse request body
const { interval, tier } = body as { interval?: string; tier?: string };

// Validate tier
const validTier = tier === "essentials" || tier === "pro" ? tier : "pro";

// Validate interval
const validInterval = interval === "annual" ? "annual" : "monthly";

// Select correct price ID
let priceId: string;
if (validTier === "essentials") {
  priceId = validInterval === "annual"
    ? STRIPE_PRICE_ESSENTIALS_ANNUAL
    : STRIPE_PRICE_ESSENTIALS_MONTHLY;
} else {
  priceId = validInterval === "annual"
    ? STRIPE_PRICE_PRO_ANNUAL
    : STRIPE_PRICE_PRO_MONTHLY;
}
```

Also update the check for "already subscribed" — a user on Essentials should be able to upgrade to Pro. Only block if they're already on the requested tier or higher.

**Step 2: Commit**

```bash
git add app/api/stripe/checkout/route.ts
git commit -m "feat: update checkout route to support Essentials and Pro tiers"
```

---

## Task 9: Create user profile helper functions

**Files:**
- Create: `lib/user-profile.ts`

**Step 1: Write profile helper module**

Create `lib/user-profile.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import type { UserProfile, Persona, ComfortLevel, PrimaryGoal } from "@/lib/types/persona";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    persona: data.persona as Persona,
    comfortLevel: data.comfort_level as ComfortLevel | null,
    platforms: data.platforms ?? [],
    primaryGoal: data.primary_goal as PrimaryGoal | null,
    onboardingCompleted: data.onboarding_completed,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function createUserProfile(
  userId: string,
  profile: {
    persona: Persona;
    comfortLevel?: ComfortLevel;
    platforms?: string[];
    primaryGoal?: PrimaryGoal;
  }
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("user_profiles").insert({
    id: userId,
    persona: profile.persona,
    comfort_level: profile.comfortLevel ?? null,
    platforms: profile.platforms ?? [],
    primary_goal: profile.primaryGoal ?? null,
    onboarding_completed: true,
  });

  if (error) {
    console.error("Failed to create user profile:", error.message);
    throw new Error("Failed to save profile");
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    persona: Persona;
    comfortLevel: ComfortLevel;
    platforms: string[];
    primaryGoal: PrimaryGoal;
  }>
): Promise<void> {
  const supabase = await createClient();
  const dbUpdates: Record<string, unknown> = {};

  if (updates.persona !== undefined) dbUpdates.persona = updates.persona;
  if (updates.comfortLevel !== undefined) dbUpdates.comfort_level = updates.comfortLevel;
  if (updates.platforms !== undefined) dbUpdates.platforms = updates.platforms;
  if (updates.primaryGoal !== undefined) dbUpdates.primary_goal = updates.primaryGoal;

  const { error } = await supabase
    .from("user_profiles")
    .update(dbUpdates)
    .eq("id", userId);

  if (error) {
    console.error("Failed to update user profile:", error.message);
    throw new Error("Failed to update profile");
  }
}

export async function isOnboarded(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return profile?.onboardingCompleted ?? false;
}
```

**Step 2: Commit**

```bash
git add lib/user-profile.ts
git commit -m "feat: add user profile helper functions for persona management"
```

---

## Task 10: Add onboarding redirect to middleware

**Files:**
- Modify: `lib/supabase/middleware.ts`

**Step 1: Update middleware to check onboarding status**

After the existing auth check, add onboarding check for authenticated users:

```typescript
// After line ~53 (existing auth redirect logic)

// Skip onboarding check for these paths
const onboardingExemptPaths = ["/onboarding", "/api/", "/upgrade/success"];
const isOnboardingExempt = onboardingExemptPaths.some((p) => request.nextUrl.pathname.startsWith(p));

if (!isOnboardingExempt && user) {
  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  // No profile or not completed → redirect to onboarding
  if (!profile || !profile.onboarding_completed) {
    const onboardingUrl = request.nextUrl.clone();
    onboardingUrl.pathname = "/onboarding";
    return NextResponse.redirect(onboardingUrl);
  }
}
```

**Important:** This query runs on every protected page load. Consider caching the onboarding status in a cookie after first check to avoid repeated DB queries. Set a `plexease_onboarded=true` cookie after the onboarding page saves the profile — then the middleware can check the cookie first and skip the DB query.

**Step 2: Commit**

```bash
git add lib/supabase/middleware.ts
git commit -m "feat: add onboarding redirect to middleware for non-onboarded users"
```

---

## Task 11: Build onboarding API route

**Files:**
- Create: `app/api/onboarding/route.ts`

**Step 1: Create the API route**

Create `app/api/onboarding/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUserProfile } from "@/lib/user-profile";
import type { Persona, ComfortLevel, PrimaryGoal } from "@/lib/types/persona";

const VALID_PERSONAS: Persona[] = ["business_owner", "support_ops", "implementer"];
const VALID_COMFORT: ComfortLevel[] = ["guided", "docs_configs", "writes_code"];
const VALID_GOALS: PrimaryGoal[] = ["setup", "fixing", "evaluating", "exploring"];

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { persona, comfortLevel, platforms, primaryGoal } = body as {
    persona?: string;
    comfortLevel?: string;
    platforms?: string[];
    primaryGoal?: string;
  };

  // Validate persona (required)
  if (!persona || !VALID_PERSONAS.includes(persona as Persona)) {
    return NextResponse.json({ error: "Invalid persona" }, { status: 400 });
  }

  // Validate optional fields
  if (comfortLevel && !VALID_COMFORT.includes(comfortLevel as ComfortLevel)) {
    return NextResponse.json({ error: "Invalid comfort level" }, { status: 400 });
  }
  if (primaryGoal && !VALID_GOALS.includes(primaryGoal as PrimaryGoal)) {
    return NextResponse.json({ error: "Invalid primary goal" }, { status: 400 });
  }
  if (platforms && !Array.isArray(platforms)) {
    return NextResponse.json({ error: "Platforms must be an array" }, { status: 400 });
  }

  // Create profile
  try {
    await createUserProfile(user.id, {
      persona: persona as Persona,
      comfortLevel: comfortLevel as ComfortLevel | undefined,
      platforms: platforms as string[] | undefined,
      primaryGoal: primaryGoal as PrimaryGoal | undefined,
    });
  } catch {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 2: Commit**

```bash
git add app/api/onboarding/route.ts
git commit -m "feat: add onboarding API route for profile creation"
```

---

## Task 12: Build onboarding page — layout and step 1

**Files:**
- Create: `app/(onboarding)/onboarding/page.tsx`
- Create: `app/(onboarding)/layout.tsx`
- Create: `components/onboarding/onboarding-flow.tsx`

**Step 1: Create onboarding layout**

Create `app/(onboarding)/layout.tsx` — a minimal layout without the dashboard sidebar:

```typescript
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOnboarded } from "@/lib/user-profile";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Already onboarded — go to dashboard
  const onboarded = await isOnboarded(user.id);
  if (onboarded) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}
```

**Step 2: Create onboarding page (server component)**

Create `app/(onboarding)/onboarding/page.tsx`:

```typescript
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata = {
  title: "Welcome to Plexease",
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
```

**Step 3: Create onboarding flow component**

Create `components/onboarding/onboarding-flow.tsx` — a multi-step client component:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Persona, ComfortLevel, PrimaryGoal } from "@/lib/types/persona";
import { PERSONA_LABELS, PLATFORM_OPTIONS } from "@/lib/types/persona";

type Step = 1 | 2 | 3 | 4;

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [comfortLevel, setComfortLevel] = useState<ComfortLevel | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [otherPlatform, setOtherPlatform] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveProfile(skipFields?: boolean) {
    setSaving(true);
    setError(null);

    const allPlatforms = otherPlatform.trim()
      ? [...platforms, otherPlatform.trim()]
      : platforms;

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona,
          comfortLevel: skipFields ? undefined : comfortLevel,
          platforms: skipFields ? undefined : allPlatforms,
          primaryGoal: skipFields ? undefined : primaryGoal,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        setSaving(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  // Step 1: Role selection
  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white font-heading">
            Welcome to Plexease
          </h1>
          <p className="text-muted-400">
            We&apos;ll ask a few questions to tailor your experience.
            You can change these anytime in settings.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-300">
            What best describes your role?
          </p>
          {(Object.entries(PERSONA_LABELS) as [Persona, string][]).map(
            ([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setPersona(value);
                  setStep(2);
                }}
                className="w-full p-4 rounded-lg border border-surface-700 bg-surface-900
                  text-white text-left hover:border-brand-400 hover:bg-surface-800
                  transition-colors"
              >
                {label}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => {
            if (!persona) setPersona("business_owner");
            saveProfile(true);
          }}
          disabled={saving}
          className="w-full text-sm text-muted-500 hover:text-muted-300 transition-colors"
        >
          I know what I&apos;m doing — skip setup
        </button>
      </div>
    );
  }

  // Step 2: Comfort level
  if (step === 2) {
    const options: { value: ComfortLevel; label: string }[] = [
      { value: "guided", label: "Guide me step by step" },
      { value: "docs_configs", label: "I can follow docs and configs" },
      { value: "writes_code", label: "I write code" },
    ];

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white font-heading">
            Technical comfort
          </h1>
          <p className="text-muted-400">
            How comfortable are you with technical concepts?
          </p>
        </div>

        <div className="space-y-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setComfortLevel(opt.value);
                if (opt.value === "writes_code") {
                  // Skip remaining questions
                  saveProfile(false);
                } else {
                  setStep(3);
                }
              }}
              disabled={saving}
              className="w-full p-4 rounded-lg border border-surface-700 bg-surface-900
                text-white text-left hover:border-brand-400 hover:bg-surface-800
                transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep(1)}
          className="w-full text-sm text-muted-500 hover:text-muted-300"
        >
          Back
        </button>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    );
  }

  // Step 3: Platforms
  if (step === 3) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white font-heading">
            Your platforms
          </h1>
          <p className="text-muted-400">
            What platforms do you use? Select all that apply.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PLATFORM_OPTIONS.map((plat) => {
            const selected = platforms.includes(plat.id);
            return (
              <button
                key={plat.id}
                onClick={() =>
                  setPlatforms((prev) =>
                    selected
                      ? prev.filter((p) => p !== plat.id)
                      : [...prev, plat.id]
                  )
                }
                className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                  selected
                    ? "border-brand-400 bg-brand-400/10 text-white"
                    : "border-surface-700 bg-surface-900 text-muted-300 hover:border-surface-600"
                }`}
              >
                {plat.label}
              </button>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="Other (type platform name)"
          value={otherPlatform}
          onChange={(e) => setOtherPlatform(e.target.value)}
          className="w-full p-3 rounded-lg border border-surface-700 bg-surface-900
            text-white placeholder-muted-500 text-sm"
        />

        <div className="flex gap-3">
          <button
            onClick={() => setStep(2)}
            className="flex-1 p-3 rounded-lg border border-surface-700 text-muted-300
              hover:text-white transition-colors text-sm"
          >
            Back
          </button>
          <button
            onClick={() => setStep(4)}
            className="flex-1 p-3 rounded-lg bg-brand-500 text-white font-medium
              hover:bg-brand-400 transition-colors text-sm"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Primary goal
  if (step === 4) {
    const goals: { value: PrimaryGoal; label: string }[] = [
      { value: "setup", label: "Setting up integrations" },
      { value: "fixing", label: "Fixing a problem" },
      { value: "evaluating", label: "Evaluating options" },
      { value: "exploring", label: "Just exploring" },
    ];

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white font-heading">
            What brings you here?
          </h1>
          <p className="text-muted-400">
            This helps us show you the most relevant tools first.
          </p>
        </div>

        <div className="space-y-3">
          {goals.map((goal) => (
            <button
              key={goal.value}
              onClick={() => {
                setPrimaryGoal(goal.value);
                saveProfile(false);
              }}
              disabled={saving}
              className="w-full p-4 rounded-lg border border-surface-700 bg-surface-900
                text-white text-left hover:border-brand-400 hover:bg-surface-800
                transition-colors"
            >
              {goal.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep(3)}
          className="w-full text-sm text-muted-500 hover:text-muted-300"
        >
          Back
        </button>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>
    );
  }

  return null;
}
```

**Step 4: Commit**

```bash
git add app/(onboarding)/ components/onboarding/
git commit -m "feat: build onboarding questionnaire flow with 4-step persona selection"
```

---

## Task 13: Create account settings page for persona management

**Files:**
- Create: `app/(dashboard)/settings/page.tsx`
- Create: `components/settings/profile-settings.tsx`
- Create: `app/api/profile/route.ts`
- Modify: `components/dashboard/sidebar.tsx` (add Settings link)

**Step 1: Create profile update API route**

Create `app/api/profile/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateUserProfile } from "@/lib/user-profile";
import type { Persona, ComfortLevel, PrimaryGoal } from "@/lib/types/persona";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { persona, comfortLevel, platforms, primaryGoal } = body as Record<string, unknown>;

  try {
    await updateUserProfile(user.id, {
      persona: persona as Persona | undefined,
      comfortLevel: comfortLevel as ComfortLevel | undefined,
      platforms: platforms as string[] | undefined,
      primaryGoal: primaryGoal as PrimaryGoal | undefined,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

**Step 2: Create settings page**

Create `app/(dashboard)/settings/page.tsx` as a server component that fetches the current profile and passes it to a client component for editing. Include persona, comfort level, platforms, and primary goal — all editable with save button.

**Step 3: Create profile settings client component**

Create `components/settings/profile-settings.tsx` with form fields matching onboarding questions, pre-populated with current values. Uses PATCH to `/api/profile` on save.

**Step 4: Add Settings link to sidebar**

In `components/dashboard/sidebar.tsx`, add a "Settings" link in the bottom section (near "Manage cookies" and "Sign out"):

```typescript
{ href: "/settings", label: "Settings" }
```

**Step 5: Add /settings to protected routes in middleware**

Ensure the middleware treats `/settings` as a protected route (it's under `(dashboard)` so it should be covered, but verify).

**Step 6: Commit**

```bash
git add app/(dashboard)/settings/ components/settings/ app/api/profile/
git add components/dashboard/sidebar.tsx
git commit -m "feat: add account settings page for persona and profile management"
```

---

## Task 14: Add onboarding bypass for existing test users

**Files:**
- Modify: `playwright/global-setup.ts`
- Modify: `playwright/fixtures.ts` (if exists)

**Step 1: Seed test user profiles during global setup**

In the Playwright global setup, after creating test users, also create `user_profiles` rows for them so they bypass the onboarding redirect:

```typescript
// After test user creation, seed profiles
await supabaseAdmin.from("user_profiles").upsert([
  {
    id: freeUserId,
    persona: "implementer",
    comfort_level: "writes_code",
    onboarding_completed: true,
  },
  {
    id: proUserId,
    persona: "implementer",
    comfort_level: "writes_code",
    onboarding_completed: true,
  },
]);
```

**Step 2: Add profile cleanup to global teardown**

In the teardown, don't delete profiles (they're tied to the test users), but ensure `onboarding_completed` is reset to `true` for consistency.

**Step 3: Commit**

```bash
git add playwright/
git commit -m "test: seed user_profiles for test users to bypass onboarding"
```

---

## Task 15: Verify all existing tests still pass

**Step 1: Run the full test suite**

```bash
cd /home/deck/Projects/plexease && npm test
```

Expected: All 113 tests pass. The key risk areas:
- Dashboard tests (changed from `isPro` to `plan`)
- Tool tests (same prop change)
- Usage limit tests (new limit of 10 instead of 20)
- Billing tests (TierBadge, UsageCounter may need updates)

**Step 2: Fix any failures**

Most likely failures:
- UsageCounter showing "X/10" instead of "X/20" — update test expectations
- TierBadge — may need to handle "essentials" plan label
- Tool form tests checking `isPro` prop — update to `plan`

**Step 3: Commit fixes**

```bash
git add -A
git commit -m "test: fix existing tests for 3-tier pricing model"
```

---

## Summary

| Task | What | Files touched |
|------|------|---------------|
| 1 | user_profiles table migration | migrations/, schema.sql |
| 2 | sessions table migration | migrations/, schema.sql |
| 3 | feedback tables migration | migrations/, schema.sql |
| 4 | Constants, types, UserPlan update | constants.ts, types/persona.ts, subscription.ts |
| 5 | Subscription + usage logic for 3 tiers | subscription.ts, api-helpers.ts, all tool components |
| 6 | stripe_price_id column + webhook update | migrations/, webhook route |
| 7 | Stripe Essentials price IDs | .env.local, .env.local.example |
| 8 | Checkout route for 2 paid tiers | checkout route |
| 9 | User profile helper functions | user-profile.ts |
| 10 | Onboarding middleware redirect | middleware.ts |
| 11 | Onboarding API route | api/onboarding/ |
| 12 | Onboarding page + flow component | (onboarding)/, components/onboarding/ |
| 13 | Account settings page | (dashboard)/settings/, api/profile/ |
| 14 | Test user profile seeding | playwright/ |
| 15 | Verify all tests pass | various |

**Estimated commits:** 15
**Dependencies:** Tasks 1-3 (DB) must be first. Tasks 4-8 (pricing) can parallel with 9-12 (onboarding). Task 14-15 must be last.
