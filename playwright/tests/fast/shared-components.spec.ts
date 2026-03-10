import { test, expect } from "../../fixtures";
import { HowItWorksPage } from "../../pages/how-it-works.page";

test.describe("Shared Components", () => {
  test("StackSelector persists language across tools", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "success");

    // Set language on Code Explainer
    const explainer = new HowItWorksPage(freeUserPage);
    await explainer.goto();
    await explainer.languageSelect.selectOption("python");

    // Navigate to Integration Planner — language should persist
    await freeUserPage.goto("/tools/integration-blueprint");
    const langSelect = freeUserPage.locator('select[id="stack-language"]');
    await expect(langSelect).toHaveValue("python");
  });

  test("character counter shows remaining chars", async ({ freeUserPage }) => {
    const explainer = new HowItWorksPage(freeUserPage);
    await explainer.goto();

    await expect(freeUserPage.getByText(/characters remaining/)).toBeVisible();
  });

  test("context banner shows when arriving from hand-off", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "success");

    // Manually set workflow context in localStorage
    await freeUserPage.goto("/tools/how-it-works");
    await freeUserPage.evaluate(() => {
      localStorage.setItem("plexease_workflow_context", JSON.stringify({
        sourceToolId: "error-resolver",
        language: "csharp",
        framework: ".NET 8",
        payload: { code: "var x = 1;" },
        timestamp: new Date().toISOString(),
      }));
    });

    // Reload to pick up context
    await freeUserPage.reload();

    await expect(freeUserPage.getByText(/Continuing from/)).toBeVisible();
  });
});
