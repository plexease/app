import type { Page } from "@playwright/test";

export class DashboardPage {
  constructor(private page: Page) {}

  private readonly main = this.page.locator("main");
  readonly heading = this.main.locator("h1", { hasText: "Dashboard" });
  readonly upgradeLink = this.main.locator('a[href="/upgrade"]');
  readonly usageCard = this.main.getByText("Usage", { exact: true }).locator("..");
  readonly toolLink = this.main.locator('a[href="/tools/how-it-works"]');
  readonly manageBillingButton = this.main.getByText("Manage Subscription");

  // Persona views
  readonly heroInput = this.main.locator("#hero-input");
  readonly recommendedSection = this.main.getByText("Recommended for you");
  readonly getStartedSection = this.main.getByText("Get started");
  readonly allToolsHeading = this.main.getByText("All Tools");

  // Sidebar categories
  readonly sidebar = this.page.locator("aside");
  readonly exploreCategory = this.sidebar.getByText("Explore");
  readonly setUpCategory = this.sidebar.getByText("Set Up");
  readonly troubleshootCategory = this.sidebar.getByText("Troubleshoot");
  readonly maintainCategory = this.sidebar.getByText("Maintain");

  // View toggle
  readonly viewToggle = this.sidebar.getByText("View as").locator("..");
  readonly businessButton = this.sidebar.getByRole("button", { name: "Business" });
  readonly supportButton = this.sidebar.getByRole("button", { name: "Support" });
  readonly implementerButton = this.sidebar.getByRole("button", { name: "Implementer" });

  async goto() {
    await this.page.goto("/dashboard");
  }
}
