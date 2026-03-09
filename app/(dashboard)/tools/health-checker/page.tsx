import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HealthCheckerForm } from "@/components/tools/health-checker/checker-form";
import { currentMonthDate } from "@/lib/utils";
import { getUserPlan } from "@/lib/subscription";

export default async function HealthCheckerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [userPlan, { data: usageRows }] = await Promise.all([
    getUserPlan(user.id),
    supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("month", currentMonthDate()),
  ]);

  const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-white">Health Checker</h1>
      <p className="mt-2 text-muted-400">
        Paste your configuration or describe your integration setup to get a health
        assessment with issues, severity levels, and recommendations.
      </p>

      <div className="mt-8">
        <HealthCheckerForm usageCount={totalUsage} plan={userPlan.plan} />
      </div>
    </div>
  );
}
