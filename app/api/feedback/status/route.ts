import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFeedbackStatus } from "@/lib/feedback";
import { currentMonthDate } from "@/lib/utils";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get total monthly usage (same pattern as api-helpers.ts)
  const month = currentMonthDate();
  const { data: usageRows } = await supabase
    .from("usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", month);

  const totalUsage =
    usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  const status = await getFeedbackStatus(user.id, totalUsage);
  return NextResponse.json(status);
}
