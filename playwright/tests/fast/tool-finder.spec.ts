import { test, expect } from "../../fixtures";
import { ToolFinderPage } from "../../pages/tool-finder.page";

test.describe("Tool Finder", () => {
  test("free user submits query and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.toolFinder(freeUserPage, "success");

    const advisor = new ToolFinderPage(freeUserPage);
    await advisor.goto();

    await advisor.advise("Serilog");

    await expect(advisor.recommendationCard).toBeVisible({ timeout: 5000 });
    await expect(advisor.alternativesCard).toBeVisible();
    await expect(advisor.compatibilityCard).toBeVisible();
    await expect(advisor.versionAdviceCard).toBeVisible();
  });

  test("shows alternatives table", async ({ freeUserPage, mockApi }) => {
    await mockApi.toolFinder(freeUserPage, "success");

    const advisor = new ToolFinderPage(freeUserPage);
    await advisor.goto();

    await advisor.advise("Serilog");

    await expect(advisor.alternativesCard).toBeVisible({ timeout: 5000 });
    await expect(advisor.alternativesCard.locator("td").first()).toBeVisible();
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.toolFinder(freeUserPage, "success");

    const advisor = new ToolFinderPage(freeUserPage);
    await advisor.goto();

    await expect(advisor.languageSelect).toBeVisible();
    await advisor.languageSelect.selectOption("python");
    await expect(advisor.languageSelect).toHaveValue("python");
  });

  test("submit disabled without query", async ({ freeUserPage }) => {
    const advisor = new ToolFinderPage(freeUserPage);
    await advisor.goto();

    await expect(advisor.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.toolFinder(freeUserPage, "error");

    const advisor = new ToolFinderPage(freeUserPage);
    await advisor.goto();

    await advisor.advise("Serilog");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.toolFinder(proUserPage, "success");

    const advisor = new ToolFinderPage(proUserPage);
    await advisor.goto();

    await expect(advisor.usageCounter).toBeVisible();
  });

  test("NuGet Advisor URL redirects to Package Advisor", async ({ freeUserPage }) => {
    await freeUserPage.goto("/tools/nuget-advisor");
    await freeUserPage.waitForURL("**/tools/tool-finder**");

    await expect(freeUserPage).toHaveURL(/\/tools\/tool-finder/);
  });
});
