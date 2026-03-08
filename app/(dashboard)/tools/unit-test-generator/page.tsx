import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UnitTestGeneratorForm } from "@/components/tools/unit-test-generator/generator-form";
import { currentMonthDate } from "@/lib/utils";
import { isProUser } from "@/lib/subscription";

export default async function UnitTestGeneratorPage() {
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
      <h1 className="font-heading text-2xl font-bold text-white">Unit Test Generator</h1>
      <p className="mt-2 text-muted-400">
        Paste your code and get comprehensive unit tests with the right framework,
        mocking setup, and coverage for happy paths, errors, and edge cases.
      </p>

      <div className="mt-8">
        <UnitTestGeneratorForm usageCount={totalUsage} isPro={isPro} />
      </div>
    </div>
  );
}
