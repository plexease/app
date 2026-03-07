import type { Page } from "@playwright/test";

export class SignupPage {
  constructor(private page: Page) {}

  readonly emailInput = this.page.locator('input[id="email"]');
  readonly passwordInput = this.page.locator('input[id="password"]');
  readonly submitButton = this.page.locator('button[type="submit"]');

  async goto() {
    await this.page.goto("/signup");
  }

  async signup(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async fillForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }
}
