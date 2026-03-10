import { test, expect } from "../../fixtures";
import { IntegrationSetupPage } from "../../pages/integration-setup.page";

test.describe("Integration Setup", () => {
  test("free user submits platforms and sees setup steps", async ({ freeUserPage, mockApi }) => {
    await mockApi.integrationSetup(freeUserPage, "success");

    const setup = new IntegrationSetupPage(freeUserPage);
    await setup.goto();

    await setup.setupIntegration("Shopify", "Xero");

    await expect(setup.stepsSection).toBeVisible({ timeout: 5000 });
    await expect(setup.stepsSection.getByText("1")).toBeVisible();
    await expect(setup.stepsSection.getByText("2")).toBeVisible();
  });

  test("shows What's Next section after results", async ({ freeUserPage, mockApi }) => {
    await mockApi.integrationSetup(freeUserPage, "success");

    const setup = new IntegrationSetupPage(freeUserPage);
    await setup.goto();

    await setup.setupIntegration("Shopify", "Xero");

    await expect(setup.whatsNextSection).toBeVisible({ timeout: 5000 });
  });

  test("submit disabled without platforms", async ({ freeUserPage }) => {
    const setup = new IntegrationSetupPage(freeUserPage);
    await setup.goto();

    await expect(setup.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.integrationSetup(freeUserPage, "error");

    const setup = new IntegrationSetupPage(freeUserPage);
    await setup.goto();

    await setup.setupIntegration("Shopify", "Xero");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.integrationSetup(proUserPage, "success");

    const setup = new IntegrationSetupPage(proUserPage);
    await setup.goto();

    await expect(setup.usageCounter).toBeVisible();
  });
});
