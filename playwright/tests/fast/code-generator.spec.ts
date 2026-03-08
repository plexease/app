import { test, expect } from "../../fixtures";
import { CodeGeneratorPage } from "../../pages/code-generator.page";

test.describe("Code Generator", () => {
  test("free user submits and sees generated files", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeGenerator(freeUserPage, "success");

    const generator = new CodeGeneratorPage(freeUserPage);
    await generator.goto();

    await generator.generateCode("Generate Stripe payment integration");

    await expect(generator.firstFileCard).toBeVisible({ timeout: 5000 });
    await expect(generator.setupInstructionsCard).toBeVisible();
  });

  test("shows copy button on generated files", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeGenerator(freeUserPage, "success");

    const generator = new CodeGeneratorPage(freeUserPage);
    await generator.goto();

    await generator.generateCode("Generate Stripe payment integration");

    await expect(generator.copyButton).toBeVisible({ timeout: 5000 });
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.codeGenerator(freeUserPage, "success");

    const generator = new CodeGeneratorPage(freeUserPage);
    await generator.goto();

    await expect(generator.languageSelect).toBeVisible();
    await generator.languageSelect.selectOption("python");
    await expect(generator.languageSelect).toHaveValue("python");
  });

  test("submit disabled without spec", async ({ freeUserPage }) => {
    const generator = new CodeGeneratorPage(freeUserPage);
    await generator.goto();

    await expect(generator.submitButton).toBeDisabled();
  });

  test("pro user sees no usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.codeGenerator(proUserPage, "success");

    const generator = new CodeGeneratorPage(proUserPage);
    await generator.goto();

    await expect(generator.usageCounter).not.toBeVisible();
  });
});
