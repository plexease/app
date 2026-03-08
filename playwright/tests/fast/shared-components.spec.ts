import { test, expect } from "../../fixtures";
import { CodeExplainerPage } from "../../pages/code-explainer.page";

test.describe("Shared Components", () => {
  test("StackSelector persists language across tools", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "success");

    // Set language on Code Explainer
    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();
    await explainer.languageSelect.selectOption("python");

    // Navigate to Integration Planner — language should persist
    await freeUserPage.goto("/tools/integration-planner");
    const langSelect = freeUserPage.locator('select[id="stack-language"]');
    await expect(langSelect).toHaveValue("python");
  });

  test("character counter shows remaining chars", async ({ freeUserPage }) => {
    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();

    await expect(freeUserPage.getByText(/characters remaining/)).toBeVisible();
  });

  test("context banner shows when arriving from hand-off", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "success");

    // Manually set workflow context in localStorage
    await freeUserPage.goto("/tools/code-explainer");
    await freeUserPage.evaluate(() => {
      localStorage.setItem("plexease_workflow_context", JSON.stringify({
        sourceToolId: "error-explainer",
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
