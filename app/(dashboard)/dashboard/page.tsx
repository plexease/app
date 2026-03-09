import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";
import { getUserProfile } from "@/lib/user-profile";
import { currentMonthDate } from "@/lib/utils";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import type { Persona } from "@/lib/types/persona";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const plan = await getUserPlan(user.id);
  const profile = await getUserProfile(user.id);

  const { data: usageRows } = await supabase
    .from("usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", currentMonthDate());

  const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  // Read viewing_as cookie, default to user's persona
  const cookieStore = await cookies();
  const viewingAsCookie = cookieStore.get("viewing_as")?.value as Persona | undefined;
  const validPersonas: Persona[] = ["business_owner", "support_ops", "implementer"];
  const viewingAs: Persona = viewingAsCookie && validPersonas.includes(viewingAsCookie)
    ? viewingAsCookie
    : (profile?.persona ?? "business_owner");

  return (
    <DashboardContent
      plan={plan}
      usageCount={totalUsage}
      viewingAs={viewingAs}
      platforms={profile?.platforms ?? []}
      primaryGoal={profile?.primaryGoal ?? null}
      comfortLevel={profile?.comfortLevel ?? null}
    />
  );
}
