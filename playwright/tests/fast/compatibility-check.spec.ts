import { test, expect } from "../../fixtures";
import { CompatibilityCheckPage } from "../../pages/compatibility-check.page";

test.describe("Compatibility Check", () => {
  test("free user submits and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.compatibilityCheck(freeUserPage, "success");

    const audit = new CompatibilityCheckPage(freeUserPage);
    await audit.goto();

    await audit.auditDependencies('<PackageReference Include="Stripe.NET" Version="43.0.0" />');

    await expect(audit.summaryCard).toBeVisible({ timeout: 5000 });
    await expect(audit.dependenciesCard).toBeVisible();
    await expect(audit.recommendationsCard).toBeVisible();
  });

  test("shows status badges in dependency table", async ({ freeUserPage, mockApi }) => {
    await mockApi.compatibilityCheck(freeUserPage, "success");

    const audit = new CompatibilityCheckPage(freeUserPage);
    await audit.goto();

    await audit.auditDependencies('<PackageReference Include="Stripe.NET" Version="43.0.0" />');

    await expect(audit.dependenciesCard).toBeVisible({ timeout: 5000 });
    await expect(freeUserPage.getByText("Vulnerable", { exact: true })).toBeVisible();
    await expect(freeUserPage.getByText("Outdated", { exact: true }).first()).toBeVisible();
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.compatibilityCheck(freeUserPage, "success");

    const audit = new CompatibilityCheckPage(freeUserPage);
    await audit.goto();

    await expect(audit.languageSelect).toBeVisible();
    await audit.languageSelect.selectOption("python");
    await expect(audit.languageSelect).toHaveValue("python");
  });

  test("submit disabled without dependency file", async ({ freeUserPage }) => {
    const audit = new CompatibilityCheckPage(freeUserPage);
    await audit.goto();

    await expect(audit.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.compatibilityCheck(freeUserPage, "error");

    const audit = new CompatibilityCheckPage(freeUserPage);
    await audit.goto();

    await audit.auditDependencies('<PackageReference Include="Stripe.NET" Version="43.0.0" />');

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.compatibilityCheck(proUserPage, "success");

    const audit = new CompatibilityCheckPage(proUserPage);
    await audit.goto();

    await expect(audit.usageCounter).toBeVisible();
  });
});
