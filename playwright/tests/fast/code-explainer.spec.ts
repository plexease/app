import { test, expect } from "../../fixtures";
import { CodeExplainerPage } from "../../pages/code-explainer.page";

test.describe("Code Explainer", () => {
  test("free user submits code and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "success");

    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();

    await explainer.explainCode("public class PaymentService { }");

    await expect(explainer.explanationCard).toBeVisible({ timeout: 5000 });
    await expect(explainer.detectedPackagesCard).toBeVisible();
    await expect(explainer.detectedPatternsCard).toBeVisible();
  });

  test("shows What's Next section after results", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "success");

    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();

    await explainer.explainCode("public class PaymentService { }");

    await expect(explainer.whatsNextSection).toBeVisible({ timeout: 5000 });
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "success");

    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();

    await expect(explainer.languageSelect).toBeVisible();
    await explainer.languageSelect.selectOption("python");
    await expect(explainer.languageSelect).toHaveValue("python");
  });

  test("submit disabled without code", async ({ freeUserPage }) => {
    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();

    await expect(explainer.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeExplainer(freeUserPage, "error");

    const explainer = new CodeExplainerPage(freeUserPage);
    await explainer.goto();

    await explainer.explainCode("public class PaymentService { }");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees no usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.codeExplainer(proUserPage, "success");

    const explainer = new CodeExplainerPage(proUserPage);
    await explainer.goto();

    await expect(explainer.usageCounter).not.toBeVisible();
  });
});
