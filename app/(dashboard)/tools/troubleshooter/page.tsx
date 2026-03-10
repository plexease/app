import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TroubleshooterForm } from "@/components/tools/troubleshooter/troubleshooter-form";
import { currentMonthDate } from "@/lib/utils";
import { getUserPlan } from "@/lib/subscription";

export default async function TroubleshooterPage() {
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
      <h1 className="font-heading text-2xl font-bold text-white">Troubleshooter</h1>
      <p className="mt-2 text-muted-400">
        Describe your integration problem and get a guided diagnosis with fix steps.
      </p>

      <div className="mt-8">
        <TroubleshooterForm usageCount={totalUsage} plan={userPlan.plan} />
      </div>
    </div>
  );
}
