import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { submitFeedback, type FeedbackTrigger } from "@/lib/feedback";
import { resolvePersona } from "@/lib/utils";
import { getUserProfile } from "@/lib/user-profile";
import { getUserPlan } from "@/lib/subscription";

const VALID_TRIGGERS: FeedbackTrigger[] = ["fifth_use", "cancellation", "manual"];

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

  const { text, trigger_type, tool_name } = body as {
    text?: string;
    trigger_type?: string;
    tool_name?: string;
  };

  if (!text?.trim() || text.length > 2000) {
    return NextResponse.json(
      { error: "Text is required and must be under 2000 characters" },
      { status: 400 }
    );
  }

  if (!trigger_type || !VALID_TRIGGERS.includes(trigger_type as FeedbackTrigger)) {
    return NextResponse.json(
      { error: "Invalid trigger_type" },
      { status: 400 }
    );
  }

  const profile = await getUserProfile(user.id);
  const cookieStore = await cookies();
  const persona = resolvePersona(
    undefined,
    cookieStore.get("viewing_as")?.value,
    profile?.persona
  );
  const { plan } = await getUserPlan(user.id);

  await submitFeedback({
    userId: user.id,
    text: text.trim(),
    triggerType: trigger_type as FeedbackTrigger,
    toolName: tool_name,
    persona,
    tier: plan,
  });

  return NextResponse.json({ success: true });
}
