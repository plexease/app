import { stripe } from "@/lib/stripe";
import {
  GRACE_PERIOD_DAYS,
  STRIPE_PRICE_ESSENTIALS_MONTHLY,
  STRIPE_PRICE_ESSENTIALS_ANNUAL,
  STRIPE_PRICE_PRO_MONTHLY,
  STRIPE_PRICE_PRO_ANNUAL,
} from "@/lib/constants";
import { getServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";

const ESSENTIALS_PRICES = [STRIPE_PRICE_ESSENTIALS_MONTHLY, STRIPE_PRICE_ESSENTIALS_ANNUAL];
const PRO_PRICES = [STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL];

function determinePlan(stripePriceId: string | null): PlanTier {
  if (!stripePriceId) return "free";
  if (PRO_PRICES.includes(stripePriceId)) return "pro";
  if (ESSENTIALS_PRICES.includes(stripePriceId)) return "essentials";
  return "free";
}

export type PlanTier = "free" | "essentials" | "pro";

export type UserPlan = {
  plan: PlanTier;
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
    .select("plan, status, current_period_end, cancel_at_period_end, grace_period_end, stripe_subscription_id, stripe_price_id")
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

  // Use stripe_price_id for accurate tier detection; fall back to plan column
  const plan = subscription.stripe_price_id
    ? determinePlan(subscription.stripe_price_id)
    : (subscription.plan as PlanTier);

  return {
    plan: plan === "free" && subscription.plan !== "free" ? (subscription.plan as PlanTier) : plan,
    status: subscription.status as "active" | "cancelled" | "past_due",
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    gracePeriodEnd: subscription.grace_period_end,
    stripeSubscriptionId: subscription.stripe_subscription_id,
  };
}

export async function isProUser(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return isPaidTier(plan, "pro");
}

export async function isEssentialsUser(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return isPaidTier(plan, "essentials");
}

/** Check if a user plan is on a specific paid tier and active (including grace period). */
function isPaidTier(plan: UserPlan, tier: PlanTier): boolean {
  if (plan.plan !== tier) return false;
  if (plan.status === "active" || plan.status === "past_due") return true;

  // Check grace period
  if (plan.gracePeriodEnd) {
    return new Date() < new Date(plan.gracePeriodEnd);
  }

  return false;
}

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  // Pass an authenticated session client to avoid needing the service role key
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client?: SupabaseClient<any>
): Promise<string> {
  const supabase = client ?? getServiceClient();

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
  const dbSaysPaid = dbSubscription.plan !== "free" && dbSubscription.status === "active";

  if (hasActiveStripeSub && !dbSaysPaid) {
    // Stripe says active, DB says not — fix DB
    const sub = stripeSubscriptions.data[0];
    const priceId = sub.items.data[0]?.price.id ?? null;
    const detectedPlan = determinePlan(priceId);
    // If price ID is unrecognised, keep the existing DB plan rather than defaulting
    const plan = detectedPlan !== "free" ? detectedPlan : (dbSubscription.plan as PlanTier);
    await supabase
      .from("subscriptions")
      .update({
        plan,
        status: "active",
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        current_period_end: new Date(sub.items.data[0].current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      })
      .eq("user_id", userId);
  } else if (!hasActiveStripeSub && dbSaysPaid) {
    // Stripe says no active sub, DB says paid — check for grace period
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
