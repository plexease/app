import type { Page } from "@playwright/test";

export class NuGetAdvisorPage {
  constructor(private page: Page) {}

  readonly packageInput = this.page.locator('input[id="package-name"]');
  readonly submitButton = this.page.locator('button[type="submit"]');
  readonly whatItDoesCard = this.page.getByText("What it does").locator("..");
  readonly alternativesCard = this.page.getByText("Alternatives").locator("..");
  readonly compatibilityCard = this.page.getByText("Compatibility").locator("..");
  readonly versionAdviceCard = this.page.getByText("Version advice").locator("..");
  readonly limitReachedMessage = this.page.getByText("You've used all 20 free lookups");
  readonly upgradeButton = this.page.locator('a[href="/upgrade"]');
  readonly usageCounter = this.page.getByText(/\d+ of 20 free lookups/);

  async goto() {
    await this.page.goto("/tools/nuget-advisor");
  }

  async analysePackage(name: string) {
    await this.packageInput.fill(name);
    await this.submitButton.click();
  }
}
