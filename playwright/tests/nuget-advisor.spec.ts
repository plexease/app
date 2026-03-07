import { test, expect } from "../fixtures";
import { NuGetAdvisorPage } from "../pages/nuget-advisor.page";

test.describe("NuGet Advisor", () => {
  test("free user submits query and sees result cards", async ({ freeUserPage }) => {
    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await advisor.analysePackage("Newtonsoft.Json");

    // Wait for result cards to appear (real Claude API call — may take a few seconds)
    await expect(advisor.whatItDoesCard).toBeVisible({ timeout: 30000 });
    await expect(advisor.alternativesCard).toBeVisible();
    await expect(advisor.compatibilityCard).toBeVisible();
    await expect(advisor.versionAdviceCard).toBeVisible();
  });

  test("pro user submits query without usage limit shown", async ({ proUserPage }) => {
    const advisor = new NuGetAdvisorPage(proUserPage);
    await advisor.goto();

    // Pro user should not see usage counter
    await expect(advisor.usageCounter).not.toBeVisible();

    await advisor.analysePackage("Serilog");

    await expect(advisor.whatItDoesCard).toBeVisible({ timeout: 30000 });
  });
});
