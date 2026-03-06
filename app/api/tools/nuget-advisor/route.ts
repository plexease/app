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

  // Check plan
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

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
    p_tool_name: TOOL_NAME,
    p_month: currentMonthDate(),
  });
  if (rpcError) {
    console.error("Failed to increment usage:", rpcError);
  }

  return NextResponse.json(result);
}
