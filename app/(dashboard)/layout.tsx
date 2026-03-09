import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";
import { getUserProfile } from "@/lib/user-profile";
import { currentMonthDate, resolveViewingAs } from "@/lib/utils";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const plan = await getUserPlan(user.id);
  const profile = await getUserProfile(user.id);

  // Get total usage across all tools for the current month
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

  // Reconcile once per session (not on every page load)
  const alreadyReconciled = cookieStore.get("reconciled");

  if (!alreadyReconciled && plan.plan !== "free") {
    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (userData?.stripe_customer_id) {
      const { reconcileSubscription } = await import("@/lib/subscription");
      await reconcileSubscription(user.id, userData.stripe_customer_id);
    }

    try {
      cookieStore.set("reconciled", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    } catch {
      // Reconciliation still ran — the cookie just won't be set this time.
    }
  }

  return (
    <div className="flex min-h-screen bg-surface-900">
      <Sidebar
        plan={plan}
        usageCount={totalUsage}
        viewingAs={viewingAs}
      />
      <main id="main-content" className="flex-1 p-8">{children}</main>
    </div>
  );
}
