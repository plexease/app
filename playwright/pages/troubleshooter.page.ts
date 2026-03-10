import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class TroubleshooterPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /troubleshooter/i });
  }

  get formInput(): Locator {
    return this.problemInput;
  }

  get problemInput(): Locator {
    return this.main.locator("textarea#problem-input");
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get likelyCauseSection(): Locator {
    return this.main.getByRole("heading", { name: /likely cause/i }).locator("..");
  }

  get diagnosticStepsSection(): Locator {
    return this.main.getByRole("heading", { name: /diagnostic steps/i }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/troubleshooter");
  }

  async diagnose(problem: string) {
    await this.problemInput.fill(problem);
    await this.submitButton.click();
  }
}
