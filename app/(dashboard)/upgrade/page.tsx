import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";
import { UpgradeContent } from "./upgrade-content";

export default async function UpgradePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/upgrade");
  }

  const plan = await getUserPlan(user.id);

  // Pro users should not see the upgrade page
  if (plan.plan === "pro") {
    redirect("/dashboard");
  }

  return <UpgradeContent />;
}
