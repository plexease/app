import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { calculateGracePeriodEnd } from "@/lib/subscription";
import { getServiceClient } from "@/lib/supabase/service";
import Stripe from "stripe";

// Body size limit: 64KB
const MAX_BODY_SIZE = 64 * 1024;

// Simple in-memory rate limiter per IP
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 100; // max requests per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Check body size via content-length header and enforce on actual body
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const body = await request.text();
  if (body.length > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
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
    console.error("Webhook signature verification failed:", err instanceof Error ? err.message : "Unknown error");
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
    console.error(`Webhook handler error for ${event.type}:`, err instanceof Error ? err.message : "Unknown error");
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
  const { error } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      plan: "pro",
      status: "active",
      stripe_subscription_id: subscriptionId,
      current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
      cancel_at_period_end: false,
      grace_period_end: null,
    }, { onConflict: "user_id" });

  if (error) {
    throw new Error(`Failed to upsert subscription for user ${userId}: ${error.message}`);
  }
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

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status,
      current_period_end: new Date(verified.items.data[0].current_period_end * 1000).toISOString(),
      cancel_at_period_end: verified.cancel_at_period_end,
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update subscription for user ${userId}: ${error.message}`);
  }
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

  const periodEnd = new Date(subscription.items.data[0].current_period_end * 1000);
  const gracePeriodEnd = calculateGracePeriodEnd(periodEnd);

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancel_at_period_end: false,
      grace_period_end: gracePeriodEnd.toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update cancelled subscription for user ${userId}: ${error.message}`);
  }
}

async function handlePaymentFailed(
  event: Stripe.Event,
  supabase: ReturnType<typeof getServiceClient>
) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined;

  if (!subscriptionId) return;

  // Get user from subscription metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    throw new Error("Missing supabase_user_id in subscription metadata");
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update past_due status for user ${userId}: ${error.message}`);
  }
}
