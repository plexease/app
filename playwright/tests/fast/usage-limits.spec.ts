import { test, expect } from "../../fixtures";
import { PackageAdvisorPage } from "../../pages/package-advisor.page";

test.describe("Usage Limits", () => {
  test.describe.configure({ mode: "serial" });
  test("free user at limit 10 sees block message", async ({
    freeUserPage,
    supabaseAdmin,
  }) => {
    const userId = await supabaseAdmin.getFreeUserId();

    await supabaseAdmin.setUsageCount(userId, "package-advisor", 10);

    const advisor = new PackageAdvisorPage(freeUserPage);
    await advisor.goto();

    await expect(advisor.limitReachedMessage).toBeVisible();
    await expect(advisor.upgradeButton).toBeVisible();

    await supabaseAdmin.resetUsage(userId);
  });

  test("free user at limit 9 can still submit", async ({
    freeUserPage,
    supabaseAdmin,
    mockApi,
  }) => {
    await mockApi.packageAdvisor(freeUserPage, "success");
    const userId = await supabaseAdmin.getFreeUserId();

    await supabaseAdmin.setUsageCount(userId, "package-advisor", 9);

    const advisor = new PackageAdvisorPage(freeUserPage);
    await advisor.goto();

    await expect(advisor.queryInput).toBeVisible();
    await expect(advisor.usageCounter).toBeVisible();

    await advisor.advise("Moq");

    // Client increments currentUsage locally from 9→10, triggering limit message
    await expect(advisor.limitReachedMessage).toBeVisible({ timeout: 5000 });

    await supabaseAdmin.resetUsage(userId);
  });
});
