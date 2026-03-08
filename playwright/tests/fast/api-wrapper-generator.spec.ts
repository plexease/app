import { test, expect } from "../../fixtures";
import { ApiWrapperGeneratorPage } from "../../pages/api-wrapper-generator.page";

test.describe("API Wrapper Generator", () => {
  test("free user submits description and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.apiWrapperGenerator(freeUserPage, "success");

    const generator = new ApiWrapperGeneratorPage(freeUserPage);
    await generator.goto();

    await generator.generateWrapper("Stripe Payments API");

    await expect(generator.firstFileCard).toBeVisible({ timeout: 5000 });
    await expect(generator.authSetupCard).toBeVisible();
    await expect(generator.usageExampleCard).toBeVisible();
  });

  test("shows copy button on file cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.apiWrapperGenerator(freeUserPage, "success");

    const generator = new ApiWrapperGeneratorPage(freeUserPage);
    await generator.goto();

    await generator.generateWrapper("Stripe Payments API");

    await expect(generator.firstFileCard).toBeVisible({ timeout: 5000 });
    await expect(generator.copyButton).toBeVisible();
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.apiWrapperGenerator(freeUserPage, "success");

    const generator = new ApiWrapperGeneratorPage(freeUserPage);
    await generator.goto();

    await expect(generator.languageSelect).toBeVisible();
    await generator.languageSelect.selectOption("python");
    await expect(generator.languageSelect).toHaveValue("python");
  });

  test("submit disabled without description", async ({ freeUserPage }) => {
    const generator = new ApiWrapperGeneratorPage(freeUserPage);
    await generator.goto();

    await expect(generator.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.apiWrapperGenerator(freeUserPage, "error");

    const generator = new ApiWrapperGeneratorPage(freeUserPage);
    await generator.goto();

    await generator.generateWrapper("Stripe Payments API");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees no usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.apiWrapperGenerator(proUserPage, "success");

    const generator = new ApiWrapperGeneratorPage(proUserPage);
    await generator.goto();

    await expect(generator.usageCounter).not.toBeVisible();
  });
});
