import { test, expect } from "../../fixtures";
import { NuGetAdvisorPage } from "../../pages/nuget-advisor.page";

test.describe("NuGet Advisor (mocked)", () => {
  test("free user sees mocked result cards instantly", async ({ freeUserPage, mockApi }) => {
    await mockApi.nugetAdvisor(freeUserPage, "success");

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await advisor.analysePackage("Newtonsoft.Json");

    await expect(advisor.whatItDoesCard).toBeVisible({ timeout: 3000 });
    await expect(advisor.alternativesCard).toBeVisible();
    await expect(advisor.compatibilityCard).toBeVisible();
    await expect(advisor.versionAdviceCard).toBeVisible();
  });

  test("free user sees error state from mocked error", async ({ freeUserPage, mockApi }) => {
    await mockApi.nugetAdvisor(freeUserPage, "error");

    const advisor = new NuGetAdvisorPage(freeUserPage);
    await advisor.goto();

    await advisor.analysePackage("BadPackage");

    await expect(
      freeUserPage.getByText(/failed to get advice|please try again/i)
    ).toBeVisible({ timeout: 3000 });
  });
});
