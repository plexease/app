# Phase 3 — Stripe Monetisation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Stripe billing to Plexease — checkout, webhooks, subscription management, and dashboard UX for Free/Pro tiers.

**Architecture:** Stripe-First. Stripe owns billing state, Supabase mirrors it via webhooks. Hosted Checkout for payments, Customer Portal for billing management. Never update Supabase optimistically — only on webhook confirmation.

**Tech Stack:** Stripe SDK, Next.js 16 API routes, Supabase PostgreSQL, Tailwind CSS v4, Zod validation, sonner toasts.

**Design doc:** `docs/plans/2026-03-06-phase3-stripe-design.md`

---

## Task 1: Install Stripe SDK and Create Client

**Files:**
- Modify: `package.json:11-19`
- Create: `lib/stripe.ts`

**Step 1: Install the Stripe package**

Run: `cd /home/deck/Projects/plexease && npm install stripe`
Expected: stripe added to dependencies in package.json

**Step 2: Create the Stripe client with env validation and mode safeguard**

Create `lib/stripe.ts`:

```typescript
import Stripe from "stripe";

const requiredEnvVars = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const key = process.env.STRIPE_SECRET_KEY!;
const isDev = process.env.NODE_ENV !== "production";

if (isDev && !key.startsWith("sk_test_")) {
  throw new Error("STRIPE_SECRET_KEY must be a test key in development");
}
if (!isDev && !key.startsWith("sk_live_")) {
  throw new Error("STRIPE_SECRET_KEY must be a live key in production");
}

export const stripe = new Stripe(key, {
  apiVersion: "2025-04-30.basil",
  typescript: true,
});
```

> **Note:** Check the latest Stripe API version at build time and use whatever is current. The version above is a placeholder — use the version the SDK defaults to.

**Step 3: Commit**

```bash
git add package.json package-lock.json lib/stripe.ts
git commit -m "feat: add Stripe SDK with env validation and mode safeguard"
```

---

## Task 2: Add Constants

**Files:**
- Modify: `lib/constants.ts:1-2`

**Step 1: Add Stripe and billing constants**

Replace contents of `lib/constants.ts`:

```typescript
// Usage limits
export const FREE_MONTHLY_LIMIT = 20;
export const USAGE_WARNING_THRESHOLD = 15;  // 75% — amber state
export const USAGE_DANGER_THRESHOLD = 19;   // 95% — red state

// Tool names
export const TOOL_NAME_NUGET_ADVISOR = "nuget-advisor";

// Billing
export const GRACE_PERIOD_DAYS = 1;
export const CHECKOUT_POLL_INTERVAL_MS = 2000;
export const CHECKOUT_POLL_TIMEOUT_MS = 30000;

// Stripe Price IDs (set in Stripe Dashboard, stored in env)
export const STRIPE_PRICE_ID_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!;
export const STRIPE_PRICE_ID_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!;
```

**Step 2: Commit**

```bash
git add lib/constants.ts
git commit -m "feat: add billing and usage threshold constants"
```

---

## Task 3: Database Migrations

**Files:**
- Modify: `lib/supabase/schema.sql:19-27`

**Step 1: Run migrations in Supabase SQL Editor**

Run the following SQL in the Supabase Dashboard SQL Editor (or via CLI):

```sql
-- Add billing columns to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ;

-- Prevent double active subscriptions at database level
CREATE UNIQUE INDEX IF NOT EXISTS one_active_sub_per_user
  ON public.subscriptions (user_id)
  WHERE status = 'active';

-- Webhook event deduplication
CREATE TABLE IF NOT EXISTS public.processed_events (
  stripe_event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS: service role only (webhooks use service role client)
ALTER TABLE public.processed_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (no user-facing RLS needed)
-- The webhook handler uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS
```

**Step 2: Update schema.sql to reflect the new state**

Update `lib/supabase/schema.sql` — add the new columns to the subscriptions table definition (lines 20-27) and add the processed_events table and index after the usage table section:

Update the subscriptions table block to:

```sql
-- Subscriptions table
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  plan text default 'free' not null check (plan in ('free', 'pro')),
  status text default 'active' not null check (status in ('active', 'cancelled', 'past_due')),
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false not null,
  grace_period_end timestamptz,
  created_at timestamptz default now() not null
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Prevent double active subscriptions
create unique index one_active_sub_per_user
  on public.subscriptions (user_id)
  where status = 'active';
```

Add after the usage section:

```sql
-- Webhook event deduplication
create table public.processed_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz default now() not null
);

alter table public.processed_events enable row level security;
```

**Step 3: Verify by checking the Supabase table editor**

Confirm:
- `subscriptions` table has 3 new columns
- `one_active_sub_per_user` index exists
- `processed_events` table exists

**Step 4: Commit**

```bash
git add lib/supabase/schema.sql
git commit -m "feat: add billing columns, unique index, and processed_events table"
```

---

## Task 4: Create Subscription Module

**Files:**
- Create: `lib/subscription.ts`

This is the shared billing logic module. All plan/billing queries go through here.

**Step 1: Create `lib/subscription.ts`**

```typescript
import { stripe } from "@/lib/stripe";
import { GRACE_PERIOD_DAYS } from "@/lib/constants";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// Service role client for server-side operations that bypass RLS
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type UserPlan = {
  plan: "free" | "pro";
  status: "active" | "cancelled" | "past_due";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  gracePeriodEnd: string | null;
  stripeSubscriptionId: string | null;
};

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const supabase = getServiceClient();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, cancel_at_period_end, grace_period_end, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!subscription) {
    return {
      plan: "free",
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      gracePeriodEnd: null,
      stripeSubscriptionId: null,
    };
  }

  return {
    plan: subscription.plan as "free" | "pro",
    status: subscription.status as "active" | "cancelled" | "past_due",
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    gracePeriodEnd: subscription.grace_period_end,
    stripeSubscriptionId: subscription.stripe_subscription_id,
  };
}

export async function isProUser(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);

  if (plan.plan !== "pro") return false;
  if (plan.status === "active") return true;

  // Check grace period
  if (plan.gracePeriodEnd) {
    return new Date() < new Date(plan.gracePeriodEnd);
  }

  return false;
}

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const supabase = getServiceClient();

  // Step 1: Check if user already has a Stripe customer ID
  const { data: user } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (user?.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  // Step 2: Create Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  // Step 3: Save to Supabase BEFORE returning
  const { error } = await supabase
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to save Stripe customer ID: ${error.message}`);
  }

  return customer.id;
}

export async function reconcileSubscription(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  const supabase = getServiceClient();

  // Query Stripe for active subscriptions
  const stripeSubscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "active",
    limit: 1,
  });

  const { data: dbSubscription } = await supabase
    .from("subscriptions")
    .select("plan, status, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!dbSubscription) return;

  const hasActiveStripeSub = stripeSubscriptions.data.length > 0;
  const dbSaysPro = dbSubscription.plan === "pro" && dbSubscription.status === "active";

  if (hasActiveStripeSub && !dbSaysPro) {
    // Stripe says active, DB says not — fix DB
    const sub = stripeSubscriptions.data[0];
    await supabase
      .from("subscriptions")
      .update({
        plan: "pro",
        status: "active",
        stripe_subscription_id: sub.id,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      })
      .eq("user_id", userId);
  } else if (!hasActiveStripeSub && dbSaysPro) {
    // Stripe says no active sub, DB says pro — check for grace period
    // Only downgrade if no grace period or grace has expired
    const plan = await getUserPlan(userId);
    if (!plan.gracePeriodEnd || new Date() >= new Date(plan.gracePeriodEnd)) {
      await supabase
        .from("subscriptions")
        .update({
          plan: "free",
          status: "active",
          stripe_subscription_id: null,
          current_period_end: null,
          cancel_at_period_end: false,
          grace_period_end: null,
        })
        .eq("user_id", userId);
    }
  }
}

export function calculateGracePeriodEnd(periodEnd: Date): Date {
  const grace = new Date(periodEnd);
  grace.setDate(grace.getDate() + GRACE_PERIOD_DAYS);
  return grace;
}
```

**Step 2: Commit**

```bash
git add lib/subscription.ts
git commit -m "feat: add shared subscription module with plan checks and reconciliation"
```

---

## Task 5: Refactor NuGet Advisor to Use Shared Subscription Module

**Files:**
- Modify: `app/api/tools/nuget-advisor/route.ts:34-40`

**Step 1: Update the NuGet Advisor API route to use `isProUser()`**

Replace the inline plan check (lines 34-40) with:

```typescript
import { isProUser } from "@/lib/subscription";
```

Replace the plan check block:

```typescript
  // Check plan
  const isPro = await isProUser(user.id);
```

Remove the old subscription query (lines 34-40):
```typescript
  // DELETE: const { data: subscription } = await supabase
  //   .from("subscriptions")
  //   .select("plan")
  //   .eq("user_id", user.id)
  //   .maybeSingle();
  // const isPro = subscription?.plan === "pro";
```

The full updated route should be:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNuGetAdvice } from "@/lib/claude";
import { FREE_MONTHLY_LIMIT, TOOL_NAME_NUGET_ADVISOR } from "@/lib/constants";
import { currentMonthDate } from "@/lib/utils";
import { isProUser } from "@/lib/subscription";

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
  const packageName = (body as { packageName?: string })?.packageName?.trim();

  if (!packageName) {
    return NextResponse.json({ error: "Package name is required" }, { status: 400 });
  }

  if (packageName.length > 200) {
    return NextResponse.json({ error: "Package name is too long" }, { status: 400 });
  }

  // Check plan using shared module
  const isPro = await isProUser(user.id);

  // Enforce monthly limit for free users
  if (!isPro) {
    const month = currentMonthDate();

    const { data: usage } = await supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("tool_name", TOOL_NAME_NUGET_ADVISOR)
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
  } catch (err) {
    console.error("Claude API error:", err);
    return NextResponse.json(
      { error: "Failed to get advice. Please try again." },
      { status: 500 }
    );
  }

  // Increment usage
  const { error: rpcError } = await supabase.rpc("increment_usage", {
    p_user_id: user.id,
    p_tool_name: TOOL_NAME_NUGET_ADVISOR,
    p_month: currentMonthDate(),
  });
  if (rpcError) {
    console.error("Failed to increment usage:", rpcError);
  }

  return NextResponse.json(result);
}
```

**Step 2: Verify the dev server still compiles**

Run: `cd /home/deck/Projects/plexease && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/api/tools/nuget-advisor/route.ts
git commit -m "refactor: use shared isProUser() in NuGet Advisor route"
```

---

## Task 6: Checkout API Route

**Files:**
- Create: `app/api/stripe/checkout/route.ts`

**Step 1: Create the checkout endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer, getUserPlan } from "@/lib/subscription";
import { STRIPE_PRICE_ID_MONTHLY, STRIPE_PRICE_ID_ANNUAL } from "@/lib/constants";

export async function POST(request: NextRequest) {
  // CSRF check
  const origin = request.headers.get("origin");
  const expectedOrigin = request.nextUrl.origin;
  if (origin && origin !== expectedOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if already Pro
  const plan = await getUserPlan(user.id);
  if (plan.plan === "pro" && plan.status === "active") {
    return NextResponse.json({ error: "Already subscribed", alreadyPro: true }, { status: 400 });
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const interval = (body as { interval?: string })?.interval;
  if (interval !== "monthly" && interval !== "annual") {
    return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
  }

  const priceId = interval === "monthly" ? STRIPE_PRICE_ID_MONTHLY : STRIPE_PRICE_ID_ANNUAL;

  // Get or create Stripe customer (saved to DB before proceeding)
  let customerId: string;
  try {
    customerId = await getOrCreateStripeCustomer(user.id, user.email!);
  } catch (err) {
    console.error("Failed to create Stripe customer:", err);
    return NextResponse.json(
      { error: "Payment service temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }

  // Create Checkout session
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      success_url: `${expectedOrigin}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${expectedOrigin}/upgrade?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Failed to create checkout session:", err);
    return NextResponse.json(
      { error: "Payment service temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/stripe/checkout/route.ts
git commit -m "feat: add Stripe checkout API route with auth, CSRF, and plan checks"
```

---

## Task 7: Webhook API Route

**Files:**
- Create: `app/api/stripe/webhook/route.ts`

This is the most critical file in Phase 3. Handle with care.

**Step 1: Create the webhook endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { calculateGracePeriodEnd } from "@/lib/subscription";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Service role client for webhook operations (bypasses RLS)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Body size limit: 64KB
const MAX_BODY_SIZE = 64 * 1024;

export async function POST(request: NextRequest) {
  // Check body size
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Check for duplicate event
  const { data: existingEvent } = await supabase
    .from("processed_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existingEvent) {
    console.log(`Webhook event already processed: ${event.id} (${event.type})`);
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event, supabase);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event, supabase);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event, supabase);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event, supabase);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    // Record processed event
    await supabase.from("processed_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
    });

    console.log(`Webhook processed: ${event.id} (${event.type})`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    // Return 500 so Stripe retries
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}

async function handleCheckoutCompleted(
  event: Stripe.Event,
  supabase: ReturnType<typeof getServiceClient>
) {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.supabase_user_id;

  if (!userId) {
    throw new Error("Missing supabase_user_id in checkout session metadata");
  }

  const subscriptionId = session.subscription as string;

  // Verify with Stripe that the subscription is genuinely active
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  if (subscription.status !== "active") {
    console.log(`Subscription ${subscriptionId} is ${subscription.status}, skipping`);
    return;
  }

  // Upsert subscription in Supabase
  await supabase
    .from("subscriptions")
    .update({
      plan: "pro",
      status: "active",
      stripe_subscription_id: subscriptionId,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: false,
      grace_period_end: null,
    })
    .eq("user_id", userId);
}

async function handleSubscriptionUpdated(
  event: Stripe.Event,
  supabase: ReturnType<typeof getServiceClient>
) {
  const subscription = event.data.object as Stripe.Subscription;
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    throw new Error("Missing supabase_user_id in subscription metadata");
  }

  // Verify with Stripe
  const verified = await stripe.subscriptions.retrieve(subscription.id);

  const status = verified.status === "active" ? "active" :
    verified.status === "past_due" ? "past_due" : "cancelled";

  await supabase
    .from("subscriptions")
    .update({
      status,
      current_period_end: new Date(verified.current_period_end * 1000).toISOString(),
      cancel_at_period_end: verified.cancel_at_period_end,
    })
    .eq("user_id", userId);
}

async function handleSubscriptionDeleted(
  event: Stripe.Event,
  supabase: ReturnType<typeof getServiceClient>
) {
  const subscription = event.data.object as Stripe.Subscription;
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    throw new Error("Missing supabase_user_id in subscription metadata");
  }

  const periodEnd = new Date(subscription.current_period_end * 1000);
  const gracePeriodEnd = calculateGracePeriodEnd(periodEnd);

  await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancel_at_period_end: false,
      grace_period_end: gracePeriodEnd.toISOString(),
    })
    .eq("user_id", userId);
}

async function handlePaymentFailed(
  event: Stripe.Event,
  supabase: ReturnType<typeof getServiceClient>
) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  // Get user from subscription metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    throw new Error("Missing supabase_user_id in subscription metadata");
  }

  await supabase
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("user_id", userId);
}
```

**Step 2: Commit**

```bash
git add app/api/stripe/webhook/route.ts
git commit -m "feat: add Stripe webhook handler with signature verification and deduplication"
```

---

## Task 8: Customer Portal API Route

**Files:**
- Create: `app/api/stripe/portal/route.ts`

**Step 1: Create the portal endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  // CSRF check
  const origin = request.headers.get("origin");
  const expectedOrigin = request.nextUrl.origin;
  if (origin && origin !== expectedOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up stripe_customer_id server-side (never from client)
  const { data: userData } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!userData?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${expectedOrigin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Failed to create portal session:", err);
    return NextResponse.json(
      { error: "Failed to open billing portal. Please try again." },
      { status: 503 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/stripe/portal/route.ts
git commit -m "feat: add Stripe Customer Portal API route with auth"
```

---

## Task 9: Resubscribe API Route

**Files:**
- Create: `app/api/stripe/resubscribe/route.ts`

**Step 1: Create the resubscribe endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getUserPlan } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  // CSRF check
  const origin = request.headers.get("origin");
  const expectedOrigin = request.nextUrl.origin;
  if (origin && origin !== expectedOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(user.id);

  // Can only un-cancel if subscription is still active but scheduled to cancel
  if (!plan.stripeSubscriptionId || !plan.cancelAtPeriodEnd) {
    return NextResponse.json(
      { error: "No cancellation to reverse. Use /upgrade to subscribe." },
      { status: 400 }
    );
  }

  try {
    await stripe.subscriptions.update(plan.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to resubscribe:", err);
    return NextResponse.json(
      { error: "Failed to resubscribe. Please try again." },
      { status: 503 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/stripe/resubscribe/route.ts
git commit -m "feat: add resubscribe API route to un-cancel active subscriptions"
```

---

## Task 10: Tier Badge Component

**Files:**
- Create: `components/billing/tier-badge.tsx`

**Step 1: Create the tier badge**

```tsx
type Props = {
  plan: "free" | "pro";
};

export function TierBadge({ plan }: Props) {
  if (plan === "pro") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">
        Pro
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-300">
      Free
    </span>
  );
}
```

**Step 2: Commit**

```bash
git add components/billing/tier-badge.tsx
git commit -m "feat: add tier badge component for Free/Pro display"
```

---

## Task 11: Usage Counter Component (Sidebar)

**Files:**
- Create: `components/billing/usage-counter.tsx`

**Step 1: Create the compact sidebar usage counter**

```tsx
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";

type Props = {
  isPro: boolean;
  usageCount: number;
};

export function UsageCounter({ isPro, usageCount }: Props) {
  if (isPro) {
    return <p className="text-xs text-gray-500">Unlimited</p>;
  }

  return (
    <p className="text-xs text-gray-500">
      {usageCount}/{FREE_MONTHLY_LIMIT} uses
    </p>
  );
}
```

**Step 2: Commit**

```bash
git add components/billing/usage-counter.tsx
git commit -m "feat: add sidebar usage counter component"
```

---

## Task 12: Usage Card Component (Dashboard)

**Files:**
- Create: `components/billing/usage-card.tsx`

**Step 1: Create the dashboard usage card with progress bar**

```tsx
import Link from "next/link";
import { FREE_MONTHLY_LIMIT, USAGE_WARNING_THRESHOLD, USAGE_DANGER_THRESHOLD } from "@/lib/constants";

type Props = {
  isPro: boolean;
  usageCount: number;
};

export function UsageCard({ isPro, usageCount }: Props) {
  if (isPro) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Usage
        </h3>
        <p className="mt-2 text-lg font-semibold text-white">Unlimited</p>
        <p className="mt-1 text-xs text-gray-500">Pro plan — no limits</p>
      </div>
    );
  }

  const percentage = Math.min((usageCount / FREE_MONTHLY_LIMIT) * 100, 100);
  const barColor =
    usageCount >= USAGE_DANGER_THRESHOLD
      ? "bg-red-500"
      : usageCount >= USAGE_WARNING_THRESHOLD
        ? "bg-amber-500"
        : "bg-green-500";

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Usage
      </h3>
      <p className="mt-2 text-lg font-semibold text-white">
        {usageCount} / {FREE_MONTHLY_LIMIT}
      </p>
      <div className="mt-3 h-2 w-full rounded-full bg-gray-700">
        <div
          className={`h-2 rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Free lookups used this month
      </p>
      {usageCount >= USAGE_WARNING_THRESHOLD && (
        <Link
          href="/upgrade"
          className="mt-3 inline-block text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          Upgrade to Pro for unlimited access
        </Link>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/billing/usage-card.tsx
git commit -m "feat: add dashboard usage card with colour-coded progress bar"
```

---

## Task 13: Cancellation Banner Component

**Files:**
- Create: `components/billing/cancellation-banner.tsx`

**Step 1: Create the 3-state cancellation banner**

```tsx
"use client";

import { useState } from "react";

type Props = {
  state: "cancelled" | "grace" | null;
  periodEndDate: string | null;
  gracePeriodEndDate: string | null;
  onResubscribe: () => void;
  resubscribing: boolean;
};

export function CancellationBanner({
  state,
  periodEndDate,
  gracePeriodEndDate,
  onResubscribe,
  resubscribing,
}: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!state || dismissed) return null;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (state === "grace") {
    return (
      <div className="mb-6 flex items-center justify-between rounded-lg border border-red-700 bg-red-950/30 px-4 py-3">
        <p className="text-sm text-red-300">
          Your Pro access expires tomorrow. Resubscribe to keep unlimited access.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onResubscribe}
            disabled={resubscribing}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {resubscribing ? "Resubscribing..." : "Resubscribe"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      </div>
    );
  }

  // cancelled state (still in paid period)
  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-700 bg-amber-950/30 px-4 py-3">
      <p className="text-sm text-amber-300">
        Your Pro plan is cancelled. Access continues until{" "}
        {periodEndDate ? formatDate(periodEndDate) : "the end of your billing period"}.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={onResubscribe}
          disabled={resubscribing}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {resubscribing ? "Resubscribing..." : "Resubscribe"}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/billing/cancellation-banner.tsx
git commit -m "feat: add cancellation banner with cancelled and grace period states"
```

---

## Task 14: Payment Failed Banner Component

**Files:**
- Create: `components/billing/payment-failed-banner.tsx`

**Step 1: Create the non-dismissible payment failed banner**

```tsx
"use client";

type Props = {
  onManageBilling: () => void;
  loading: boolean;
};

export function PaymentFailedBanner({ onManageBilling, loading }: Props) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-red-700 bg-red-950/30 px-4 py-3">
      <p className="text-sm text-red-300">
        Payment failed. Please update your payment method to keep your Pro access.
      </p>
      <button
        onClick={onManageBilling}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
      >
        {loading ? "Opening..." : "Update payment method"}
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/billing/payment-failed-banner.tsx
git commit -m "feat: add non-dismissible payment failed banner"
```

---

## Task 15: Pricing Toggle Component

**Files:**
- Create: `components/billing/pricing-toggle.tsx`

**Step 1: Create the monthly/annual toggle**

```tsx
"use client";

type Props = {
  interval: "monthly" | "annual";
  onChange: (interval: "monthly" | "annual") => void;
};

export function PricingToggle({ interval, onChange }: Props) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span
        className={`text-sm font-medium ${interval === "monthly" ? "text-white" : "text-gray-500"}`}
      >
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={interval === "annual"}
        onClick={() => onChange(interval === "monthly" ? "annual" : "monthly")}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            interval === "annual" ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium ${interval === "annual" ? "text-white" : "text-gray-500"}`}
      >
        Annual
      </span>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/billing/pricing-toggle.tsx
git commit -m "feat: add monthly/annual pricing toggle component"
```

---

## Task 16: Pricing Card Component

**Files:**
- Create: `components/billing/pricing-card.tsx`

**Step 1: Create the reusable pricing card**

```tsx
import Link from "next/link";

type Props = {
  name: string;
  price: string;
  subtitle?: string;
  features: string[];
  cta: {
    label: string;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
  };
  highlighted?: boolean;
  badge?: string;
};

export function PricingCard({ name, price, subtitle, features, cta, highlighted, badge }: Props) {
  return (
    <div
      className={`relative rounded-lg border p-6 ${
        highlighted ? "border-blue-600 bg-gray-900" : "border-gray-800 bg-gray-900"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
          {badge}
        </span>
      )}
      <h3 className="text-lg font-semibold text-white">{name}</h3>
      <p className="mt-2 text-3xl font-bold text-white">{price}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
      <ul className="mt-6 space-y-3 text-sm text-gray-400">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      {cta.onClick ? (
        <button
          onClick={cta.onClick}
          disabled={cta.disabled}
          className={`mt-8 block w-full rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors disabled:opacity-50 ${
            highlighted
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "border border-gray-700 text-gray-300 hover:bg-gray-800"
          }`}
        >
          {cta.label}
        </button>
      ) : (
        <Link
          href={cta.href ?? "#"}
          className={`mt-8 block rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors ${
            highlighted
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "border border-gray-700 text-gray-300 hover:bg-gray-800"
          }`}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/billing/pricing-card.tsx
git commit -m "feat: add reusable pricing card component"
```

---

## Task 17: Feature Comparison Component

**Files:**
- Create: `components/billing/feature-comparison.tsx`

**Step 1: Create the feature comparison table**

```tsx
const features = [
  { name: "Tool uses", free: "20/month", pro: "Unlimited" },
  { name: "All available tools", free: true, pro: true },
  { name: "Saved history", free: false, pro: true },
  { name: "Priority AI responses", free: false, pro: true },
];

export function FeatureComparison() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900">
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Feature</th>
            <th className="px-6 py-3 text-center text-sm font-medium text-gray-400">Free</th>
            <th className="px-6 py-3 text-center text-sm font-medium text-blue-400">Pro</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.name} className="border-b border-gray-800 last:border-0">
              <td className="px-6 py-3 text-sm text-gray-300">{feature.name}</td>
              <td className="px-6 py-3 text-center text-sm">
                {typeof feature.free === "boolean" ? (
                  feature.free ? (
                    <span className="text-green-400">&#10003;</span>
                  ) : (
                    <span className="text-gray-600">&mdash;</span>
                  )
                ) : (
                  <span className="text-gray-300">{feature.free}</span>
                )}
              </td>
              <td className="px-6 py-3 text-center text-sm">
                {typeof feature.pro === "boolean" ? (
                  feature.pro ? (
                    <span className="text-green-400">&#10003;</span>
                  ) : (
                    <span className="text-gray-600">&mdash;</span>
                  )
                ) : (
                  <span className="text-white font-medium">{feature.pro}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/billing/feature-comparison.tsx
git commit -m "feat: add feature comparison table component"
```

---

## Task 18: FAQ Section Component

**Files:**
- Create: `components/billing/faq-section.tsx`

**Step 1: Create the FAQ section**

```tsx
const faqs = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You keep Pro access until your billing period ends, plus a 1-day grace period. No questions asked.",
  },
  {
    question: "What happens to my usage if I downgrade?",
    answer:
      "Your existing usage count is preserved. If you've used more than 20 tools this month, free tier limits apply immediately.",
  },
  {
    question: "Can I switch between monthly and annual?",
    answer:
      "Yes — click Manage Subscription and Stripe will handle the switch with prorated billing.",
  },
  {
    question: "Is my payment secure?",
    answer:
      "Payments are processed by Stripe, a PCI DSS Level 1 certified payment processor. We never see or store your card details.",
  },
];

export function FaqSection() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Frequently asked questions</h3>
      <dl className="space-y-4">
        {faqs.map(({ question, answer }) => (
          <div key={question}>
            <dt className="text-sm font-medium text-gray-300">{question}</dt>
            <dd className="mt-1 text-sm text-gray-500">{answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/billing/faq-section.tsx
git commit -m "feat: add FAQ section component for upgrade page"
```

---

## Task 19: Upgrade Page

**Files:**
- Create: `app/(dashboard)/upgrade/page.tsx`

**Step 1: Create the upgrade page**

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PricingToggle } from "@/components/billing/pricing-toggle";
import { PricingCard } from "@/components/billing/pricing-card";
import { FeatureComparison } from "@/components/billing/feature-comparison";
import { FaqSection } from "@/components/billing/faq-section";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);

  // Show toast if redirected from cancelled checkout
  if (searchParams.get("cancelled") === "true") {
    toast("No worries — you can upgrade anytime.", { id: "checkout-cancelled" });
    // Clean URL
    router.replace("/upgrade", { scroll: false });
  }

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyPro) {
          toast.error("You're already on Pro!");
          router.push("/dashboard");
          return;
        }
        toast.error(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const monthlyPrice = "\u00A319";
  const annualPrice = "\u00A3190";
  const annualMonthly = "\u00A315.83";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-white">Upgrade to Pro</h1>
      <p className="mt-2 text-gray-400">
        Unlock unlimited tool uses, saved history, and priority AI responses.
      </p>

      {/* Pricing toggle */}
      <div className="mt-8">
        <PricingToggle interval={interval} onChange={setInterval} />
      </div>

      {/* Pricing cards */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <PricingCard
          name="Free"
          price={"\u00A30"}
          features={[
            `${FREE_MONTHLY_LIMIT} tool uses per month`,
            "All available tools",
          ]}
          cta={{ label: "Current plan", disabled: true }}
        />
        <PricingCard
          name="Pro"
          price={interval === "monthly" ? `${monthlyPrice}/mo` : `${annualPrice}/yr`}
          subtitle={interval === "annual" ? `${annualMonthly}/mo \u2014 save \u00A338` : undefined}
          features={[
            "Unlimited tool uses",
            "Saved history",
            "Priority AI responses",
          ]}
          cta={{
            label: loading ? "Redirecting..." : "Subscribe",
            onClick: handleSubscribe,
            disabled: loading,
          }}
          highlighted
          badge={interval === "annual" ? "Best value" : undefined}
        />
      </div>

      {/* Trust signal */}
      <p className="mt-6 text-center text-xs text-gray-600">
        Powered by Stripe &mdash; secure payments. We never see your card details.
      </p>

      {/* Feature comparison */}
      <div className="mt-12">
        <FeatureComparison />
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <FaqSection />
      </div>
    </div>
  );
}
```

> **Note for implementor:** This page needs to be wrapped in a `<Suspense>` boundary because it uses `useSearchParams()`. Either wrap it in the parent layout or add a wrapper component. Check Next.js 16 docs for the current approach.

**Step 2: Commit**

```bash
git add app/\(dashboard\)/upgrade/page.tsx
git commit -m "feat: add upgrade page with pricing toggle, cards, comparison, and FAQ"
```

---

## Task 20: Checkout Success Page

**Files:**
- Create: `app/(dashboard)/upgrade/success/page.tsx`

**Step 1: Create the polling success page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CHECKOUT_POLL_INTERVAL_MS, CHECKOUT_POLL_TIMEOUT_MS } from "@/lib/constants";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();

    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/stripe/checkout/status");
        const data = await res.json();

        if (data.plan === "pro") {
          clearInterval(poll);
          toast.success("Welcome to Pro! You now have unlimited access.");
          router.push("/dashboard");
        }
      } catch {
        // Ignore network errors during polling
      }

      if (Date.now() - startTime > CHECKOUT_POLL_TIMEOUT_MS) {
        clearInterval(poll);
        setTimedOut(true);
      }
    }, CHECKOUT_POLL_INTERVAL_MS);

    return () => clearInterval(poll);
  }, [router]);

  if (timedOut) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Almost there...</h1>
          <p className="mt-4 text-gray-400">
            Your payment was received but setup is taking longer than expected.
          </p>
          <p className="mt-2 text-gray-400">
            Please refresh the page or contact support if this persists.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500" />
        <h1 className="mt-6 text-2xl font-bold text-white">Setting up your Pro account...</h1>
        <p className="mt-2 text-gray-400">This usually takes just a few seconds.</p>
      </div>
    </div>
  );
}
```

**Step 2: Create the status polling endpoint**

Create `app/api/stripe/checkout/status/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(user.id);

  return NextResponse.json({ plan: plan.plan, status: plan.status });
}
```

**Step 3: Commit**

```bash
git add app/\(dashboard\)/upgrade/success/page.tsx app/api/stripe/checkout/status/route.ts
git commit -m "feat: add checkout success page with polling and status endpoint"
```

---

## Task 21: Update Sidebar with Tier Badge, Usage Counter, and Upgrade Link

**Files:**
- Modify: `components/dashboard/sidebar.tsx:1-34`

The sidebar is currently a client component. We need to pass plan and usage data to it. The cleanest approach is to make the dashboard layout a server component that fetches this data and passes it down.

**Step 1: Update the dashboard layout to fetch plan and usage data**

Modify `app/(dashboard)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";
import { currentMonthDate } from "@/lib/utils";
import { Sidebar } from "@/components/dashboard/sidebar";

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

  // Get total usage across all tools for the current month
  const { data: usageRows } = await supabase
    .from("usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", currentMonthDate());

  const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  // Check for stripe_customer_id for reconciliation
  const { data: userData } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  // Reconcile on page load if user has a stripe customer
  if (userData?.stripe_customer_id && plan.plan === "pro") {
    // Dynamic import to avoid loading stripe client unnecessarily
    const { reconcileSubscription } = await import("@/lib/subscription");
    await reconcileSubscription(user.id, userData.stripe_customer_id);
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar
        plan={plan}
        usageCount={totalUsage}
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

**Step 2: Update the Sidebar component to accept and display plan data**

Rewrite `components/dashboard/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { TierBadge } from "@/components/billing/tier-badge";
import { UsageCounter } from "@/components/billing/usage-counter";
import type { UserPlan } from "@/lib/subscription";

const navItems = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/tools/nuget-advisor", label: "NuGet Advisor" },
];

type Props = {
  plan: UserPlan;
  usageCount: number;
};

export function Sidebar({ plan, usageCount }: Props) {
  const pathname = usePathname();
  const isPro = plan.plan === "pro";

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-950 px-4 py-6">
      <Link href="/dashboard" className="text-xl font-bold text-white">
        Plexease
      </Link>

      {/* Tier badge + usage */}
      <div className="mt-4 flex items-center gap-2">
        <TierBadge plan={plan.plan} />
        {!isPro && (
          <Link
            href="/upgrade"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Upgrade
          </Link>
        )}
      </div>
      <div className="mt-1">
        <UsageCounter isPro={isPro} usageCount={usageCount} />
      </div>

      <nav className="mt-6 flex-1 space-y-1">
        {navItems.map(({ href, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 pt-4">
        <SignOutButton />
      </div>
    </aside>
  );
}
```

**Step 3: Verify build compiles**

Run: `cd /home/deck/Projects/plexease && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add components/dashboard/sidebar.tsx app/\(dashboard\)/layout.tsx
git commit -m "feat: add tier badge, usage counter, and upgrade link to sidebar"
```

---

## Task 22: Dashboard Page with Banners and Subscription Card

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx` (or create if it doesn't exist — check first)

**Step 1: Check if dashboard page exists**

Run: `ls /home/deck/Projects/plexease/app/\(dashboard\)/dashboard/`

If it exists, read it and modify. If not, check `app/(dashboard)/page.tsx`.

**Step 2: Create/update the dashboard page to show subscription status, usage card, and banners**

The dashboard page should be a server component that fetches plan data and passes it to client components for the banners. Create a client wrapper component:

Create `components/dashboard/dashboard-content.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CancellationBanner } from "@/components/billing/cancellation-banner";
import { PaymentFailedBanner } from "@/components/billing/payment-failed-banner";
import { UsageCard } from "@/components/billing/usage-card";
import { TierBadge } from "@/components/billing/tier-badge";
import type { UserPlan } from "@/lib/subscription";

type Props = {
  plan: UserPlan;
  usageCount: number;
};

export function DashboardContent({ plan, usageCount }: Props) {
  const router = useRouter();
  const [resubscribing, setResubscribing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const isPro = plan.plan === "pro";

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
        // If subscription fully ended, redirect to upgrade
        if (res.status === 400) {
          router.push("/upgrade");
          return;
        }
        toast.error(data.error ?? "Failed to resubscribe.");
        return;
      }

      toast.success("Welcome back! Your Pro plan has been reactivated.");
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

      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Subscription card */}
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Plan
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <TierBadge plan={plan.plan} />
            {isPro && plan.currentPeriodEnd && !plan.cancelAtPeriodEnd && (
              <span className="text-xs text-gray-500">
                Renews {formatDate(plan.currentPeriodEnd)}
              </span>
            )}
          </div>
          {isPro && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="mt-3 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
            >
              {portalLoading ? "Opening..." : "Manage Subscription"}
            </button>
          )}
          {!isPro && (
            <a
              href="/upgrade"
              className="mt-3 inline-block text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Upgrade to Pro
            </a>
          )}
        </div>

        {/* Usage card */}
        <UsageCard isPro={isPro} usageCount={usageCount} />

        {/* Tools card */}
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            Tools
          </h3>
          <a
            href="/tools/nuget-advisor"
            className="mt-2 block text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            NuGet Advisor &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Update the dashboard page to use the new content component**

Update the dashboard page (find and modify the existing one — likely `app/(dashboard)/dashboard/page.tsx` or `app/(dashboard)/page.tsx`):

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";
import { currentMonthDate } from "@/lib/utils";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const plan = await getUserPlan(user.id);

  const { data: usageRows } = await supabase
    .from("usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", currentMonthDate());

  const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  return <DashboardContent plan={plan} usageCount={totalUsage} />;
}
```

**Step 4: Commit**

```bash
git add components/dashboard/dashboard-content.tsx app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat: add dashboard with subscription card, usage card, and billing banners"
```

---

## Task 23: Update Landing Page Pricing Section

**Files:**
- Modify: `app/page.tsx:79-112`

**Step 1: Create a client component for the landing page pricing section**

Create `components/landing/pricing-section.tsx`:

```tsx
"use client";

import { useState } from "react";
import { PricingToggle } from "@/components/billing/pricing-toggle";
import { PricingCard } from "@/components/billing/pricing-card";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";

type Props = {
  isLoggedIn: boolean;
  isPro: boolean;
};

export function PricingSection({ isLoggedIn, isPro }: Props) {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");

  const proCta = isPro
    ? { label: "Your current plan", disabled: true }
    : isLoggedIn
      ? { label: "Upgrade to Pro", href: "/upgrade" }
      : { label: "Get started", href: "/signup" };

  const freeCta = isLoggedIn
    ? { label: "Current plan", disabled: true }
    : { label: "Get started", href: "/signup" };

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <h2 className="text-center text-3xl font-bold">Pricing</h2>
      <div className="mt-8">
        <PricingToggle interval={interval} onChange={setInterval} />
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <PricingCard
          name="Free"
          price={"\u00A30"}
          features={[
            `${FREE_MONTHLY_LIMIT} tool uses per month`,
            "All available tools",
          ]}
          cta={freeCta}
        />
        <PricingCard
          name="Pro"
          price={interval === "monthly" ? "\u00A319/mo" : "\u00A3190/yr"}
          subtitle={interval === "annual" ? "\u00A315.83/mo \u2014 save \u00A338" : undefined}
          features={[
            "Unlimited tool uses",
            "Saved history",
            "Priority AI responses",
          ]}
          cta={proCta}
          highlighted
          badge={interval === "annual" ? "Best value" : undefined}
        />
      </div>
    </section>
  );
}
```

**Step 2: Update landing page to use the new pricing section**

Modify `app/page.tsx` — make it a server component that checks auth state and passes it to the pricing section. Replace the pricing section (lines 79-112) with:

```tsx
<PricingSection isLoggedIn={!!user} isPro={isPro} />
```

Add at the top of the file:

```tsx
import { createClient } from "@/lib/supabase/server";
import { PricingSection } from "@/components/landing/pricing-section";
```

Make the component async and add auth check:

```tsx
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isPro = false;
  if (user) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();
    isPro = subscription?.plan === "pro";
  }

  return (
    // ... rest of the page, replacing the old pricing section
  );
}
```

Also update the "Start free trial" text on the Pro card — this is now handled by the `PricingCard` component.

**Step 3: Commit**

```bash
git add components/landing/pricing-section.tsx app/page.tsx
git commit -m "feat: update landing page with pricing toggle and smart CTAs"
```

---

## Task 24: Update NuGet Advisor Page to Pass Full Plan Data

**Files:**
- Modify: `app/(dashboard)/tools/nuget-advisor/page.tsx:16-31`

**Step 1: Update to use the shared subscription module**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdvisorForm } from "@/components/tools/nuget-advisor/advisor-form";
import { TOOL_NAME_NUGET_ADVISOR } from "@/lib/constants";
import { currentMonthDate } from "@/lib/utils";
import { isProUser } from "@/lib/subscription";

export default async function NuGetAdvisorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [isPro, { data: usage }] = await Promise.all([
    isProUser(user.id),
    supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("tool_name", TOOL_NAME_NUGET_ADVISOR)
      .eq("month", currentMonthDate())
      .maybeSingle(),
  ]);

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

**Step 2: Commit**

```bash
git add app/\(dashboard\)/tools/nuget-advisor/page.tsx
git commit -m "refactor: use shared isProUser() in NuGet Advisor page"
```

---

## Task 25: Add `/upgrade` to Protected Routes

**Files:**
- Modify: `lib/supabase/middleware.ts:4`

**Step 1: Add `/upgrade` to the protected routes array**

The upgrade page should only be accessible to logged-in users. Update line 4:

```typescript
const protectedRoutes = ["/dashboard", "/tools", "/upgrade"];
```

**Step 2: Commit**

```bash
git add lib/supabase/middleware.ts
git commit -m "feat: add /upgrade to protected routes"
```

---

## Task 26: Add Stripe Environment Variables

**Step 1: Set up Stripe test mode**

In the Stripe Dashboard (test mode):
1. Create a product called "Plexease Pro"
2. Add two prices:
   - GBP 19.00/month (recurring)
   - GBP 190.00/year (recurring)
3. Copy the price IDs (e.g. `price_xxx`)
4. Go to Developers > API Keys > copy the publishable and secret keys
5. Go to Developers > Webhooks > Add endpoint:
   - URL: Your Vercel preview URL + `/api/stripe/webhook` (or use Stripe CLI for local testing)
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy the webhook signing secret

6. Configure the Customer Portal in Stripe Dashboard:
   - Enable it under Settings > Billing > Customer Portal
   - Allow: update payment method, cancel subscription, switch plans
   - Add both monthly and annual prices as switchable

**Step 2: Update `.env.local`**

Add to `.env.local`:

```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ANNUAL=price_xxx
```

**Step 3: For local webhook testing, install the Stripe CLI**

Run:
```bash
# Install Stripe CLI (check https://stripe.com/docs/stripe-cli for your platform)
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This gives you a local webhook signing secret to use during development.

> **Do NOT commit `.env.local`**

---

## Task 27: Build Verification

**Step 1: Run the full build**

Run: `cd /home/deck/Projects/plexease && npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 2: Run the dev server and manually verify**

Run: `npm run dev`

Verify:
- Landing page shows pricing toggle
- `/upgrade` page loads with monthly/annual cards
- Sidebar shows tier badge and usage counter
- Dashboard shows subscription card and usage card
- Clicking "Subscribe" creates a Stripe Checkout session (with test keys)
- Completing test checkout redirects to success page
- Success page polls and redirects to dashboard when webhook processes
- Dashboard shows Pro badge after upgrade
- "Manage Subscription" opens Stripe Customer Portal

**Step 3: Final commit with any fixes**

```bash
git add -A
git commit -m "fix: address build verification issues"
```

---

## Task 28: Update PLEXEASE.md

**Files:**
- Modify: `PLEXEASE.md:199-206`

**Step 1: Update current status**

Update the Current Status section:

```markdown
## Current Status

> **Update this section each session.**

- Phase: 4 (Phases 1, 2, 2.5 & 3 complete)
- Last action: Phase 3 — Stripe monetisation (checkout, webhooks, Customer Portal, billing banners, usage cards, upgrade page)
- Next step: Phase 4 — Testing (Playwright + Vitest for auth, tools, billing flows)
```

**Step 2: Commit**

```bash
git add PLEXEASE.md
git commit -m "docs: mark Phase 3 complete, update status to Phase 4"
```

---

## Summary of All Commits

| # | Commit message |
|---|---|
| 1 | `feat: add Stripe SDK with env validation and mode safeguard` |
| 2 | `feat: add billing and usage threshold constants` |
| 3 | `feat: add billing columns, unique index, and processed_events table` |
| 4 | `feat: add shared subscription module with plan checks and reconciliation` |
| 5 | `refactor: use shared isProUser() in NuGet Advisor route` |
| 6 | `feat: add Stripe checkout API route with auth, CSRF, and plan checks` |
| 7 | `feat: add Stripe webhook handler with signature verification and deduplication` |
| 8 | `feat: add Stripe Customer Portal API route with auth` |
| 9 | `feat: add resubscribe API route to un-cancel active subscriptions` |
| 10 | `feat: add tier badge component for Free/Pro display` |
| 11 | `feat: add sidebar usage counter component` |
| 12 | `feat: add dashboard usage card with colour-coded progress bar` |
| 13 | `feat: add cancellation banner with cancelled and grace period states` |
| 14 | `feat: add non-dismissible payment failed banner` |
| 15 | `feat: add monthly/annual pricing toggle component` |
| 16 | `feat: add reusable pricing card component` |
| 17 | `feat: add feature comparison table component` |
| 18 | `feat: add FAQ section component for upgrade page` |
| 19 | `feat: add upgrade page with pricing toggle, cards, comparison, and FAQ` |
| 20 | `feat: add checkout success page with polling and status endpoint` |
| 21 | `feat: add tier badge, usage counter, and upgrade link to sidebar` |
| 22 | `feat: add dashboard with subscription card, usage card, and billing banners` |
| 23 | `feat: update landing page with pricing toggle and smart CTAs` |
| 24 | `refactor: use shared isProUser() in NuGet Advisor page` |
| 25 | `feat: add /upgrade to protected routes` |
| 26 | *(env setup — no commit)* |
| 27 | `fix: address build verification issues` |
| 28 | `docs: mark Phase 3 complete, update status to Phase 4` |

---

## Notes for Implementor

1. **Stripe API version:** Check the latest version when implementing. Use whatever the installed SDK defaults to rather than hardcoding.
2. **Next.js 16:** This project uses `proxy.ts` instead of `middleware.ts`. The webhook route needs raw body access — ensure Next.js is configured to NOT parse the body for `/api/stripe/webhook`. In Next.js App Router, `request.text()` should work, but verify.
3. **Supabase service role:** The webhook handler and subscription module use the service role key (`SUPABASE_SERVICE_ROLE_KEY`) to bypass RLS. This is intentional and safe — auth is checked at the API route level.
4. **Restricted Stripe key:** When setting up Stripe API keys, create a restricted key with only: Checkout Sessions (write), Customer Portal (write), Customers (write), Subscriptions (read/write), Webhook Endpoints (read).
5. **Customer Portal configuration:** Must be configured in the Stripe Dashboard before the portal endpoint will work. Enable: update payment method, cancel subscription, switch between monthly/annual plans.
6. **Testing webhooks locally:** Use `stripe listen --forward-to localhost:3000/api/stripe/webhook` during development.
7. **The `getServiceClient()` function** is duplicated in `lib/subscription.ts` and `app/api/stripe/webhook/route.ts`. Consider extracting to a shared `lib/supabase/service.ts` if this pattern is used elsewhere.
