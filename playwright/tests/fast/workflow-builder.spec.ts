import { test, expect } from "../../fixtures";
import { WorkflowBuilderPage } from "../../pages/workflow-builder.page";

test.describe("Workflow Builder", () => {
  test("free user submits and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.workflowBuilder(freeUserPage, "success");

    const builder = new WorkflowBuilderPage(freeUserPage);
    await builder.goto();

    await builder.designWorkflow("When a new order comes in on Shopify, create an invoice in Xero");

    await expect(builder.triggerSection).toBeVisible({ timeout: 5000 });
    await expect(builder.stepsSection).toBeVisible();
  });

  test("shows What's Next section after results", async ({ freeUserPage, mockApi }) => {
    await mockApi.workflowBuilder(freeUserPage, "success");

    const builder = new WorkflowBuilderPage(freeUserPage);
    await builder.goto();

    await builder.designWorkflow("When a new order comes in on Shopify, create an invoice in Xero");

    await expect(builder.whatsNextSection).toBeVisible({ timeout: 5000 });
  });

  test("submit disabled without description", async ({ freeUserPage }) => {
    const builder = new WorkflowBuilderPage(freeUserPage);
    await builder.goto();

    await expect(builder.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.workflowBuilder(freeUserPage, "error");

    const builder = new WorkflowBuilderPage(freeUserPage);
    await builder.goto();

    await builder.designWorkflow("When a new order comes in on Shopify, create an invoice in Xero");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.workflowBuilder(proUserPage, "success");

    const builder = new WorkflowBuilderPage(proUserPage);
    await builder.goto();

    await expect(builder.usageCounter).toBeVisible();
  });
});
