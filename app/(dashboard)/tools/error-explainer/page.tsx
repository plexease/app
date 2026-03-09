import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ErrorExplainerForm } from "@/components/tools/error-explainer/explainer-form";
import { currentMonthDate } from "@/lib/utils";
import { getUserPlan } from "@/lib/subscription";

export default async function ErrorExplainerPage() {
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
      <h1 className="font-heading text-2xl font-bold text-white">Error Explainer</h1>
      <p className="mt-2 text-muted-400">
        Paste an error log or stack trace and get a plain English explanation of the root cause,
        actionable fix suggestions, and links to relevant documentation.
      </p>

      <div className="mt-8">
        <ErrorExplainerForm usageCount={totalUsage} plan={userPlan.plan} />
      </div>
    </div>
  );
}
