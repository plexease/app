import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExplainerForm } from "@/components/tools/code-explainer/explainer-form";
import { currentMonthDate } from "@/lib/utils";
import { isProUser } from "@/lib/subscription";

export default async function CodeExplainerPage() {
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
      <h1 className="font-heading text-2xl font-bold text-white">Code Explainer</h1>
      <p className="mt-2 text-muted-400">
        Paste a code snippet and get a plain English explanation of what it does,
        what packages it uses, and what patterns it follows.
      </p>

      <div className="mt-8">
        <ExplainerForm usageCount={totalUsage} isPro={isPro} />
      </div>
    </div>
  );
}
