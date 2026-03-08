import { test, expect } from "../../fixtures";
import { DependencyAuditPage } from "../../pages/dependency-audit.page";

test.describe("Dependency Audit", () => {
  test("free user submits and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.dependencyAudit(freeUserPage, "success");

    const audit = new DependencyAuditPage(freeUserPage);
    await audit.goto();

    await audit.auditDependencies('<PackageReference Include="Stripe.NET" Version="43.0.0" />');

    await expect(audit.summaryCard).toBeVisible({ timeout: 5000 });
    await expect(audit.dependenciesCard).toBeVisible();
    await expect(audit.recommendationsCard).toBeVisible();
  });

  test("shows status badges in dependency table", async ({ freeUserPage, mockApi }) => {
    await mockApi.dependencyAudit(freeUserPage, "success");

    const audit = new DependencyAuditPage(freeUserPage);
    await audit.goto();

    await audit.auditDependencies('<PackageReference Include="Stripe.NET" Version="43.0.0" />');

    await expect(audit.dependenciesCard).toBeVisible({ timeout: 5000 });
    await expect(freeUserPage.getByText("Vulnerable", { exact: true })).toBeVisible();
    await expect(freeUserPage.getByText("Outdated", { exact: true }).first()).toBeVisible();
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.dependencyAudit(freeUserPage, "success");

    const audit = new DependencyAuditPage(freeUserPage);
    await audit.goto();

    await expect(audit.languageSelect).toBeVisible();
    await audit.languageSelect.selectOption("python");
    await expect(audit.languageSelect).toHaveValue("python");
  });

  test("submit disabled without dependency file", async ({ freeUserPage }) => {
    const audit = new DependencyAuditPage(freeUserPage);
    await audit.goto();

    await expect(audit.submitButton).toBeDisabled();
  });

  test("pro user sees no usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.dependencyAudit(proUserPage, "success");

    const audit = new DependencyAuditPage(proUserPage);
    await audit.goto();

    await expect(audit.usageCounter).not.toBeVisible();
  });
});
