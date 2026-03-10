import { test, expect } from "../../fixtures";
import { IntegrationBlueprintPage } from "../../pages/integration-blueprint.page";

test.describe("Integration Blueprint", () => {
  test("free user submits and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.integrationBlueprint(freeUserPage, "success");

    const planner = new IntegrationBlueprintPage(freeUserPage);
    await planner.goto();

    await planner.planIntegration("I need to integrate Stripe for subscription billing");

    await expect(planner.approachCard).toBeVisible({ timeout: 5000 });
    await expect(planner.packagesCard).toBeVisible();
    await expect(planner.architectureCard).toBeVisible();
    await expect(planner.considerationsCard).toBeVisible();
  });

  test("shows What's Next section after results", async ({ freeUserPage, mockApi }) => {
    await mockApi.integrationBlueprint(freeUserPage, "success");

    const planner = new IntegrationBlueprintPage(freeUserPage);
    await planner.goto();

    await planner.planIntegration("I need to integrate Stripe for subscription billing");

    await expect(planner.whatsNextSection).toBeVisible({ timeout: 5000 });
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.integrationBlueprint(freeUserPage, "success");

    const planner = new IntegrationBlueprintPage(freeUserPage);
    await planner.goto();

    await expect(planner.languageSelect).toBeVisible();
    await planner.languageSelect.selectOption("python");
    await expect(planner.languageSelect).toHaveValue("python");
  });

  test("submit disabled without description", async ({ freeUserPage }) => {
    const planner = new IntegrationBlueprintPage(freeUserPage);
    await planner.goto();

    await expect(planner.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.integrationBlueprint(freeUserPage, "error");

    const planner = new IntegrationBlueprintPage(freeUserPage);
    await planner.goto();

    await planner.planIntegration("I need to integrate Stripe for subscription billing");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.integrationBlueprint(proUserPage, "success");

    const planner = new IntegrationBlueprintPage(proUserPage);
    await planner.goto();

    await expect(planner.usageCounter).toBeVisible();
  });
});
