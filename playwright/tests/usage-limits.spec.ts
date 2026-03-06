import { test, expect } from "../fixtures";
import { NuGetAdvisorPage } from "../pages/nuget-advisor.page";

test.describe("Usage Limits", () => {
  test("free user at limit 19 can submit, then gets blocked at 20", async ({
    freeUserPage,
    supabaseAdmin,
  }) => {
    const userId = await supabaseAdmin.getFreeUserId();

    // Seed usage to 19
    await supabaseAdmin.setUsageCount(userId, "nuget-advisor", 19);

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    // Submit should succeed (19 -> 20)
    await advisor.analysePackage("Moq");
    await expect(advisor.whatItDoesCard).toBeVisible({ timeout: 30000 });

    // Now reload the page — should show limit reached
    await advisor.goto();
    await expect(advisor.limitReachedMessage).toBeVisible();
    await expect(advisor.upgradeButton).toBeVisible();

    // Clean up usage for other tests
    await supabaseAdmin.resetUsage(userId);
  });
});
