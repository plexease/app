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
