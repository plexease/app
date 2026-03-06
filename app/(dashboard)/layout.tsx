import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/subscription";
import { currentMonthDate } from "@/lib/utils";
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

  // Get total usage across all tools for the current month
  const { data: usageRows } = await supabase
    .from("usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("month", currentMonthDate());

  const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  // Check for stripe_customer_id for reconciliation
  const { data: userData } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  // Reconcile on page load if user has a stripe customer
  if (userData?.stripe_customer_id && plan.plan === "pro") {
    // Dynamic import to avoid loading stripe client unnecessarily
    const { reconcileSubscription } = await import("@/lib/subscription");
    await reconcileSubscription(user.id, userData.stripe_customer_id);
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar
        plan={plan}
        usageCount={totalUsage}
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
