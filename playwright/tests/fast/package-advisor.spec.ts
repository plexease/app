import { test, expect } from "../../fixtures";
import { PackageAdvisorPage } from "../../pages/package-advisor.page";

test.describe("Package Advisor", () => {
  test("free user submits query and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.packageAdvisor(freeUserPage, "success");

    const advisor = new PackageAdvisorPage(freeUserPage);
    await advisor.goto();

    await advisor.advise("Serilog");

    await expect(advisor.recommendationCard).toBeVisible({ timeout: 5000 });
    await expect(advisor.alternativesCard).toBeVisible();
    await expect(advisor.compatibilityCard).toBeVisible();
    await expect(advisor.versionAdviceCard).toBeVisible();
  });

  test("shows alternatives table", async ({ freeUserPage, mockApi }) => {
    await mockApi.packageAdvisor(freeUserPage, "success");

    const advisor = new PackageAdvisorPage(freeUserPage);
    await advisor.goto();

    await advisor.advise("Serilog");

    await expect(advisor.alternativesCard).toBeVisible({ timeout: 5000 });
    await expect(advisor.alternativesCard.locator("td").first()).toBeVisible();
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.packageAdvisor(freeUserPage, "success");

    const advisor = new PackageAdvisorPage(freeUserPage);
    await advisor.goto();

    await expect(advisor.languageSelect).toBeVisible();
    await advisor.languageSelect.selectOption("python");
    await expect(advisor.languageSelect).toHaveValue("python");
  });

  test("submit disabled without query", async ({ freeUserPage }) => {
    const advisor = new PackageAdvisorPage(freeUserPage);
    await advisor.goto();

    await expect(advisor.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.packageAdvisor(freeUserPage, "error");

    const advisor = new PackageAdvisorPage(freeUserPage);
    await advisor.goto();

    await advisor.advise("Serilog");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.packageAdvisor(proUserPage, "success");

    const advisor = new PackageAdvisorPage(proUserPage);
    await advisor.goto();

    await expect(advisor.usageCounter).toBeVisible();
  });

  test("NuGet Advisor URL redirects to Package Advisor", async ({ freeUserPage }) => {
    await freeUserPage.goto("/tools/nuget-advisor");
    await freeUserPage.waitForURL("**/tools/package-advisor**");

    await expect(freeUserPage).toHaveURL(/\/tools\/package-advisor/);
  });
});
