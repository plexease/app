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

      <div className="mt-8 rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white">Your tools</h2>
        <p className="mt-2 text-sm text-gray-400">
          Tools will appear here as they become available.
        </p>
      </div>
    </div>
  );
}
