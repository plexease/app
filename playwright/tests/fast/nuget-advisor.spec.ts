import { test, expect } from "../../fixtures";
import { NuGetAdvisorPage } from "../../pages/nuget-advisor.page";

test.describe("NuGet Advisor", () => {
  test("free user submits query and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.nugetAdvisor(freeUserPage, "success");

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await advisor.analysePackage("Newtonsoft.Json");

    await expect(advisor.whatItDoesCard).toBeVisible({ timeout: 5000 });
    await expect(advisor.alternativesCard).toBeVisible();
    await expect(advisor.compatibilityCard).toBeVisible();
    await expect(advisor.versionAdviceCard).toBeVisible();
  });

  test("pro user submits query without usage limit shown", async ({ proUserPage, mockApi }) => {
    await mockApi.nugetAdvisor(proUserPage, "success");

    const advisor = new NuGetAdvisorPage(proUserPage);
    await advisor.goto();

    await expect(advisor.usageCounter).not.toBeVisible();

    await advisor.analysePackage("Serilog");

    await expect(advisor.whatItDoesCard).toBeVisible({ timeout: 5000 });
  });
});
