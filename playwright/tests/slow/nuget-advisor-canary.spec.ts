import { test, expect } from "../../fixtures";
import { NuGetAdvisorPage } from "../../pages/nuget-advisor.page";

test.describe("NuGet Advisor Canary", () => {
  test("real Claude API call returns result cards", async ({ freeUserPage }) => {
    test.setTimeout(60000);

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await advisor.analysePackage("Newtonsoft.Json");

    // Real API call — may take up to 30s
    await expect(advisor.whatItDoesCard).toBeVisible({ timeout: 30000 });
    await expect(advisor.alternativesCard).toBeVisible();
    await expect(advisor.compatibilityCard).toBeVisible();
    await expect(advisor.versionAdviceCard).toBeVisible();
  });
});
