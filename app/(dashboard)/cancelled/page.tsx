import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CancellationFeedback } from "@/components/feedback/cancellation-feedback";

export const metadata = {
  title: "Cancellation — Plexease",
};

export default async function CancelledPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("show_cancellation_feedback, current_period_end")
    .eq("user_id", user.id)
    .single();

  if (!sub?.show_cancellation_feedback) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <CancellationFeedback periodEnd={sub.current_period_end ?? null} />
    </div>
  );
}
