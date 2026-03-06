import { test, expect } from "../fixtures";
import { NuGetAdvisorPage } from "../pages/nuget-advisor.page";

test.describe("Usage Limits", () => {
  test("free user at limit 20 sees block message", async ({
    freeUserPage,
    supabaseAdmin,
  }) => {
    const userId = await supabaseAdmin.getFreeUserId();

    // Seed usage to 20 (at the limit)
    await supabaseAdmin.setUsageCount(userId, "nuget-advisor", 20);

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    // Should immediately show limit reached (server-side check)
    await expect(advisor.limitReachedMessage).toBeVisible();
    await expect(advisor.upgradeButton).toBeVisible();

    // Clean up usage for other tests
    await supabaseAdmin.resetUsage(userId);
  });

  test("free user at limit 19 can still submit", async ({
    freeUserPage,
    supabaseAdmin,
  }) => {
    const userId = await supabaseAdmin.getFreeUserId();

    // Seed usage to 19 (one below limit)
    await supabaseAdmin.setUsageCount(userId, "nuget-advisor", 19);

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    // Form should be visible (not blocked)
    await expect(advisor.packageInput).toBeVisible();
    await expect(advisor.usageCounter).toBeVisible();

    // Submit should succeed
    await advisor.analysePackage("Moq");

    // After API call increments to 20, client-side limit kicks in
    // React replaces the form with the limit message
    await expect(advisor.limitReachedMessage).toBeVisible({ timeout: 30000 });

    // Clean up usage for other tests
    await supabaseAdmin.resetUsage(userId);
  });
});
