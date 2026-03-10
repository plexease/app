import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangeForm } from "@/components/tools/what-changed/change-form";
import { currentMonthDate } from "@/lib/utils";
import { getUserPlan } from "@/lib/subscription";

export default async function WhatChangedPage() {
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
      <h1 className="font-heading text-2xl font-bold text-white">What Changed?</h1>
      <p className="mt-2 text-muted-400">
        Describe an external change and find out how it affects your integrations.
      </p>

      <div className="mt-8">
        <ChangeForm usageCount={totalUsage} plan={userPlan.plan} />
      </div>
    </div>
  );
}
