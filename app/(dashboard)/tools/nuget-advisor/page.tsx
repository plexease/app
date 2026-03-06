import { createClient } from "@/lib/supabase/server";
import { AdvisorForm } from "@/components/tools/nuget-advisor/advisor-form";

function currentMonthDate(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export default async function NuGetAdvisorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subscription }, { data: usage }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("usage")
      .select("count")
      .eq("user_id", user!.id)
      .eq("tool_name", "nuget-advisor")
      .eq("month", currentMonthDate())
      .maybeSingle(),
  ]);

  const isPro = subscription?.plan === "pro";
  const usageCount = usage?.count ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">NuGet Advisor</h1>
      <p className="mt-2 text-gray-400">
        Enter a NuGet package name to get an AI-powered advisory on what it does,
        alternatives, compatibility, and version advice.
      </p>

      <div className="mt-8">
        <AdvisorForm usageCount={usageCount} isPro={isPro} />
      </div>
    </div>
  );
}
