import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MapForm } from "@/components/tools/connection-map/map-form";
import { currentMonthDate } from "@/lib/utils";
import { getUserPlan } from "@/lib/subscription";

export default async function ConnectionMapPage() {
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
      <h1 className="font-heading text-2xl font-bold text-white">Connection Map</h1>
      <p className="mt-2 text-muted-400">
        See how your apps are connected and identify weak spots in your integration landscape.
      </p>

      <div className="mt-8">
        <MapForm usageCount={totalUsage} plan={userPlan.plan} />
      </div>
    </div>
  );
}
