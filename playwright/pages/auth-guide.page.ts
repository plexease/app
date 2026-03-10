import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class AuthGuidePage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /auth guide/i });
  }

  get formInput(): Locator {
    return this.serviceInput;
  }

  get serviceInput(): Locator {
    return this.main.locator("input#service-input");
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get authMethodSection(): Locator {
    return this.main.getByRole("heading", { name: /auth method/i }).locator("..");
  }

  get stepsSection(): Locator {
    return this.main.getByRole("heading", { name: /setup steps/i }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/auth-guide");
  }

  async getGuide(service: string) {
    await this.serviceInput.fill(service);
    await this.submitButton.click();
  }
}
