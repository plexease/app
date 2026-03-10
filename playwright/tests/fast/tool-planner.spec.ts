import { test, expect } from "../../fixtures";
import { ToolPlannerPage } from "../../pages/tool-planner.page";

test.describe("Tool Planner", () => {
  test("submits and shows recommendation cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.toolPlanner(freeUserPage, "success");
    const planner = new ToolPlannerPage(freeUserPage);
    await planner.goto();
    await planner.planTools("I need payment processing and accounting");
    await expect(planner.recommendationsSection).toBeVisible({ timeout: 5000 });
    await expect(planner.stackOverviewCard).toBeVisible();
  });

  test("shows What's Next section after results", async ({ freeUserPage, mockApi }) => {
    await mockApi.toolPlanner(freeUserPage, "success");
    const planner = new ToolPlannerPage(freeUserPage);
    await planner.goto();
    await planner.planTools("I need payment processing and accounting");
    await expect(planner.whatsNextSection).toBeVisible({ timeout: 5000 });
  });

  test("submit disabled without description", async ({ freeUserPage }) => {
    const planner = new ToolPlannerPage(freeUserPage);
    await planner.goto();
    await expect(planner.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.toolPlanner(freeUserPage, "error");
    const planner = new ToolPlannerPage(freeUserPage);
    await planner.goto();
    await planner.planTools("I need payment processing and accounting");
    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("shows usage counter", async ({ freeUserPage, mockApi }) => {
    await mockApi.toolPlanner(freeUserPage, "success");
    const planner = new ToolPlannerPage(freeUserPage);
    await planner.goto();
    await expect(planner.usageCounter).toBeVisible();
  });
});
