import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MigrationAssistantForm } from "@/components/tools/migration-assistant/assistant-form";
import { currentMonthDate } from "@/lib/utils";
import { isProUser } from "@/lib/subscription";

export default async function MigrationAssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [isPro, { data: usageRows }] = await Promise.all([
    isProUser(user.id),
    supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("month", currentMonthDate()),
  ]);

  const totalUsage = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-white">Migration Assistant</h1>
      <p className="mt-2 text-muted-400">
        Specify your current and target framework versions, paste relevant code,
        and get a step-by-step migration plan with code changes and breaking change warnings.
      </p>

      <div className="mt-8">
        <MigrationAssistantForm usageCount={totalUsage} isPro={isPro} />
      </div>
    </div>
  );
}
