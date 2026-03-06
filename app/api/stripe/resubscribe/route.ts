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
