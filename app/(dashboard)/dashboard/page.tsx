import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";
import { getUserProfile } from "@/lib/user-profile";
import { currentMonthDate, resolveViewingAs } from "@/lib/utils";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

// Note: layout.tsx fetches plan/profile/usage for the sidebar. We re-fetch here because
// Next.js layouts cannot pass data to pages. Supabase calls are not deduped by Next.js
// cache, so this results in duplicate queries — an accepted trade-off vs. adding a
// React context provider for layout-to-page data passing.
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
  const viewingAs = resolveViewingAs(
    cookieStore.get("viewing_as")?.value,
    profile?.persona
  );

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
