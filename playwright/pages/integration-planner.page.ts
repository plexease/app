import type { Locator } from "@playwright/test";
import { ToolPageBase } from "./tool-page.base";

export class IntegrationPlannerPage extends ToolPageBase {
  get heading(): Locator {
    return this.main.getByRole("heading", { name: /integration planner/i });
  }

  get formInput(): Locator {
    return this.descriptionInput;
  }

  get descriptionInput(): Locator {
    return this.main.locator('textarea[id="description-input"]');
  }

  get submitButton(): Locator {
    return this.main.locator('button[type="submit"]');
  }

  get languageSelect(): Locator {
    return this.main.locator('select[id="stack-language"]');
  }

  get approachCard(): Locator {
    return this.main.getByRole("heading", { name: "Recommended approach" }).locator("..");
  }

  get packagesCard(): Locator {
    return this.main.getByRole("heading", { name: "Recommended packages" }).locator("..");
  }

  get architectureCard(): Locator {
    return this.main.getByRole("heading", { name: "Architecture overview" }).locator("..");
  }

  get considerationsCard(): Locator {
    return this.main.getByRole("heading", { name: "Considerations" }).locator("..");
  }

  get whatsNextSection(): Locator {
    return this.main.getByRole("heading", { name: /what's next/i }).locator("..");
  }

  async goto() {
    await this.page.goto("/tools/integration-planner");
  }

  async planIntegration(description: string, language = "csharp") {
    await this.languageSelect.selectOption(language);
    await this.descriptionInput.fill(description);
    await this.submitButton.click();
  }
}
