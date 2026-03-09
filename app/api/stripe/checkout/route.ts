import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { getOrCreateStripeCustomer, getUserPlan } from "@/lib/subscription";
import {
  STRIPE_PRICE_PRO_MONTHLY,
  STRIPE_PRICE_PRO_ANNUAL,
  STRIPE_PRICE_ESSENTIALS_MONTHLY,
  STRIPE_PRICE_ESSENTIALS_ANNUAL,
} from "@/lib/constants";

export async function POST(request: NextRequest) {
  // CSRF check
  const origin = request.headers.get("origin");
  const expectedOrigin = request.nextUrl.origin;
  if (!origin || origin !== expectedOrigin) {
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

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { interval, tier } = body as { interval?: string; tier?: string };

  // Validate tier
  const validTier = tier === "essentials" || tier === "pro" ? tier : "pro";

  // Validate interval
  const validInterval = interval === "annual" ? "annual" : "monthly";

  // Check if already on the requested tier or higher
  const plan = await getUserPlan(user.id);
  if (plan.plan !== "free" && plan.status === "active") {
    const tierRank = { free: 0, essentials: 1, pro: 2 };
    if (tierRank[plan.plan] >= tierRank[validTier]) {
      return NextResponse.json(
        { error: "Already subscribed to this plan or higher", alreadySubscribed: true },
        { status: 400 }
      );
    }
  }

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

  // Get or create Stripe customer — pass session client to avoid needing service role key
  let customerId: string;
  try {
    if (!user.email) {
      return NextResponse.json({ error: "Email is required for billing" }, { status: 400 });
    }
    customerId = await getOrCreateStripeCustomer(user.id, user.email, supabase);
  } catch (err) {
    console.error("Failed to create Stripe customer:", err instanceof Error ? err.message : "Unknown error");
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
    console.error("Failed to create checkout session:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      { error: "Payment service temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }
}
