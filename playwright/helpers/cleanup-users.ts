import { createClient } from "@supabase/supabase-js";

export async function purgeStaleTestUsers(): Promise<number> {
  const url = process.env.TEST_SUPABASE_URL;
  const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.warn("Skipping test user cleanup — missing env vars");
    return 0;
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { users }, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Failed to list users for cleanup:", error.message);
    return 0;
  }

  const staleUsers = users.filter(
    (u) => u.email?.startsWith("test-signup-") && u.email?.endsWith("@test.plexease.io")
  );

  let deleted = 0;
  for (const user of staleUsers) {
    const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
    if (delError) {
      console.error(`Failed to delete ${user.email}:`, delError.message);
    } else {
      deleted++;
    }
  }

  return deleted;
}
