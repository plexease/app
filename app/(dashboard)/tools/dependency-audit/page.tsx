import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuditForm } from "@/components/tools/dependency-audit/audit-form";
import { currentMonthDate } from "@/lib/utils";
import { isProUser } from "@/lib/subscription";

export default async function DependencyAuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [isPro, { data: usageRows }] = await Promise.all([
    isProUser(user.id),
    supabase.from("usage").select("count").eq("user_id", user.id).eq("month", currentMonthDate()),
  ]);

  const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-white">Dependency Audit</h1>
      <p className="mt-2 text-muted-400">
        Paste your dependency file and get an AI-powered audit showing outdated,
        vulnerable, or deprecated packages with upgrade recommendations.
      </p>
      <div className="mt-8">
        <AuditForm usageCount={totalUsage} isPro={isPro} />
      </div>
    </div>
  );
}
