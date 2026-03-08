import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdvisorForm } from "@/components/tools/nuget-advisor/advisor-form";
import { currentMonthDate } from "@/lib/utils";
import { isProUser } from "@/lib/subscription";

export default async function NuGetAdvisorPage() {
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

  const usageCount = usageRows?.reduce((sum, row) => sum + (row.count ?? 0), 0) ?? 0;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-white">NuGet Advisor</h1>
      <p className="mt-2 text-muted-400">
        Enter a NuGet package name to get an AI-powered advisory on what it does,
        alternatives, compatibility, and version advice.
      </p>

      <div className="mt-8">
        <AdvisorForm usageCount={usageCount} isPro={isPro} />
      </div>
    </div>
  );
}
