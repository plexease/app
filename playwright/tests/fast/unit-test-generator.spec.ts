import { test, expect } from "../../fixtures";
import { UnitTestGeneratorPage } from "../../pages/unit-test-generator.page";

test.describe("Unit Test Generator", () => {
  test("free user submits code and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.unitTestGenerator(freeUserPage, "success");

    const generator = new UnitTestGeneratorPage(freeUserPage);
    await generator.goto();

    await generator.generateTests("public class PaymentService { }");

    await expect(generator.firstFileCard).toBeVisible({ timeout: 5000 });
    await expect(generator.testFrameworkCard).toBeVisible();
    await expect(generator.mockingApproachCard).toBeVisible();
  });

  test("shows copy button on file cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.unitTestGenerator(freeUserPage, "success");

    const generator = new UnitTestGeneratorPage(freeUserPage);
    await generator.goto();

    await generator.generateTests("public class PaymentService { }");

    await expect(generator.firstFileCard).toBeVisible({ timeout: 5000 });
    await expect(generator.copyButton).toBeVisible();
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.unitTestGenerator(freeUserPage, "success");

    const generator = new UnitTestGeneratorPage(freeUserPage);
    await generator.goto();

    await expect(generator.languageSelect).toBeVisible();
    await generator.languageSelect.selectOption("python");
    await expect(generator.languageSelect).toHaveValue("python");
  });

  test("submit disabled without code", async ({ freeUserPage }) => {
    const generator = new UnitTestGeneratorPage(freeUserPage);
    await generator.goto();

    await expect(generator.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.unitTestGenerator(freeUserPage, "error");

    const generator = new UnitTestGeneratorPage(freeUserPage);
    await generator.goto();

    await generator.generateTests("public class PaymentService { }");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees no usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.unitTestGenerator(proUserPage, "success");

    const generator = new UnitTestGeneratorPage(proUserPage);
    await generator.goto();

    await expect(generator.usageCounter).not.toBeVisible();
  });
});
