import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PackageAdvisorForm } from "@/components/tools/tool-finder/advisor-form";
import { currentMonthDate } from "@/lib/utils";
import { getUserPlan } from "@/lib/subscription";

export default async function ToolFinderPage() {
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
      <h1 className="font-heading text-2xl font-bold text-white">Tool Finder</h1>
      <p className="mt-2 text-muted-400">
        Describe what you need or name a specific tool and get recommendations,
        alternatives, compatibility info, and version advice.
      </p>

      <div className="mt-8">
        <PackageAdvisorForm usageCount={totalUsage} plan={userPlan.plan} />
      </div>
    </div>
  );
}
