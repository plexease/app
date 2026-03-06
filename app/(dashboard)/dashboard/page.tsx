import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-2 text-gray-400">
        Welcome{user?.email ? `, ${user.email}` : ""}
      </p>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white">Your tools</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/tools/nuget-advisor"
            className="rounded-lg border border-gray-700 bg-gray-800 p-6 hover:border-gray-600 transition-colors"
          >
            <h3 className="font-semibold text-white">NuGet Advisor</h3>
            <p className="mt-1 text-sm text-gray-400">
              Get AI-powered advice on any NuGet package — what it does, alternatives, compatibility, and version guidance.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
