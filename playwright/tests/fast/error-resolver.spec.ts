import { test, expect } from "../../fixtures";
import { ErrorResolverPage } from "../../pages/error-resolver.page";

test.describe("Error Resolver", () => {
  test("free user submits error and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.errorResolver(freeUserPage, "success");

    const explainer = new ErrorResolverPage(freeUserPage);
    await explainer.goto();

    await explainer.analyseError("System.NullReferenceException: Object reference not set");

    await expect(explainer.rootCauseCard).toBeVisible({ timeout: 5000 });
    await expect(explainer.fixSuggestionsCard).toBeVisible();
    await expect(explainer.relatedDocsCard).toBeVisible();
  });

  test("shows fix suggestions list", async ({ freeUserPage, mockApi }) => {
    await mockApi.errorResolver(freeUserPage, "success");

    const explainer = new ErrorResolverPage(freeUserPage);
    await explainer.goto();

    await explainer.analyseError("System.NullReferenceException: Object reference not set");

    await expect(explainer.fixSuggestionsCard).toBeVisible({ timeout: 5000 });
    await expect(explainer.fixSuggestionsCard.locator("li")).toHaveCount(3);
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.errorResolver(freeUserPage, "success");

    const explainer = new ErrorResolverPage(freeUserPage);
    await explainer.goto();

    await expect(explainer.languageSelect).toBeVisible();
    await explainer.languageSelect.selectOption("python");
    await expect(explainer.languageSelect).toHaveValue("python");
  });

  test("submit disabled without error log", async ({ freeUserPage }) => {
    const explainer = new ErrorResolverPage(freeUserPage);
    await explainer.goto();

    await expect(explainer.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.errorResolver(freeUserPage, "error");

    const explainer = new ErrorResolverPage(freeUserPage);
    await explainer.goto();

    await explainer.analyseError("System.NullReferenceException: Object reference not set");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.errorResolver(proUserPage, "success");

    const explainer = new ErrorResolverPage(proUserPage);
    await explainer.goto();

    await expect(explainer.usageCounter).toBeVisible();
  });
});
