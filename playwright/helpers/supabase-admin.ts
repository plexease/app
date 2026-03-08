import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.TEST_SUPABASE_URL;
  const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing TEST_SUPABASE_URL or TEST_SUPABASE_SERVICE_ROLE_KEY in .env.test");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function ensureTestUser(email: string, password: string): Promise<string> {
  const supabase = getAdminClient();

  // Try to create user (idempotent — 422 if exists)
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created?.user) {
    return created.user.id;
  }

  if (createError && createError.message.includes("already been registered")) {
    // Look up existing user — don't update password as it can invalidate sessions
    // in parallel CI jobs sharing the same Supabase project
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    const user = users.find((u) => u.email === email);
    if (!user) throw new Error(`User ${email} not found after creation conflict`);
    return user.id;
  }

  throw createError;
}

export async function findTestUser(email: string): Promise<string> {
  const supabase = getAdminClient();
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  const user = users.find((u) => u.email === email);
  if (!user) throw new Error(`Test user ${email} not found — run globalSetup first`);
  return user.id;
}

export async function ensureProSubscription(userId: string): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: "pro",
        status: "active",
        stripe_subscription_id: "test_sub_pro",
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;
}

export async function setUsageCount(
  userId: string,
  toolName: string,
  count: number,
  month: string
): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("usage")
    .upsert(
      { user_id: userId, tool_name: toolName, month, count },
      { onConflict: "user_id,tool_name,month" }
    );

  if (error) throw error;
}

export async function resetUsageForUser(userId: string): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("usage")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
}

export async function resetProSubscription(userId: string): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: "pro",
        status: "active",
        stripe_subscription_id: "test_sub_pro",
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        grace_period_end: null,
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;
}

export async function setSubscriptionState(
  userId: string,
  overrides: {
    status?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string;
    gracePeriodEnd?: string | null;
  }
): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: "pro",
        status: overrides.status ?? "active",
        stripe_subscription_id: "test_sub_banner",
        current_period_end:
          overrides.currentPeriodEnd ??
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: overrides.cancelAtPeriodEnd ?? false,
        grace_period_end: overrides.gracePeriodEnd ?? null,
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;
}

export async function deleteSubscription(userId: string): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", userId);

  if (error) throw error;
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}
