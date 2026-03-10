import { test, expect } from "../../fixtures";
import { TroubleshooterPage } from "../../pages/troubleshooter.page";

test.describe("Troubleshooter", () => {
  test("free user submits problem and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.troubleshooter(freeUserPage, "success");

    const troubleshooter = new TroubleshooterPage(freeUserPage);
    await troubleshooter.goto();

    await troubleshooter.diagnose("Orders aren't syncing from Shopify to Xero since yesterday");

    await expect(troubleshooter.likelyCauseSection).toBeVisible({ timeout: 5000 });
    await expect(troubleshooter.diagnosticStepsSection).toBeVisible();
  });

  test("shows What's Next section after diagnosis", async ({ freeUserPage, mockApi }) => {
    await mockApi.troubleshooter(freeUserPage, "success");

    const troubleshooter = new TroubleshooterPage(freeUserPage);
    await troubleshooter.goto();

    await troubleshooter.diagnose("Orders aren't syncing from Shopify to Xero since yesterday");

    await expect(troubleshooter.whatsNextSection).toBeVisible({ timeout: 5000 });
  });

  test("submit disabled without problem", async ({ freeUserPage }) => {
    const troubleshooter = new TroubleshooterPage(freeUserPage);
    await troubleshooter.goto();

    await expect(troubleshooter.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.troubleshooter(freeUserPage, "error");

    const troubleshooter = new TroubleshooterPage(freeUserPage);
    await troubleshooter.goto();

    await troubleshooter.diagnose("Orders aren't syncing");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.troubleshooter(proUserPage, "success");

    const troubleshooter = new TroubleshooterPage(proUserPage);
    await troubleshooter.goto();

    await expect(troubleshooter.usageCounter).toBeVisible();
  });
});
