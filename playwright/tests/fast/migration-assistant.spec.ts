import { test, expect } from "../../fixtures";
import { MigrationAssistantPage } from "../../pages/migration-assistant.page";

test.describe("Migration Assistant", () => {
  test("free user submits migration and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.migrationAssistant(freeUserPage, "success");

    const assistant = new MigrationAssistantPage(freeUserPage);
    await assistant.goto();

    await assistant.planMigration(".NET 6", ".NET 8", "<TargetFramework>net6.0</TargetFramework>");

    await expect(assistant.migrationStepsCard).toBeVisible({ timeout: 5000 });
    await expect(assistant.breakingChangesCard).toBeVisible();
    await expect(assistant.estimatedEffortCard).toBeVisible();
  });

  test("shows numbered migration steps", async ({ freeUserPage, mockApi }) => {
    await mockApi.migrationAssistant(freeUserPage, "success");

    const assistant = new MigrationAssistantPage(freeUserPage);
    await assistant.goto();

    await assistant.planMigration(".NET 6", ".NET 8", "<TargetFramework>net6.0</TargetFramework>");

    await expect(assistant.migrationStepsCard).toBeVisible({ timeout: 5000 });
    // Verify step numbers are visible
    await expect(assistant.migrationStepsCard.getByText("1")).toBeVisible();
    await expect(assistant.migrationStepsCard.getByText("2")).toBeVisible();
    await expect(assistant.migrationStepsCard.getByText("3")).toBeVisible();
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.migrationAssistant(freeUserPage, "success");

    const assistant = new MigrationAssistantPage(freeUserPage);
    await assistant.goto();

    await expect(assistant.languageSelect).toBeVisible();
    await assistant.languageSelect.selectOption("python");
    await expect(assistant.languageSelect).toHaveValue("python");
  });

  test("submit disabled without required fields", async ({ freeUserPage }) => {
    const assistant = new MigrationAssistantPage(freeUserPage);
    await assistant.goto();

    await expect(assistant.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.migrationAssistant(freeUserPage, "error");

    const assistant = new MigrationAssistantPage(freeUserPage);
    await assistant.goto();

    await assistant.planMigration(".NET 6", ".NET 8", "<TargetFramework>net6.0</TargetFramework>");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees no usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.migrationAssistant(proUserPage, "success");

    const assistant = new MigrationAssistantPage(proUserPage);
    await assistant.goto();

    await expect(assistant.usageCounter).not.toBeVisible();
  });
});
