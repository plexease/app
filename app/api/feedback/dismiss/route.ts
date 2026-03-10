import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dismissFeedbackTrigger } from "@/lib/feedback";

const VALID_TRIGGERS = ["fifth_use", "cancellation"] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { trigger_type } = body as { trigger_type?: string };

  if (
    !trigger_type ||
    !VALID_TRIGGERS.includes(trigger_type as (typeof VALID_TRIGGERS)[number])
  ) {
    return NextResponse.json({ error: "Invalid trigger_type" }, { status: 400 });
  }

  await dismissFeedbackTrigger(
    user.id,
    trigger_type as "fifth_use" | "cancellation"
  );

  return NextResponse.json({ success: true });
}
