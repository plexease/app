import { test, expect } from "../../fixtures";
import { NuGetAdvisorPage } from "../../pages/nuget-advisor.page";

test.describe("Usage Limits", () => {
  test.describe.configure({ mode: "serial" });
  test("free user at limit 20 sees block message", async ({
    freeUserPage,
    supabaseAdmin,
  }) => {
    const userId = await supabaseAdmin.getFreeUserId();

    await supabaseAdmin.setUsageCount(userId, "nuget-advisor", 20);

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await expect(advisor.limitReachedMessage).toBeVisible();
    await expect(advisor.upgradeButton).toBeVisible();

    await supabaseAdmin.resetUsage(userId);
  });

  test("free user at limit 19 can still submit", async ({
    freeUserPage,
    supabaseAdmin,
    mockApi,
  }) => {
    await mockApi.nugetAdvisor(freeUserPage, "success");
    const userId = await supabaseAdmin.getFreeUserId();

    await supabaseAdmin.setUsageCount(userId, "nuget-advisor", 19);

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await expect(advisor.packageInput).toBeVisible();
    await expect(advisor.usageCounter).toBeVisible();

    await advisor.analysePackage("Moq");

    // Client increments currentUsage locally from 19→20, triggering limit message
    await expect(advisor.limitReachedMessage).toBeVisible({ timeout: 5000 });

    await supabaseAdmin.resetUsage(userId);
  });
});
