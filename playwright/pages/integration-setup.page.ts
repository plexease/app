import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class IntegrationSetupPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /integration setup/i });
  }

  get formInput(): Locator {
    return this.platformAInput;
  }

  get platformAInput(): Locator {
    return this.main.locator('input#platform-a-input');
  }

  get platformBInput(): Locator {
    return this.main.locator('input#platform-b-input');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get stepsSection(): Locator {
    return this.main.getByRole("heading", { name: /setup steps/i }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/integration-setup");
  }

  async setupIntegration(platformA: string, platformB: string) {
    await this.platformAInput.fill(platformA);
    await this.platformBInput.fill(platformB);
    await this.submitButton.click();
  }
}
