import type { Page } from "@playwright/test";

export class DashboardPage {
  constructor(private page: Page) {}

  readonly heading = this.page.locator("h1", { hasText: "Dashboard" });
  readonly upgradeLink = this.page.locator('a[href="/upgrade"]');
  readonly usageCard = this.page.getByText("Usage").locator("..");
  readonly nugetAdvisorLink = this.page.locator('a[href="/tools/nuget-advisor"]');
  readonly manageBillingButton = this.page.getByText("Manage Subscription");

  async goto() {
    await this.page.goto("/dashboard");
  }
}
