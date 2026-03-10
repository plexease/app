import { test, expect } from "../../fixtures";
import { WebhookBuilderPage } from "../../pages/webhook-builder.page";

test.describe("Webhook Builder", () => {
  test("submits and shows result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.webhookBuilder(freeUserPage, "success");
    const builder = new WebhookBuilderPage(freeUserPage);
    await builder.goto();
    await builder.buildWebhook("Shopify", "Slack");
    await expect(builder.sourceSetupSection).toBeVisible({ timeout: 5000 });
    await expect(builder.targetSetupSection).toBeVisible();
    await expect(builder.payloadFormatSection).toBeVisible();
    await expect(builder.testingSection).toBeVisible();
    await expect(builder.securityNotesSection).toBeVisible();
  });

  test("shows What's Next section after results", async ({ freeUserPage, mockApi }) => {
    await mockApi.webhookBuilder(freeUserPage, "success");
    const builder = new WebhookBuilderPage(freeUserPage);
    await builder.goto();
    await builder.buildWebhook("Shopify", "Slack");
    await expect(builder.whatsNextSection).toBeVisible({ timeout: 5000 });
  });

  test("submit disabled without inputs", async ({ freeUserPage }) => {
    const builder = new WebhookBuilderPage(freeUserPage);
    await builder.goto();
    await expect(builder.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.webhookBuilder(freeUserPage, "error");
    const builder = new WebhookBuilderPage(freeUserPage);
    await builder.goto();
    await builder.buildWebhook("Shopify", "Slack");
    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("shows usage counter", async ({ freeUserPage, mockApi }) => {
    await mockApi.webhookBuilder(freeUserPage, "success");
    const builder = new WebhookBuilderPage(freeUserPage);
    await builder.goto();
    await expect(builder.usageCounter).toBeVisible();
  });
});
