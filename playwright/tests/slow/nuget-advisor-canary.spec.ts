import { test, expect } from "../../fixtures";
import { ToolFinderPage } from "../../pages/tool-finder.page";

test.describe("Package Advisor Canary", () => {
  test("real Claude API call returns result cards", async ({ freeUserPage }) => {
    test.setTimeout(60000);

    const advisor = new ToolFinderPage(freeUserPage);
    await advisor.goto();

    await advisor.advise("Newtonsoft.Json");

    // Real API call — may take up to 30s
    await expect(advisor.recommendationCard).toBeVisible({ timeout: 30000 });
    await expect(advisor.alternativesCard).toBeVisible();
    await expect(advisor.compatibilityCard).toBeVisible();
    await expect(advisor.versionAdviceCard).toBeVisible();
  });
});
