import { test, expect } from "../../fixtures";
import { HealthCheckerPage } from "../../pages/health-checker.page";

test.describe("Health Checker", () => {
  test("free user submits config and sees result cards", async ({ freeUserPage, mockApi }) => {
    await mockApi.healthChecker(freeUserPage, "success");

    const checker = new HealthCheckerPage(freeUserPage);
    await checker.goto();

    await checker.checkHealth("webhookEndpoint: http://localhost:3000/webhook");

    await expect(checker.configStatusCard).toBeVisible({ timeout: 5000 });
    await expect(checker.issuesCard).toBeVisible();
    await expect(checker.recommendationsCard).toBeVisible();
  });

  test("shows severity badges on issues", async ({ freeUserPage, mockApi }) => {
    await mockApi.healthChecker(freeUserPage, "success");

    const checker = new HealthCheckerPage(freeUserPage);
    await checker.goto();

    await checker.checkHealth("webhookEndpoint: http://localhost:3000/webhook");

    await expect(checker.issuesCard).toBeVisible({ timeout: 5000 });
    await expect(checker.issuesCard.getByText("Critical")).toBeVisible();
    await expect(checker.issuesCard.getByText("Warning")).toBeVisible();
    await expect(checker.issuesCard.getByText("Info")).toBeVisible();
  });

  test("language selector is visible and functional", async ({ freeUserPage, mockApi }) => {
    await mockApi.healthChecker(freeUserPage, "success");

    const checker = new HealthCheckerPage(freeUserPage);
    await checker.goto();

    await expect(checker.languageSelect).toBeVisible();
    await checker.languageSelect.selectOption("python");
    await expect(checker.languageSelect).toHaveValue("python");
  });

  test("submit disabled without config", async ({ freeUserPage }) => {
    const checker = new HealthCheckerPage(freeUserPage);
    await checker.goto();

    await expect(checker.submitButton).toBeDisabled();
  });

  test("shows error message on API failure", async ({ freeUserPage, mockApi }) => {
    await mockApi.healthChecker(freeUserPage, "error");

    const checker = new HealthCheckerPage(freeUserPage);
    await checker.goto();

    await checker.checkHealth("webhookEndpoint: http://localhost:3000/webhook");

    await expect(freeUserPage.getByText(/failed|please try again/i)).toBeVisible({ timeout: 5000 });
  });

  test("pro user sees no usage counter", async ({ proUserPage, mockApi }) => {
    await mockApi.healthChecker(proUserPage, "success");

    const checker = new HealthCheckerPage(proUserPage);
    await checker.goto();

    await expect(checker.usageCounter).not.toBeVisible();
  });
});
