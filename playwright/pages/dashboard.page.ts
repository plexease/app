import type { Page } from "@playwright/test";

export class DashboardPage {
  constructor(private page: Page) {}

  private readonly main = this.page.locator("main");
  readonly heading = this.main.locator("h1", { hasText: "Dashboard" });
  readonly upgradeLink = this.main.locator('a[href="/upgrade"]');
  readonly usageCard = this.main.getByText("Usage").locator("..");
  readonly toolLink = this.main.locator('a[href="/tools/code-explainer"]');
  readonly manageBillingButton = this.main.getByText("Manage Subscription");

  async goto() {
    await this.page.goto("/dashboard");
  }
}
