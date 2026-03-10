import "server-only";
import { getServiceClient } from "@/lib/supabase/service";

export type FeedbackTrigger = "fifth_use" | "cancellation" | "manual";

export async function submitFeedback(params: {
  userId: string;
  text: string;
  triggerType: FeedbackTrigger;
  toolName?: string;
  persona: string;
  tier: string;
}): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase.from("feedback").insert({
    user_id: params.userId,
    text: params.text,
    trigger_type: params.triggerType,
    tool_name: params.toolName ?? null,
    persona: params.persona,
    tier: params.tier,
  });

  if (error) {
    throw new Error(`Failed to submit feedback: ${error.message}`);
  }
}

export async function dismissFeedbackTrigger(
  userId: string,
  triggerType: "fifth_use" | "cancellation"
): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase.from("feedback_dismissals").insert({
    user_id: userId,
    trigger_type: triggerType,
  });

  // Ignore unique constraint violations (already dismissed)
  if (error && !error.message.includes("duplicate")) {
    throw new Error(`Failed to dismiss feedback: ${error.message}`);
  }
}

export async function getFeedbackStatus(
  userId: string,
  totalUsage: number
): Promise<{ showFifthUseCard: boolean }> {
  if (totalUsage < 5) {
    return { showFifthUseCard: false };
  }

  const supabase = getServiceClient();

  // Check if already dismissed
  const { data: dismissal } = await supabase
    .from("feedback_dismissals")
    .select("id")
    .eq("user_id", userId)
    .eq("trigger_type", "fifth_use")
    .single();

  if (dismissal) {
    return { showFifthUseCard: false };
  }

  // Check if already submitted fifth_use feedback
  const { data: existing } = await supabase
    .from("feedback")
    .select("id")
    .eq("user_id", userId)
    .eq("trigger_type", "fifth_use")
    .limit(1)
    .single();

  if (existing) {
    return { showFifthUseCard: false };
  }

  return { showFifthUseCard: true };
}
