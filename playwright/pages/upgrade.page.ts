import type { Page } from "@playwright/test";

export class UpgradePage {
  constructor(private page: Page) {}

  readonly heading = this.page.locator("h1", { hasText: "Upgrade to Pro" });
  readonly monthlyToggle = this.page.getByText("Monthly");
  readonly annualToggle = this.page.getByText("Annual");
  readonly subscribeButton = this.page.getByRole("button", { name: "Subscribe" });

  async goto() {
    await this.page.goto("/upgrade");
  }

  async clickSubscribe() {
    await this.subscribeButton.click();
  }
}
