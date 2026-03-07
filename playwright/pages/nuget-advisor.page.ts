import type { Page } from "@playwright/test";

export class NuGetAdvisorPage {
  constructor(private page: Page) {}

  private readonly main = this.page.locator("main");
  readonly packageInput = this.main.locator('input[id="package-name"]');
  readonly submitButton = this.main.locator('button[type="submit"]');
  readonly whatItDoesCard = this.main.getByText("What it does").locator("..");
  readonly alternativesCard = this.main.getByText("Alternatives").locator("..");
  readonly compatibilityCard = this.main.getByText("Compatibility").locator("..");
  readonly versionAdviceCard = this.main.getByText("Version advice").locator("..");
  readonly limitReachedMessage = this.main.getByText("You've used all 20 free lookups");
  readonly upgradeButton = this.main.locator('a[href="/upgrade"]');
  readonly usageCounter = this.main.getByText(/\d+ of 20 free lookups/);

  async goto() {
    await this.page.goto("/tools/nuget-advisor");
  }

  async analysePackage(name: string) {
    await this.packageInput.fill(name);
    await this.submitButton.click();
  }
}
