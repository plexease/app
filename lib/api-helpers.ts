import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_MONTHLY_LIMIT } from "@/lib/constants";
import { currentMonthDate } from "@/lib/utils";
import { isProUser } from "@/lib/subscription";

export interface AuthenticatedContext {
  userId: string;
  isPro: boolean;
}

/**
 * Authenticate user and check usage limits. Returns context or error response.
 */
export async function authenticateAndCheckUsage(
  toolName: string
): Promise<{ context: AuthenticatedContext } | { error: NextResponse }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isPro = await isProUser(user.id);

  if (!isPro) {
    const month = currentMonthDate();
    const { data: usageRows } = await supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("month", month);

    const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

    if (totalUsage >= FREE_MONTHLY_LIMIT) {
      return {
        error: NextResponse.json(
          { error: "Monthly limit reached", limitReached: true },
          { status: 429 }
        ),
      };
    }
  }

  return { context: { userId: user.id, isPro } };
}

/**
 * Increment usage counter for a tool.
 */
export async function incrementUsage(userId: string, toolName: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_usage", {
    p_user_id: userId,
    p_tool_name: toolName,
    p_month: currentMonthDate(),
  });
  if (error) {
    console.error("Failed to increment usage:", error);
  }
}
